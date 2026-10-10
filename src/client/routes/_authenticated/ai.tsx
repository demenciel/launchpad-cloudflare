import { AnimatedButton, Reveal } from "@client/components/animated";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import { Label } from "@client/components/ui/label";
import { Textarea } from "@client/components/ui/textarea";
import { api } from "@client/lib/api";
import { openAIRequestSchema } from "@shared/schema/ai";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, SparklesIcon } from "lucide-react";
import { type FormEvent, useState } from "react";

export const Route = createFileRoute("/_authenticated/ai")({
	component: AIAssistant,
});

function AIAssistant() {
	const [prompt, setPrompt] = useState("");
	const [content, setContent] = useState("");
	const [pending, setPending] = useState(false);
	const [error, setError] = useState<string | null>(null);

	async function generate(event: FormEvent) {
		event.preventDefault();
		if (pending) {
			return;
		}
		const parsed = openAIRequestSchema.safeParse({ prompt });
		if (!parsed.success) {
			setError(parsed.error.issues[0].message);
			return;
		}
		setPending(true);
		setError(null);
		setContent("");
		try {
			const response = await api.ai.openai.$post({ json: parsed.data });
			if (!response.ok) {
				const failure = (await response.json()) as {
					error?: { message?: string };
				};
				throw new Error(
					failure.error?.message ||
						"Unable to generate a response. Please try again.",
				);
			}
			const result = await response.json();
			if ("data" in result) {
				setContent(result.data.content);
			}
		} catch (error) {
			setError(
				error instanceof Error
					? error.message
					: "Unable to connect. Please try again.",
			);
		} finally {
			setPending(false);
		}
	}

	return (
		<Reveal className="max-w-2xl mx-auto w-full">
			<Card>
				<CardHeader>
					<CardTitle className="text-2xl flex items-center gap-2">
						<SparklesIcon aria-hidden="true" /> AI assistant
					</CardTitle>
					<CardDescription>
						Explore an idea, draft something, or ask a question.
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-6">
					<form onSubmit={generate} className="space-y-3">
						<Label htmlFor="prompt">What would you like help with?</Label>
						<Textarea
							id="prompt"
							value={prompt}
							onChange={(event) => setPrompt(event.target.value)}
							rows={5}
							maxLength={4000}
							required
							disabled={pending}
							placeholder="Help me brainstorm three ideas for…"
						/>
						<div className="flex items-center justify-between gap-3">
							<p className="text-xs text-muted-foreground">
								{prompt.length}/4000 characters
							</p>
							<AnimatedButton
								type="submit"
								disabled={pending || !prompt.trim()}
							>
								{pending ? (
									<LoaderCircle
										className="animate-spin motion-reduce:animate-none"
										aria-hidden="true"
									/>
								) : (
									<SparklesIcon aria-hidden="true" />
								)}
								{pending ? "Thinking…" : "Generate response"}
							</AnimatedButton>
						</div>
					</form>
					{error && (
						<p role="alert" className="text-sm text-destructive">
							{error}
						</p>
					)}
					<div aria-live="polite" aria-busy={pending}>
						{content && (
							<Reveal
								key={content}
								className="rounded-lg border bg-muted/30 p-4"
							>
								<h2 className="font-medium mb-2">Response</h2>
								<p className="whitespace-pre-wrap leading-relaxed">{content}</p>
							</Reveal>
						)}
					</div>
				</CardContent>
			</Card>
		</Reveal>
	);
}
