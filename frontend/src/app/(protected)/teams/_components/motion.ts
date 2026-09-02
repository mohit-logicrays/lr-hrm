import type { Variants } from "framer-motion";

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: [0.4, 0, 0.2, 1] },
  },
};

export const staggerContainer: Variants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 18, scale: 0.98 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
  },
};

export const sheetVariants: Variants = {
  hidden: { x: "100%" },
  show: {
    x: 0,
    transition: { duration: 0.32, ease: [0.4, 0, 0.2, 1] },
  },
  exit: {
    x: "100%",
    transition: { duration: 0.25, ease: [0.4, 0, 0.2, 1] },
  },
};

export const EASE = [0.4, 0, 0.2, 1] as const;