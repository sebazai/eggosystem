"use client";

import { createNextUrl } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";

type WithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

const DEFAULT_FILL_SIZES = "(max-width: 768px) 100vw, 50vw";

function withImageFallback(WrappedComponent: typeof Image) {
  return function ImageWithFallback(props: WithFallbackProps) {
    const { fallbackSrc, fill, sizes, ...rest } = props;

    const resolved = createNextUrl(fallbackSrc ?? "/team-images/nologo.png");
    const resolvedSizes =
      sizes ?? (fill === true ? DEFAULT_FILL_SIZES : undefined);

    return (
      <WrappedComponent
        {...rest}
        fill={fill}
        sizes={resolvedSizes}
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
