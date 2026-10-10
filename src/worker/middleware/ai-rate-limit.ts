import type { HonoContext } from "@worker/types/hono";
import { createMiddleware } from "hono/factory";

export const aiRateLimit = () =>
	createMiddleware<HonoContext>(async (c, next) => {
		const user = c.get("user");
		if (!user) {
			return c.json({ error: "Unauthorized" }, 401);
		}
		const origin = c.req.header("Origin");
		if (origin && origin !== new URL(c.env.BETTER_AUTH_URL).origin) {
			return c.json(
				{
					success: false,
					error: { code: "FORBIDDEN", message: "Invalid request origin." },
				},
				403,
			);
		}
		if (!c.env.AI_RATE_LIMITER) {
			return c.json(
				{
					success: false,
					error: {
						code: "NOT_CONFIGURED",
						message: "AI rate limiting is not configured.",
					},
				},
				503,
			);
		}
		const { success } = await c.env.AI_RATE_LIMITER.limit({
			key: `ai:${user.id}`,
		});
		if (!success) {
			c.header("Retry-After", "60");
			return c.json(
				{
					success: false,
					error: {
						code: "RATE_LIMITED",
						message: "Too many AI requests. Please try again in a minute.",
					},
				},
				429,
			);
		}
		return next();
	});
