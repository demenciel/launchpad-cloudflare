import { db } from "@worker/db";
import { account, session, user, verification } from "@worker/db/schema";
import { scheduleWelcomeEmail } from "@worker/email";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export const auth = (
	env: Env,
	executionContext?: Pick<ExecutionContext, "waitUntil">,
) => {
	return betterAuth({
		database: drizzleAdapter(db(env), {
			provider: "sqlite",
			schema: {
				account,
				session,
				user,
				verification,
			},
		}),
		baseURL: env.BETTER_AUTH_URL,
		secret: env.BETTER_AUTH_SECRET,
		trustedOrigins: [env.BETTER_AUTH_URL],
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 days
			updateAge: 60 * 60 * 24, // 1 day (session expiration is updated every day)
			cookieCache: {
				enabled: true, // Enable cookie caching to reduce database calls
				maxAge: 5 * 60, // Cache for 5 minutes
			},
		},
		advanced: {
			useSecureCookies: env.ENVIRONMENT === "production",
			defaultCookieAttributes: { sameSite: "lax" },
		},
		emailAndPassword: {
			enabled: false,
		},
		socialProviders: {
			google: {
				clientId: env.GOOGLE_CLIENT_ID,
				clientSecret: env.GOOGLE_CLIENT_SECRET,
			},
			github: {
				clientId: env.GITHUB_CLIENT_ID,
				clientSecret: env.GITHUB_CLIENT_SECRET,
			},
		},
		databaseHooks: {
			user: {
				create: {
					after: async (user) => {
						await scheduleWelcomeEmail(env, user, executionContext);
					},
				},
			},
		},
	});
};
