"use client";

import { useEffect, useState } from "react";
import { ArrowUpCircle } from "lucide-react"; // Optional icon library

const ScrollToTop = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShow(true);
      } else {
        setShow(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <button
      onClick={scrollToTop}
      className={`z-100 fixed bottom-3 right-3 p-3 bg-secondary border-1 border-ring rounded-full shadow-lg transition-opacity duration-300 ${
        show ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
      aria-label="Scroll to Top"
    >
      <ArrowUpCircle className="w-4 h-4" />
    </button>
  );
};

export default ScrollToTop;
