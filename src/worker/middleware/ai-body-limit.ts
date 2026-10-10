import type { HonoContext } from "@worker/types/hono";
import { createMiddleware } from "hono/factory";

/** Bound actual bytes, including requests without Content-Length. */
export const aiBodyLimit = () =>
	createMiddleware<HonoContext>(async (c, next) => {
		const reader = c.req.raw.body?.getReader();
		if (!reader) {
			return next();
		}
		const chunks: Uint8Array[] = [];
		let size = 0;
		while (true) {
			const { done, value } = await reader.read();
			if (done) {
				break;
			}
			size += value.byteLength;
			if (size > 16 * 1024) {
				await reader.cancel();
				return c.json(
					{
						success: false,
						error: {
							code: "BODY_TOO_LARGE",
							message: "Request body is too large.",
						},
					},
					413,
				);
			}
			chunks.push(value);
		}
		const body = new Uint8Array(size);
		let offset = 0;
		for (const chunk of chunks) {
			body.set(chunk, offset);
			offset += chunk.byteLength;
		}
		c.req.raw = new Request(c.req.raw, { body });
		return next();
	});
