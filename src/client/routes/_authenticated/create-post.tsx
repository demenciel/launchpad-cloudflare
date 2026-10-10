import { useAppForm } from "@client/components/form";
import { Button } from "@client/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import { Label } from "@client/components/ui/label"; // Import Label
import { api } from "@client/lib/api";
import { createPostSchema } from "@shared/schema/post";
import { useMutation } from "@tanstack/react-query";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { SparklesIcon } from "lucide-react"; // Using lucide-react for icons
import { useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/create-post")({
	component: CreatePost,
});

function CreatePost() {
	const navigate = useNavigate();
	const [titleValue, setTitleValue] = useState("");

	const form = useAppForm({
		defaultValues: {
			title: "",
			content: "",
		},
		validators: {
			onSubmit: createPostSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					const res = await api.posts.$post({ json: value });

					if (!res.ok) {
						return {
							form: "Failed to create post. Please try again.",
						};
					}

					toast.success("Post created successfully!");
					navigate({ to: "/dashboard" });
					return null; // Important: return null for success
				} catch (_error) {
					return {
						form: "An unexpected error occurred while creating the post.",
					};
				}
			},
		},
	});

	const generateContentMutation = useMutation({
		mutationFn: async (title: string) => {
			const result = await api.ai["generate-content"].$post({
				json: { title },
			});

			if (!result.ok) {
				const errorData = (await result.json()) as {
					error?: { message?: string };
					success: boolean;
				};
				throw new Error(
					errorData.error?.message || "Failed to generate content",
				);
			}

			const data = (await result.json()) as {
				success: boolean;
				data?: { content: string };
				error?: { message?: string };
			};
			return data;
		},
		onSuccess: (data) => {
			if (data.success && data.data?.content) {
				form.setFieldValue("content", data.data.content);
				toast.success("AI content generated successfully!");
			} else if (data.success && !data.data?.content) {
				toast.info("AI generated empty content. Please try a different title.");
			} else if (!data.success && data.error?.message) {
				toast.error(data.error.message);
			}
		},
		onError: (error) => {
			toast.error(
				error.message ||
					"An unexpected error occurred while generating content.",
			);
		},
	});

	useEffect(() => {
		const unsubscribe = form.store.subscribe(() => {
			const currentTitle = form.getFieldValue("title");
			setTitleValue(currentTitle || "");
		});
		return unsubscribe;
	}, [form]);

	const handleGenerateContent = () => {
		const title = titleValue.trim();
		if (!title) {
			toast.error("Please enter a title first to generate content.");
			return;
		}
		if (title.length < 5) {
			toast.error("Title must be at least 5 characters long.");
			return;
		}
		generateContentMutation.mutate(title);
	};

	return (
		<div className="max-w-2xl mx-auto w-full">
			<form
				onSubmit={(e) => {
					e.preventDefault();
					e.stopPropagation();
					form.handleSubmit();
				}}
			>
				<Card>
					<CardHeader>
						<CardTitle className="text-2xl">Create New Post</CardTitle>
						<CardDescription>
							Fill in the details below to create your new post. You can also
							use AI to help generate content based on your title.
						</CardDescription>
					</CardHeader>
					<CardContent className="space-y-6">
						<form.AppField name="title">
							{(field) => (
								<field.TextInput
									label="Title"
									placeholder="Enter a catchy title for your post"
								/>
							)}
						</form.AppField>

						<form.AppField name="content">
							{(field) => (
								<div className="space-y-2">
									<div className="flex items-center justify-between">
										<Label htmlFor={field.name}>Content</Label>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={handleGenerateContent}
											disabled={
												generateContentMutation.isPending ||
												titleValue.trim().length < 5
											}
										>
											{generateContentMutation.isPending ? (
												<>
													<div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
													Generating...
												</>
											) : (
												<>
													<SparklesIcon className="mr-2 h-4 w-4" />
													Generate with AI
												</>
											)}
										</Button>
									</div>
									<field.TextAreaField
										label="" // Pass empty label as visual label is separate
										placeholder="Write your post content here, or generate it with AI..."
										rows={10}
										// id prop removed as it's not supported; component should use 'name' internally for id
									/>
								</div>
							)}
						</form.AppField>
						<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
							{(formError) =>
								formError && typeof formError.form === "string" ? (
									<p className="text-sm text-destructive text-center">
										{formError.form}
									</p>
								) : null
							}
						</form.Subscribe>
					</CardContent>
					<CardFooter>
						<form.AppForm>
							<form.SubmitButton
								className="w-full"
								loadingText="Creating Post..."
							>
								Create Post
							</form.SubmitButton>
						</form.AppForm>
					</CardFooter>
				</Card>
			</form>
		</div>
	);
}
