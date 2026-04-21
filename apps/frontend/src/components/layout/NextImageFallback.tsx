"use client";

import { createNextUrl } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";

type WithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

function withImageFallback(WrappedComponent: typeof Image) {
  return function ImageWithFallback(props: WithFallbackProps) {
    const { fallbackSrc, ...rest } = props;

    const resolved = createNextUrl(fallbackSrc ?? "/team-images/nologo.png");

    return (
      <WrappedComponent
        {...rest}
        onError={(event) => {
          const target = event.target as HTMLImageElement;
          if (target.srcset === resolved) return; // already showing fallback — stop the loop
          target.srcset = resolved;
        }}
      />
    );
  };
}

export const NextImageFallback = withImageFallback(Image);
