import { useEffect, useState } from "react";

const MOBILE_BREAKPOINT = 768; // matches Tailwind's `md`

// Tracks whether the viewport is below the `md` breakpoint so the dashboard
// shell can decide between the desktop collapse and the mobile drawer.
export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => setIsMobile(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
