import * as React from "react";

const MOBILE_BREAKPOINT = 768;

function detectMobile() {
  const toMatch = [
    /Android/i,
    /webOS/i,
    /iPhone/i,
    /BlackBerry/i,
    /Windows Phone/i
  ];

  return toMatch.some((toMatchItem) => {
    return navigator.userAgent.match(toMatchItem);
  });
}

export function useIsMobile(passMobile?: boolean) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    passMobile
  );
  const [isLandscape, setIsLandscape] = React.useState<boolean>(false);

  console.log(`Mobile ${isMobile} in landscape ${isLandscape}`);

  React.useEffect(() => {
    const getOrientation = (): boolean => {
      const orientation = window.screen.orientation?.type || "";
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      const userAgentMobile = navigator?.userAgentData?.mobile;

      if (orientation) {
        return (
          orientation.startsWith("landscape") &&
          (userAgentMobile || detectMobile())
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
