import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "New Features",
  description: "Check out the latest features we&apos;ve added to the platform"
};

export default function NewFeaturesPage() {
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-4xl font-heading font-bold mb-6">New Features</h1>

      <div className="space-y-8">
        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-4">
            Latest Updates
          </h2>

          <div className="space-y-6">
            <div>
              <h3 className="text-xl font-bold mb-2">Chicken Announcer 🐔</h3>
              <p className="mb-2">
                We&apos;ve added a friendly chicken that announces new features!
                When you see the chicken walking on your screen, click on it to
                visit this page and learn about our latest updates.
              </p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Added:</span>
                <time dateTime="2026-06-20">June 20, 2026</time>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-card p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-heading font-bold mb-4">Coming Soon</h2>
          <ul className="list-disc pl-5 space-y-2"></ul>
        </section>
      </div>
    </div>
  );
}
