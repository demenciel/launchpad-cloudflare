import { LoginForm } from "@client/components/login-form";
import { redirectIfAuthenticated } from "@client/lib/auth-utils";
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const loginSearchSchema = z.object({
	redirect: z.string().optional(),
});

export const Route = createFileRoute("/login")({
	validateSearch: loginSearchSchema,
	loader: async () => {
		await redirectIfAuthenticated();
	},
	component: RouteComponent,
});

function RouteComponent() {
	return (
		<div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 md:gap-20 items-center min-h-[65vh]">
			<div className="hidden md:block">
				<p className="text-xs tracking-widest text-primary font-medium mb-5">
					YOUR NEXT CHAPTER
				</p>
				<h1 className="text-5xl font-semibold tracking-tighter leading-[1.12]">
					Good things start
					<br />
					with a hello.
				</h1>
				<p className="mt-5 text-muted-foreground leading-relaxed max-w-sm">
					A space to think, create, and find a little momentum. Make yourself at
					home.
				</p>
				<div className="mt-9 rounded-3xl bg-accent p-9 max-w-sm relative overflow-hidden">
					<svg
						viewBox="0 0 240 135"
						className="w-full text-primary"
						fill="none"
						aria-hidden="true"
					>
						<title>A fresh beginning</title>
						<circle
							cx="120"
							cy="67"
							r="60"
							stroke="currentColor"
							opacity=".15"
						/>
						<circle
							cx="120"
							cy="67"
							r="42"
							stroke="currentColor"
							opacity=".25"
						/>
						<rect
							x="92"
							y="39"
							width="56"
							height="56"
							rx="16"
							fill="currentColor"
						/>
						<path
							d="m107 79 13-23 13 23M112 69h16M105 85h30"
							stroke="var(--primary-foreground)"
							strokeWidth="2"
						/>
						<circle cx="180" cy="67" r="6" fill="currentColor" />
						<circle cx="77" cy="25" r="4" fill="currentColor" opacity=".5" />
					</svg>
					<p className="text-center text-xs text-muted-foreground mt-5">
						One sign-in. A world of possibility.
					</p>
				</div>
			</div>
			<div className="w-full max-w-md mx-auto">
				<h1 className="md:hidden text-3xl font-semibold tracking-tight text-center mb-8">
					Good things start with a hello.
				</h1>
				<LoginForm />
			</div>
		</div>
	);
}
