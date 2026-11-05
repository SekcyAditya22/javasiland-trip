import { LazyMotion, MotionConfig } from "framer-motion";

const loadFeatures = () =>
  import("../lib/motionFeatures").then((module) => module.default);

export default function MotionProvider({ children }) {
  return (
    <LazyMotion features={loadFeatures} strict>
      <MotionConfig reducedMotion="user">{children}</MotionConfig>
    </LazyMotion>
  );
}
