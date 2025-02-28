import { useEffect, useState } from "react";

const KONAMI_CODE = [
  "ArrowUp",
  "ArrowUp",
  "ArrowDown",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "ArrowLeft",
  "ArrowRight",
  "b",
  "a"
];

export const useKonami = (callback: () => void) => {
  const [input, setInput] = useState<string[]>([]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      setInput((prev) => [...prev, e.key].slice(-KONAMI_CODE.length));

      if (input.join(",") === KONAMI_CODE.join(",")) {
        callback();
        setInput([]);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [input, callback]);
};
