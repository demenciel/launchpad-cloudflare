import path from "node:path";
import { fileURLToPath } from "node:url";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import icon from "astro-icon";
import { defineConfig } from "astro/config";

const root = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
	output: "static",
	outDir: "./dist/site",
	trailingSlash: "never",
	build: { format: "file" },
	server: { host: "127.0.0.1", port: 5173 },
	devToolbar: { enabled: false },
	integrations: [react(), icon({ include: { tabler: ["*"] } })],
	vite: {
		plugins: [
			tailwindcss(),
			tanstackRouter({
				target: "react",
				autoCodeSplitting: true,
				routesDirectory: "src/client/routes",
				generatedRouteTree: "src/client/routeTree.gen.ts",
			}),
		],
		resolve: {
			alias: {
				"~": path.resolve(root, "src"),
				"@client": path.resolve(root, "src/client"),
				"@shared": path.resolve(root, "src/shared"),
				"@worker": path.resolve(root, "src/worker"),
			},
		},
		server: {
			strictPort: true,
			proxy: {
				"/api": { target: "http://127.0.0.1:8787", changeOrigin: false },
			},
		},
	},
});
