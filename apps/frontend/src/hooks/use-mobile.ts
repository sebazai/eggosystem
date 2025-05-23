import * as React from "react";

const MOBILE_BREAKPOINT = 768;

export function useIsMobile(passMobile?: boolean) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    passMobile
  );
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false);

  React.useEffect(() => {
    const getOrientation = (): boolean => {
      const orientation = window.screen.orientation?.type || "";
      if (orientation) {
        return (
          orientation.startsWith("landscape") &&
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          navigator?.userAgentData?.mobile
        );
      }

      return false;
    };

    const check = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      setIsLandscape(getOrientation());
    };

    check();

    const handleOrientationChange = () => setIsLandscape(getOrientation());

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", check);
    window.addEventListener("resize", check);
    window.screen.orientation?.addEventListener(
      "change",
      handleOrientationChange
    );

    return () => {
      mql.removeEventListener("change", check);
      window.removeEventListener("resize", check);
      window.screen.orientation?.removeEventListener(
        "change",
        handleOrientationChange
      );
    };
  }, []);

  return { isMobile: !!isMobile, isLandscape };
}
