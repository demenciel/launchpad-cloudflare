import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const command = (name) => path.join(root, "node_modules", ".bin", name);
const children = [];
let stopping = false;

function stop(code = 0) {
	if (stopping) {
		return;
	}
	stopping = true;
	for (const child of children) {
		child.kill("SIGTERM");
	}
	process.exitCode = code;
}

for (const [name, args] of [
	[
		"wrangler",
		["dev", "--ip", "127.0.0.1", "--port", "8787", "--assets", "public"],
	],
	["astro", ["dev", "--host", "127.0.0.1", "--port", "5173"]],
]) {
	const child = spawn(command(name), args, {
		cwd: root,
		stdio: "inherit",
		env: {
			...process.env,
			// Keep Astro attached to this supervisor in agent environments, too.
			...(name === "astro" ? { ASTRO_DEV_BACKGROUND: "1" } : {}),
			WRANGLER_LOG_PATH:
				process.env.WRANGLER_LOG_PATH || path.join(root, ".wrangler", "logs"),
		},
	});
	children.push(child);
	child.on("error", (error) => {
		console.error(`${name} could not start: ${error.message}`);
		stop(1);
	});
	child.on("exit", (code, signal) => {
		if (!stopping) {
			stop(signal ? 1 : code || 0);
		}
	});
}
process.on("SIGINT", () => stop());
process.on("SIGTERM", () => stop());
