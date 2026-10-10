import { authClient } from "@client/lib/auth-client";
import { redirect } from "@tanstack/react-router";

/**
 * Checks if user is authenticated and redirects to home if they are.
 * Use this in routes like /login and /register where authenticated users shouldn't have access.
 * This can be used in Router loader functions.
 */
export const redirectIfAuthenticated = async () => {
	const result = await authClient.getSession();
	const session = result.data;

	if (session?.user) {
		throw redirect({ to: "/dashboard", replace: true });
	}
};
