"use client";

import dynamic from "next/dynamic";

// Import ChickenTest with dynamic import in this client component
const ChickenTest = dynamic(() => import("./ChickenTest"), {
  ssr: false
});

export const ChickenTestWrapper = () => {
  return <ChickenTest />;
};

export default ChickenTestWrapper;
