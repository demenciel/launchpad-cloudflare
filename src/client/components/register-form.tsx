import { useAppForm } from "@client/components/form";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@client/components/ui/card";
import { signUp } from "@client/lib/auth-client";
import { cn } from "@client/lib/utils";
import { registerSchema } from "@shared/schema/auth";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";

export function RegisterForm({
	className,
	...props
}: React.ComponentProps<"div">) {
	const navigate = useNavigate();

	const form = useAppForm({
		defaultValues: {
			name: "",
			email: "",
			password: "",
			confirmPassword: "",
		},
		validators: {
			onSubmit: registerSchema,
			onSubmitAsync: async ({ value }) => {
				try {
					const { name, email, password } = value;
					const result = await signUp.email({ name, email, password });

					// Check if the result indicates an error
					if (result?.error) {
						return {
							form: result.error.message || "Registration failed",
						};
					}

					// Success! Handle the redirect here
					navigate({ to: "/dashboard" });

					return undefined; // No errors
				} catch (_error) {
					// Fallback error handling for any unexpected errors
					return {
						form: "An unexpected error occurred during registration",
					};
				}
			},
		},
	});

	return (
		<div className={cn("flex flex-col gap-6", className)} {...props}>
			<Card>
				<CardHeader className="text-center">
					<CardTitle className="text-xl">Create an account</CardTitle>
					<CardDescription>
						Enter your details below to register.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							e.stopPropagation();
							form.handleSubmit();
						}}
						className="grid gap-6"
					>
						<div className="grid gap-3">
							<form.AppField name="name">
								{(field) => (
									<field.TextInput
										label="Name"
										type="text"
										placeholder="Your Name"
									/>
								)}
							</form.AppField>
						</div>
						<div className="grid gap-3">
							<form.AppField name="email">
								{(field) => (
									<field.TextInput
										label="Email"
										type="email"
										placeholder="m@example.com"
									/>
								)}
							</form.AppField>
						</div>
						<div className="grid gap-3">
							<form.AppField name="password">
								{(field) => (
									<field.TextInput label="Password" type="password" />
								)}
							</form.AppField>
						</div>
						<div className="grid gap-3">
							<form.AppField name="confirmPassword">
								{(field) => (
									<field.TextInput label="Confirm Password" type="password" />
								)}
							</form.AppField>
						</div>
						<form.AppForm>
							<form.Subscribe selector={(state) => state.errorMap.onSubmit}>
								{(formError) =>
									formError &&
									typeof formError === "object" &&
									"form" in formError &&
									typeof formError.form === "string" ? (
										<div className="text-sm text-red-500 text-center mb-3">
											{formError.form}
										</div>
									) : null
								}
							</form.Subscribe>

							<form.SubmitButton
								className="w-full"
								loadingText="Creating account..."
							>
								Create account
							</form.SubmitButton>
						</form.AppForm>
						<div className="text-center text-sm">
							Already have an account?{" "}
							<Link to="/login" className="underline underline-offset-4">
								Login
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
			<div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
				By clicking continue, you agree to our{" "}
				<a href="/terms">Terms of Service</a> and{" "}
				<a href="/privacy">Privacy Policy</a>.
			</div>
		</div>
	);
}
