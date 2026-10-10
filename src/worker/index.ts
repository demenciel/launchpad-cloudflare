import { auth } from "@worker/auth";
import { sessionMiddleware } from "@worker/middleware/session";
import { aiRoute } from "@worker/routes/ai";
import { authDemoRoute } from "@worker/routes/auth-demo";
import { postsRoute } from "@worker/routes/posts";
import type { HonoContext } from "@worker/types/hono";
import { Hono } from "hono";
import { logger } from "hono/logger";

const app = new Hono<HonoContext>();

app.use("*", logger());
app.use("*", sessionMiddleware());

const apiRoutes = app
	.basePath("/api")
	.get("/", (c) => c.text("Hello World"))
	.route("/posts", postsRoute)
	.route("/ai", aiRoute)
	.route("/auth-demo", authDemoRoute)
	.all("/auth/*", (c) => {
		const authHandler = auth(c.env, c.executionCtx).handler;
		return authHandler(c.req.raw);
	});

export default app;
export type ApiRoutes = typeof apiRoutes;
