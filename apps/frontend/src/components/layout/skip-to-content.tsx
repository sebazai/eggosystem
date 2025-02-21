"use client";

export default function SkipToContent() {
  const handleSkipToContent = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const mainContent = document.getElementById("main-content");

    if (mainContent) {
      mainContent.setAttribute("tabindex", "0"); // Temporarily make focusable
      mainContent.focus();

      // Remove tabindex after focus to maintain semantic structure
      setTimeout(() => mainContent?.removeAttribute("tabindex"), 100);
    }
  };

  return (
    <a
      href="#"
      className="absolute top-0 left-0 p-4 bg-white text-black focus:not-sr-only sr-only"
      onClick={handleSkipToContent}
    >
      Skip to main content
    </a>
  );
}
