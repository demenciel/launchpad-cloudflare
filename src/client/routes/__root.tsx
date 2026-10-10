import { Button } from "@client/components/ui/button";
import { authClient, useSession } from "@client/lib/auth-client";
import {
	Link,
	Outlet,
	createRootRoute,
	useRouter,
} from "@tanstack/react-router";
import { ArrowUpRight, MoonIcon, SunIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Toaster, toast } from "sonner";

export const Route = createRootRoute({ component: Root });

function ThemeToggle() {
	const [theme, setTheme] = useState(() =>
		document.documentElement.classList.contains("dark") ? "dark" : "light",
	);
	function toggleTheme() {
		const next = theme === "dark" ? "light" : "dark";
		setTheme(next);
		document.documentElement.classList.toggle("dark", next === "dark");
		try {
			localStorage.setItem("theme", next);
		} catch {}
		document.dispatchEvent(new Event("aw:theme-change"));
	}
	return (
		<Button
			variant="ghost"
			size="icon"
			onClick={toggleTheme}
			aria-label="Toggle color theme"
			aria-pressed={theme === "dark"}
		>
			{theme === "dark" ? (
				<SunIcon aria-hidden="true" />
			) : (
				<MoonIcon aria-hidden="true" />
			)}
		</Button>
	);
}

function NavBar() {
	const { data: session, isPending } = useSession();
	const [loggingOut, setLoggingOut] = useState(false);
	async function logout() {
		setLoggingOut(true);
		try {
			const result = await authClient.signOut();
			if (result.error) {
				throw new Error("Unable to sign out. Please try again.");
			}
			window.location.assign("/");
		} catch {
			toast.error("Unable to sign out. Please try again.");
			setLoggingOut(false);
		}
	}
	return (
		<header className="site-header">
			<nav className="workspace-nav" aria-label="Workspace navigation">
				<a href="/" className="brand" aria-label="Launchpad home">
					<span className="brand-mark" aria-hidden="true">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							strokeWidth="2"
						>
							<title>Launchpad</title>
							<path d="m5 17 7-12 7 12M8 12h8M4 20h16" />
						</svg>
					</span>
					Launchpad
				</a>
				{!isPending && session && (
					<div className="workspace-tabs">
						<Link to="/dashboard">Overview</Link>
						<Link to="/create-post">Create a post</Link>
						<Link to="/ai">AI assistant</Link>
						<Link to="/profile">Profile</Link>
					</div>
				)}
				<div className="flex items-center gap-2">
					<ThemeToggle />
					{session ? (
						<Button
							variant="outline"
							size="sm"
							onClick={logout}
							disabled={loggingOut}
						>
							{loggingOut ? "Signing out…" : "Sign out"}
						</Button>
					) : (
						<a
							href="/"
							className="text-xs text-muted-foreground flex gap-1 items-center"
						>
							Back to home{" "}
							<ArrowUpRight className="w-3 h-3" aria-hidden="true" />
						</a>
					)}
				</div>
			</nav>
		</header>
	);
}

function Root() {
	const router = useRouter();
	useEffect(() => {
		const error = new URLSearchParams(window.location.search).get("error");
		if (error) {
			toast.error("Sign-in didn't finish. Please try again.");
			router.navigate({ to: "/login", replace: true });
		}
	}, [router]);
	return (
		<div className="workspace">
			<NavBar />
			<main id="main-content" className="workspace-main">
				<Outlet />
			</main>
			<Toaster position="top-right" />
		</div>
	);
}
