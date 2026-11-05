import { m, useReducedMotion } from "framer-motion";

const viewport = { once: true, amount: 0.05, margin: "0px 0px -12px 0px" };

export default function ScrollReveal({
  children,
  as = "div",
  className,
  ...props
}) {
  const reduced = useReducedMotion();
  const Element = m[as];
  return (
    <Element
      {...props}
      className={className}
      initial={reduced ? false : { opacity: 0.92, y: 3 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={viewport}
      transition={{ duration: reduced ? 0 : 0.16, ease: "easeOut" }}
    >
      {children}
    </Element>
  );
}
