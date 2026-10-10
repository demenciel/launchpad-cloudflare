import { zValidator } from "@hono/zod-validator";
import {
	generateContentRequestSchema,
	openAIRequestSchema,
} from "@shared/schema/ai";
import { requireAuth } from "@worker/middleware";
import { aiBodyLimit } from "@worker/middleware/ai-body-limit";
import { aiRateLimit } from "@worker/middleware/ai-rate-limit";
import type { HonoContext } from "@worker/types/hono";
import { generateText } from "ai";
import { Hono } from "hono";
import OpenAI from "openai";
import { createWorkersAI } from "workers-ai-provider";

export const aiRoute = new Hono<HonoContext>()
	.use("*", requireAuth())
	.use("*", aiBodyLimit())
	.post(
		"/generate-content",
		zValidator("json", generateContentRequestSchema),
		aiRateLimit(),
		async (c) => {
			const { title } = c.req.valid("json");

			try {
				const workersai = createWorkersAI({ binding: c.env.AI });
				const result = await generateText({
					model: workersai("@cf/meta/llama-3.2-1b-instruct"),
					prompt: `Write a single paragraph (maximum 200 words) expanding on this topic: "${title}". Make it informative and engaging. Do not include a title or heading.`,
					maxTokens: 250,
					temperature: 0.7,
				});

				return c.json({
					success: true,
					data: { content: result.text },
				});
			} catch (_error) {
				return c.json(
					{
						success: false,
						error: {
							code: "INTERNAL_SERVER_ERROR",
							message: "Failed to generate content. Please try again.",
						},
					},
					500,
				);
			}
		},
	)
	.post(
		"/openai",
		zValidator("json", openAIRequestSchema),
		aiRateLimit(),
		async (c) => {
			if (!c.env.OPENAI_API_KEY) {
				return c.json(
					{
						success: false,
						error: {
							code: "NOT_CONFIGURED",
							message: "OpenAI is not configured.",
						},
					},
					503,
				);
			}
			try {
				const client = new OpenAI({
					apiKey: c.env.OPENAI_API_KEY,
					timeout: 30_000,
					maxRetries: 0,
				});
				const response = await client.responses.create({
					model: c.env.OPENAI_MODEL,
					instructions: "You are a helpful, concise assistant.",
					input: c.req.valid("json").prompt,
					max_output_tokens: 512,
					store: false,
				});
				return c.json({
					success: true,
					data: { content: response.output_text },
				});
			} catch (error) {
				if (error instanceof OpenAI.APIError && error.status === 429) {
					c.header("Retry-After", "60");
					return c.json(
						{
							success: false,
							error: {
								code: "UPSTREAM_RATE_LIMITED",
								message:
									"The AI service is busy. Please try again in a minute.",
							},
						},
						429,
					);
				}
				return c.json(
					{
						success: false,
						error: {
							code: "UPSTREAM_ERROR",
							message: "Failed to generate a response. Please try again.",
						},
					},
					502,
				);
			}
		},
	);
