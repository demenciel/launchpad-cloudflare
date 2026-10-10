import { afterEach, describe, expect, mock, test } from "bun:test";
import { Hono } from "hono";
import { aiRoute } from "../src/worker/routes/ai";
import type { HonoContext } from "../src/worker/types/hono";

const originalFetch = globalThis.fetch;
afterEach(() => {
	globalThis.fetch = originalFetch;
});

function setup({
	authenticated = true,
	allowed = true,
	configured = true,
} = {}) {
	const limiter = mock(async () => ({ success: allowed }));
	const env = {
		BETTER_AUTH_URL: "https://app.example.com",
		OPENAI_API_KEY: configured ? "server-secret" : "",
		OPENAI_MODEL: "test-model",
		AI_RATE_LIMITER: { limit: limiter },
	} as unknown as Env;
	const app = new Hono<HonoContext>();
	app.use("*", async (c, next) => {
		c.set(
			"user",
			authenticated
				? {
						id: "user-123",
						email: "user@example.com",
						name: "User",
						emailVerified: true,
						createdAt: new Date(),
						updatedAt: new Date(),
					}
				: null,
		);
		await next();
	});
	app.route("/api/ai", aiRoute);
	const request = (
		body: unknown = { prompt: "Hello" },
		headers: Record<string, string> = {},
		path = "/openai",
	) =>
		app.request(
			`/api/ai${path}`,
			{
				method: "POST",
				headers: { "Content-Type": "application/json", ...headers },
				body: JSON.stringify(body),
			},
			env,
		);
	return { request, limiter, env };
}

function mockProvider(
	status = 200,
	payload: unknown = {
		id: "resp_test",
		object: "response",
		output: [
			{
				type: "message",
				role: "assistant",
				content: [
					{ type: "output_text", text: "A helpful answer.", annotations: [] },
				],
			},
		],
	},
) {
	const fetchMock = mock(
		async () =>
			new Response(JSON.stringify(payload), {
				status,
				headers: { "Content-Type": "application/json" },
			}),
	);
	globalThis.fetch = fetchMock as unknown as typeof fetch;
	return fetchMock;
}

describe("authenticated OpenAI API", () => {
	test("rejects unauthenticated callers before consuming rate limit or calling OpenAI", async () => {
		const fetchMock = mockProvider();
		const { request, limiter } = setup({ authenticated: false });
		expect((await request()).status).toBe(401);
		expect(limiter).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("validates empty, oversized, and wrong-type prompts before calling provider", async () => {
		const fetchMock = mockProvider();
		const { request, limiter } = setup();
		for (const prompt of ["   ", "x".repeat(4001), 123]) {
			expect((await request({ prompt })).status).toBe(400);
		}
		expect(limiter).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("rejects oversized request bodies", async () => {
		const { request } = setup();
		expect((await request({ prompt: "x".repeat(17000) })).status).toBe(413);
	});
	test("rejects cross-origin requests", async () => {
		const fetchMock = mockProvider();
		const { request, limiter } = setup();
		expect(
			(
				await request(
					{ prompt: "Hello" },
					{ Origin: "https://other.example.com" },
				)
			).status,
		).toBe(403);
		expect(limiter).not.toHaveBeenCalled();
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("returns 429 with Retry-After without calling the provider", async () => {
		const fetchMock = mockProvider();
		const { request, limiter } = setup({ allowed: false });
		const response = await request();
		expect(response.status).toBe(429);
		expect(response.headers.get("Retry-After")).toBe("60");
		expect(limiter).toHaveBeenCalledWith({ key: "ai:user-123" });
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("shares rate-limit key with the existing Workers AI endpoint", async () => {
		const { request, limiter } = setup({ allowed: false });
		expect(
			(await request({ title: "A test title" }, {}, "/generate-content"))
				.status,
		).toBe(429);
		expect(limiter).toHaveBeenCalledWith({ key: "ai:user-123" });
	});
	test("fails closed when the limiter binding is absent", async () => {
		const fetchMock = mockProvider();
		const { request, env } = setup();
		(env as Partial<Env>).AI_RATE_LIMITER = undefined;
		expect((await request()).status).toBe(503);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("reports missing API key without calling provider", async () => {
		const fetchMock = mockProvider();
		const { request } = setup({ configured: false });
		expect((await request()).status).toBe(503);
		expect(fetchMock).not.toHaveBeenCalled();
	});
	test("uses server credentials and bounded Responses API settings", async () => {
		const fetchMock = mockProvider();
		const { request } = setup();
		const response = await request(
			{ prompt: "  Help me  " },
			{ Origin: "https://app.example.com" },
		);
		expect(response.status).toBe(200);
		expect(await response.json()).toEqual({
			success: true,
			data: { content: "A helpful answer." },
		});
		const [url, options] = fetchMock.mock.calls[0] as unknown as [
			string,
			RequestInit,
		];
		expect(String(url)).toBe("https://api.openai.com/v1/responses");
		expect(new Headers(options.headers).get("Authorization")).toBe(
			"Bearer server-secret",
		);
		expect(JSON.parse(options.body as string)).toMatchObject({
			input: "Help me",
			model: "test-model",
			max_output_tokens: 512,
			store: false,
		});
	});
	test("sanitizes upstream failures and does not retry", async () => {
		const fetchMock = mockProvider(500, {
			error: { message: "private provider diagnostic", type: "server_error" },
		});
		const { request } = setup();
		const response = await request();
		expect(response.status).toBe(502);
		expect(await response.text()).not.toContain("private provider diagnostic");
		expect(fetchMock).toHaveBeenCalledTimes(1);
	});
	test("maps upstream rate limits to a retryable 429", async () => {
		mockProvider(429, {
			error: { message: "quota", type: "rate_limit_error" },
		});
		const { request } = setup();
		const response = await request();
		expect(response.status).toBe(429);
		expect(response.headers.get("Retry-After")).toBe("60");
	});
});
