/** Secrets are set in .dev.vars locally and with Wrangler secrets in production. */
interface Env {
	BETTER_AUTH_SECRET: string;
	BETTER_AUTH_URL: string;
	GOOGLE_CLIENT_ID: string;
	GOOGLE_CLIENT_SECRET: string;
	GITHUB_CLIENT_ID: string;
	GITHUB_CLIENT_SECRET: string;
	RESEND_API_KEY: string;
	EMAIL_FROM: string;
	OPENAI_API_KEY: string;
}
