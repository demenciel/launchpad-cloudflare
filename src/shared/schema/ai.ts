import { z } from "zod";

export const generateContentRequestSchema = z.object({
	title: z.string().min(5, "Title is required").max(200, "Title too long"),
});

export const openAIRequestSchema = z.object({
	prompt: z
		.string()
		.trim()
		.min(1, "Enter a prompt")
		.max(4000, "Prompt is too long"),
});

export type OpenAIRequest = z.infer<typeof openAIRequestSchema>;

export const generateContentResponseSchema = z.object({
	content: z.string().optional(),
	error: z.string().optional(),
	success: z.boolean(),
});

export type GenerateContentRequest = z.infer<
	typeof generateContentRequestSchema
>;
export type GenerateContentResponse = z.infer<
	typeof generateContentResponseSchema
>;
