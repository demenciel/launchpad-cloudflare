import { afterEach, describe, expect, mock, spyOn, test } from "bun:test";
import { auth } from "../src/worker/auth";
import { scheduleWelcomeEmail, sendEmail } from "../src/worker/email";
import { notificationEmail, welcomeEmail } from "../src/worker/email/templates";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
	mock.restore();
});
const env = {
	APP_NAME: "MyApp",
	BETTER_AUTH_URL: "https://app.example.com",
	BETTER_AUTH_SECRET: "a-long-test-secret-of-more-than-thirty-two-characters",
	RESEND_API_KEY: "re_test",
	EMAIL_FROM: "MyApp <hello@example.com>",
	GOOGLE_CLIENT_ID: "google-id",
	GOOGLE_CLIENT_SECRET: "google-secret",
	GITHUB_CLIENT_ID: "github-id",
	GITHUB_CLIENT_SECRET: "github-secret",
	ENVIRONMENT: "production",
	DB: {},
} as unknown as Env;
const user = { id: "new-user", name: "Alex", email: "alex@example.com" };

function mockEmail(status = 200) {
	const fetchMock = mock(
		async () =>
			new Response(
				JSON.stringify(
					status === 200
						? { id: "email_123" }
						: { name: "validation_error", message: "private failure" },
				),
				{ status, headers: { "Content-Type": "application/json" } },
			),
	);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	return fetchMock;
}

describe("email and auth integration", () => {
	test("configures Google and GitHub and an explicit Worker auth secret", () => {
		const instance = auth(env);
		expect(instance.options.socialProviders?.google?.clientId).toBe(
			"google-id",
		);
		expect(instance.options.socialProviders?.github?.clientId).toBe(
			"github-id",
		);
		expect(instance.options.secret).toBe(env.BETTER_AUTH_SECRET);
		expect(instance.options.baseURL).toBe(env.BETTER_AUTH_URL);
	});
	test("schedules welcome email on user creation with an idempotency key", async () => {
		const fetchMock = mockEmail();
		const pending: Promise<unknown>[] = [];
		const instance = auth(env, {
			waitUntil: (promise) => {
				pending.push(promise);
			},
		});
		const hook = instance.options.databaseHooks?.user?.create?.after;
		expect(hook).toBeDefined();
		await hook?.({
			...user,
			emailVerified: true,
			createdAt: new Date(),
			updatedAt: new Date(),
		});
		expect(pending).toHaveLength(1);
		await Promise.all(pending);
		expect(fetchMock).toHaveBeenCalledTimes(1);
		const [url, options] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(String(url)).toBe("https://api.resend.com/emails");
		expect(new Headers(options.headers).get("Idempotency-Key")).toBe(
			"welcome/new-user",
		);
		expect(JSON.parse(options.body as string)).toMatchObject({
			to: [user.email],
			from: env.EMAIL_FROM,
			subject: "Welcome to MyApp",
		});
		expect(
			instance.options.databaseHooks?.session?.create?.after,
		).toBeUndefined();
	});
	test("email failures do not reject the signup hook", async () => {
		mockEmail(422);
		const logged = spyOn(console, "error").mockImplementation(() => {});
		await scheduleWelcomeEmail(env, user);
		expect(logged).toHaveBeenCalledWith("Welcome email delivery failed.");
	});
	test("template configuration errors do not reject the signup hook", async () => {
		const fetchMock = mockEmail();
		spyOn(console, "error").mockImplementation(() => {});
		await scheduleWelcomeEmail({ ...env, BETTER_AUTH_URL: "invalid" }, user);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("skips email when credentials are not configured", async () => {
		const fetchMock = mockEmail();
		const result = await sendEmail(
			{ ...env, RESEND_API_KEY: "" },
			user.email,
			welcomeEmail({
				name: user.name,
				appName: "MyApp",
				appUrl: env.BETTER_AUTH_URL,
			}),
			"test",
		);
		expect(result).toEqual({ skipped: true });
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("escapes user-controlled content and includes a plain-text alternative", () => {
		const template = welcomeEmail({
			name: '<script>alert("x")</script>',
			appName: "A & B",
			appUrl: "https://example.com/?a=1&b=2",
		});
		expect(template.html).not.toContain("<script>");
		expect(template.html).toContain("&lt;script&gt;");
		expect(template.html).toContain("A &amp; B");
		expect(template.text).toContain('alert("x")');
		expect(template.text).toContain("https://example.com/?a=1&b=2");
	});
	test("reusable notification template rejects unsafe action URLs", () => {
		expect(() =>
			notificationEmail({
				appName: "MyApp",
				heading: "Update",
				message: "Hello",
				action: { label: "Open", url: "javascript:alert(1)" },
			}),
		).toThrow();
	});
});
