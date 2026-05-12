// eslint-disable-next-line @typescript-eslint/no-require-imports
require("@testing-library/jest-dom");

// Set default environment variables for tests to match development environment
process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL =
  process.env.NEXT_PUBLIC_IMAGE_SERVICE_URL ?? "https://img.kanaliiga.fi";

// Suppress React act() warnings in tests
const originalError = console.error;
beforeAll(() => {
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes(
        "The current testing environment is not configured to support act(...)"
      ) ||
        args[0].includes(
          "An update to null inside a test was not wrapped in act(...)"
        ) ||
        args[0].includes(
          "When testing, code that causes React state updates should be wrapped into act(...)"
        ))
    ) {
      return;
    }
    originalError.call(console, ...args);
  };
});

afterAll(() => {
  console.error = originalError;
});

// Mock Next.js App Router
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    pathname: "/",
    query: {},
    asPath: "/"
  }),
  useSearchParams: () => new URLSearchParams(),
  usePathname: () => "/",
  useParams: () => ({}),
  redirect: jest.fn(),
  notFound: jest.fn()
}));

// Mock matchMedia - Required for useIsMobile hook and responsive components
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: unknown) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {}
  })
});

// Mock DOM methods required by Radix UI components
Object.defineProperty(Element.prototype, "scrollIntoView", {
  writable: true,
  value: jest.fn()
});

Object.defineProperty(HTMLElement.prototype, "scrollIntoView", {
  writable: true,
  value: jest.fn()
});

// Mock ResizeObserver
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn()
}));

// Mock IntersectionObserver
global.IntersectionObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
  root: null,
  rootMargin: "",
  thresholds: []
}));
