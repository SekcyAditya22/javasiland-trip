import { Link } from "react-router-dom";
import { returnNavigation } from "../lib/scrollPositions";

export default function BackLink({ to, children, state, ...props }) {
  const destination = returnNavigation(to);
  return (
    <Link
      {...props}
      to={destination.to}
      state={{ ...state, restoreScrollPosition: destination.position }}
    >
      {children}
    </Link>
  );
}
