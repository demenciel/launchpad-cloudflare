import { type HTMLMotionProps, m, useReducedMotion } from "motion/react";

export function Stagger({ children, ...props }: HTMLMotionProps<"div">) {
	const reduced = useReducedMotion();
	return (
		<m.div
			initial={reduced ? false : "hidden"}
			animate="visible"
			variants={{
				hidden: {},
				visible: { transition: { staggerChildren: reduced ? 0 : 0.06 } },
			}}
			{...props}
		>
			{children}
		</m.div>
	);
}

export function StaggerItem({ children, ...props }: HTMLMotionProps<"div">) {
	const reduced = useReducedMotion();
	return (
		<m.div
			variants={{
				hidden: { opacity: 0, y: reduced ? 0 : 10 },
				visible: {
					opacity: 1,
					y: 0,
					transition: { duration: reduced ? 0 : 0.25 },
				},
			}}
			{...props}
		>
			{children}
		</m.div>
	);
}
