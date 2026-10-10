import { type HTMLMotionProps, m, useReducedMotion } from "motion/react";

export function Reveal({
	children,
	delay = 0,
	...props
}: HTMLMotionProps<"div"> & { delay?: number }) {
	const reduced = useReducedMotion();
	return (
		<m.div
			initial={reduced ? false : { opacity: 0, y: 12 }}
			animate={{ opacity: 1, y: 0 }}
			transition={{ duration: reduced ? 0 : 0.3, delay: reduced ? 0 : delay }}
			{...props}
		>
			{children}
		</m.div>
	);
}
