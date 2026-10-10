import { MotionProvider } from "@client/components/animated";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RouterProvider, createRouter } from "@tanstack/react-router";
import { StrictMode } from "react";
import { routeTree } from "./routeTree.gen";

const queryClient = new QueryClient();

// Create a new router instance
const router = createRouter({
	routeTree,
	defaultPreload: "intent",
});

// Register the router instance for type safety
declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

export default function App() {
	return (
		<StrictMode>
			<QueryClientProvider client={queryClient}>
				<MotionProvider>
					<RouterProvider router={router} />
				</MotionProvider>
			</QueryClientProvider>
		</StrictMode>
	);
}
