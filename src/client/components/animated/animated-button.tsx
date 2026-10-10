import { buttonVariants } from "@client/components/ui/button";
import { cn } from "@client/lib/utils";
import type { VariantProps } from "class-variance-authority";
import { type HTMLMotionProps, m, useReducedMotion } from "motion/react";

/** Native button with the same variants as Button; no wrapper alters layout. */
export function AnimatedButton({
	className,
	variant,
	size,
	disabled,
	...props
}: HTMLMotionProps<"button"> & VariantProps<typeof buttonVariants>) {
	const reduced = useReducedMotion();
	return (
		<m.button
			type="button"
			className={cn(buttonVariants({ variant, size, className }))}
			disabled={disabled}
			whileHover={reduced || disabled ? undefined : { scale: 1.02 }}
			whileTap={reduced || disabled ? undefined : { scale: 0.98 }}
			{...props}
		/>
	);
}
