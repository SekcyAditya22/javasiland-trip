import { m, useReducedMotion } from "framer-motion";

// Keep page changes subtle; data refreshes and inputs retain their state.
export default function PageTransition({
  children,
  transitionKey,
  as: Element = "div",
  className = "",
}) {
  const reduced = useReducedMotion();
  const MotionElement = m[Element];
  return (
    <MotionElement
      key={transitionKey}
      className={`page-transition ${className}`.trim()}
      initial={reduced ? false : { opacity: 0.9 }}
      animate={{ opacity: 1 }}
      transition={{ duration: reduced ? 0 : 0.16, ease: "easeOut" }}
    >
      {children}
    </MotionElement>
  );
}
