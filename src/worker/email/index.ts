import { Resend } from "resend";
import { type EmailTemplate, welcomeEmail } from "./templates";

type EmailEnv = Pick<
	Env,
	"RESEND_API_KEY" | "EMAIL_FROM" | "APP_NAME" | "BETTER_AUTH_URL"
>;
type WelcomeUser = { id: string; name: string; email: string };

/** Server-only email entry point. Call it from trusted application code. */
export async function sendEmail(
	env: EmailEnv,
	to: string,
	template: EmailTemplate,
	idempotencyKey: string,
) {
	if (!env.RESEND_API_KEY || !env.EMAIL_FROM) {
		return { skipped: true as const };
	}
	const { data, error } = await new Resend(env.RESEND_API_KEY).emails.send(
		{ from: env.EMAIL_FROM, to: [to], ...template },
		{ idempotencyKey, signal: AbortSignal.timeout(10_000) },
	);
	if (error) {
		// Never expose provider payloads, recipient addresses, or secrets.
		throw new Error("Email delivery failed.");
	}
	return { skipped: false as const, id: data?.id };
}

export async function scheduleWelcomeEmail(
	env: EmailEnv,
	user: WelcomeUser,
	executionContext?: Pick<ExecutionContext, "waitUntil">,
) {
	const delivery = Promise.resolve()
		.then(() =>
			sendEmail(
				env,
				user.email,
				welcomeEmail({
					name: user.name,
					appName: env.APP_NAME,
					appUrl: env.BETTER_AUTH_URL,
				}),
				`welcome/${user.id}`,
			),
		)
		.then((result) => {
			if (result.skipped) {
				console.info(
					"Welcome email skipped: configure RESEND_API_KEY and EMAIL_FROM.",
				);
			}
		})
		.catch(() => {
			// Email failure must not prevent account creation or login.
			console.error("Welcome email delivery failed.");
		});
	if (executionContext) {
		executionContext.waitUntil(delivery);
	} else {
		await delivery;
	}
}
