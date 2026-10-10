import { AnimatedButton, Reveal } from "@client/components/animated";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import { signIn } from "@client/lib/auth-client";
import { cn } from "@client/lib/utils";
import { useSearch } from "@tanstack/react-router";
import { GithubIcon, LoaderCircle } from "lucide-react";
import { type ComponentProps, useState } from "react";

export function LoginForm({ className, ...props }: ComponentProps<"div">) {
	const search = useSearch({ from: "/login" });
	const [pending, setPending] = useState<"google" | "github" | null>(null);
	const [error, setError] = useState<string | null>(null);

	async function login(provider: "google" | "github") {
		setPending(provider);
		setError(null);
		// Keep post-login destinations on this application’s origin.
		const redirect = search.redirect;
		const callbackURL =
			redirect?.startsWith("/") &&
			!redirect.startsWith("//") &&
			!redirect.includes("\\")
				? redirect
				: "/dashboard";
		try {
			const result = await signIn.social({
				provider,
				callbackURL,
				errorCallbackURL: "/login",
			});
			if (result.error) {
				setError(
					result.error.message || "Unable to sign in. Please try again.",
				);
				setPending(null);
			}
		} catch {
			setError("Unable to connect. Please try again.");
			setPending(null);
		}
	}

	return (
		<div
			className={cn("flex flex-col items-center gap-6", className)}
			{...props}
		>
			<Reveal className="w-full">
				<Card>
					<CardHeader className="text-center space-y-2 p-6">
						<CardTitle className="text-2xl font-semibold tracking-tight">
							Your workspace awaits
						</CardTitle>
						<CardDescription>
							Sign in to get started, or to pick up where you left off.
						</CardDescription>
					</CardHeader>
					<CardContent className="p-6 pt-0 space-y-3">
						<AnimatedButton
							variant="outline"
							className="w-full h-11 text-base"
							disabled={pending !== null}
							onClick={() => login("google")}
						>
							{pending === "google" ? (
								<LoaderCircle
									className="animate-spin motion-reduce:animate-none"
									aria-hidden="true"
								/>
							) : (
								<svg viewBox="0 0 24 24" aria-hidden="true">
									<title>Google</title>
									<path
										d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
										fill="currentColor"
									/>
								</svg>
							)}
							{pending === "google" ? "Connecting…" : "Continue with Google"}
						</AnimatedButton>
						<AnimatedButton
							variant="outline"
							className="w-full h-11 text-base"
							disabled={pending !== null}
							onClick={() => login("github")}
						>
							{pending === "github" ? (
								<LoaderCircle
									className="animate-spin motion-reduce:animate-none"
									aria-hidden="true"
								/>
							) : (
								<GithubIcon aria-hidden="true" />
							)}
							{pending === "github" ? "Connecting…" : "Continue with GitHub"}
						</AnimatedButton>
						{error && (
							<p role="alert" className="text-sm text-destructive pt-2">
								{error}
							</p>
						)}
						<p className="text-center text-xs text-muted-foreground pt-3">
							New here? Your first sign-in creates your account.
						</p>
					</CardContent>
				</Card>
			</Reveal>
		</div>
	);
}
