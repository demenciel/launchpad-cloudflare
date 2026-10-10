import { Reveal } from "@client/components/animated";
import { Button } from "@client/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@client/components/ui/dialog";
import { Skeleton } from "@client/components/ui/skeleton";
import { api } from "@client/lib/api";
import { useSession } from "@client/lib/auth-client";
import { useQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

export const Route = createFileRoute("/_authenticated/dashboard")({
	component: Dashboard,
});

async function getPosts() {
	const res = await api.posts.$get();
	if (!res.ok) {
		throw new Error("server error");
	}
	const data = await res.json();
	return data;
}

interface Post {
	id: number;
	title: string;
	content: string;
	userId: string;
	createdAt: string;
	updatedAt: string;
}

function Dashboard() {
	const { data: session, isPending: sessionPending } = useSession();
	const [selectedPost, setSelectedPost] = useState<Post | null>(null);
	const [isModalOpen, setIsModalOpen] = useState(false);

	const {
		isPending: postsPending,
		error,
		data,
	} = useQuery({
		queryKey: ["user-posts"],
		queryFn: getPosts,
		enabled: !!session, // Only fetch posts if user is authenticated
	});

	const handlePostClick = (post: Post) => {
		setSelectedPost(post);
		setIsModalOpen(true);
	};

	// Show loading state while checking authentication
	if (sessionPending) {
		return (
			<div className="max-w-2xl mx-auto w-full">
				<Card>
					<CardHeader>
						<Skeleton className="h-8 w-3/4" />
						<Skeleton className="h-4 w-1/2" />
					</CardHeader>
					<CardContent className="space-y-4">
						{Array.from({ length: 3 }, (_, i) => (
							<div
								key={`auth-skeleton-${Date.now()}-${i}`}
								className="flex items-center space-x-4"
							>
								<Skeleton className="h-12 w-12 rounded-full" />
								<div className="space-y-2">
									<Skeleton className="h-4 w-[250px]" />
									<Skeleton className="h-4 w-[200px]" />
								</div>
							</div>
						))}
					</CardContent>
				</Card>
			</div>
		);
	}

	if (!session) {
		return null;
	}

	// Handle API errors
	if (error) {
		return (
			<div className="max-w-2xl mx-auto w-full">
				<Card>
					<CardHeader>
						<CardTitle>Error</CardTitle>
						<CardDescription>Failed to load posts</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-destructive">Error: {error.message}</p>
						<Button
							variant="outline"
							className="mt-4"
							onClick={() => window.location.reload()}
						>
							Try Again
						</Button>
					</CardContent>
				</Card>
			</div>
		);
	}

	// Show user's posts
	return (
		<Reveal className="max-w-4xl mx-auto w-full">
			<Card>
				<CardHeader>
					<CardTitle className="text-3xl">
						<h1>Your workspace</h1>
					</CardTitle>
					<CardDescription>
						Welcome back, {session.user.name || session.user.email}! Make room
						for your next great idea.
					</CardDescription>
				</CardHeader>
				<CardContent>
					{postsPending ? (
						<div className="space-y-4">
							{Array.from({ length: 3 }, (_, i) => (
								<div
									key={`posts-skeleton-${Date.now()}-${i}`}
									className="flex items-start space-x-4 p-4 border rounded-lg"
								>
									<Skeleton className="h-10 w-10 rounded-md" />
									<div className="space-y-2 flex-grow">
										<Skeleton className="h-5 w-3/4" />
										<Skeleton className="h-4 w-1/2" />
									</div>
								</div>
							))}
						</div>
					) : (
						<div className="space-y-6">
							{data?.posts && data.posts.length > 0 ? (
								<div className="space-y-4">
									{data.posts.map((post: Post) => (
										<button
											key={post.id}
											type="button"
											className="w-full p-4 border rounded-lg cursor-pointer hover:bg-accent hover:border-accent-foreground/20 transition-colors text-left focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
											onClick={() => handlePostClick(post)}
											aria-label={`View post: ${post.title}`}
										>
											<h3 className="font-semibold text-lg text-foreground">
												{post.title}
											</h3>
											<p className="text-sm text-muted-foreground mt-1">
												Created: {new Date(post.createdAt).toLocaleDateString()}
											</p>
										</button>
									))}
								</div>
							) : (
								<div className="text-center py-10 border border-dashed rounded-lg">
									<svg
										xmlns="http://www.w3.org/2000/svg"
										fill="none"
										viewBox="0 0 24 24"
										strokeWidth={1.5}
										stroke="currentColor"
										className="w-12 h-12 mx-auto text-muted-foreground mb-3"
										aria-hidden="true" // Hide decorative SVG, text below describes it
									>
										<title>No posts icon</title>
										<path
											strokeLinecap="round"
											strokeLinejoin="round"
											d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
										/>
									</svg>

									<p className="text-muted-foreground mb-4 text-lg">
										Your next story starts here.
									</p>
									<Button asChild size="lg">
										<Link to="/create-post">Write your first post</Link>
									</Button>
								</div>
							)}
							{data?.posts && data.posts.length > 0 && (
								<div className="border-t pt-6 mt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
									<p className="text-sm font-medium text-muted-foreground">
										Total Posts:{" "}
										<span className="text-primary font-semibold">
											{data.posts.length}
										</span>
									</p>
									<Button asChild>
										<Link to="/create-post">Create New Post</Link>
									</Button>
								</div>
							)}
						</div>
					)}
				</CardContent>
			</Card>

			{/* Post Detail Modal */}
			<Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
				<DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto p-6">
					<DialogHeader className="mb-4">
						<DialogTitle className="text-2xl font-semibold">
							{selectedPost?.title}
						</DialogTitle>
						<DialogDescription className="text-sm text-muted-foreground">
							Created on{" "}
							{selectedPost
								? new Date(selectedPost.createdAt).toLocaleDateString()
								: ""}
						</DialogDescription>
					</DialogHeader>
					<div className="prose prose-sm dark:prose-invert max-w-none">
						<p className="whitespace-pre-wrap text-base leading-relaxed text-foreground/90">
							{selectedPost?.content}
						</p>
					</div>
				</DialogContent>
			</Dialog>
		</Reveal>
	);
}

export default Dashboard;
