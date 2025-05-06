"use client";

import { createNextUrl } from "@/lib/utils";
import Image, { type ImageProps } from "next/image";

type WithFallbackProps = ImageProps & {
  fallbackSrc?: string;
};

function withImageFallback(WrappedComponent: typeof Image) {
  return function ImageWithFallback(props: WithFallbackProps) {
    const { fallbackSrc, ...rest } = props;

    return (
      <WrappedComponent
        {...rest}
        onError={(event) => {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-expect-error
          event.target.srcset = createNextUrl(
            fallbackSrc ?? "/teams/nologo.png"
          );
        }}
      />
    );
  };
}

export const NextImageFallback = withImageFallback(Image);
