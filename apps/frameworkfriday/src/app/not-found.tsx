import Link from "next/link";

export default function NotFound() {
  return (
    <section className="py-24 md:py-32 px-4">
      <div className="max-w-lg mx-auto text-center">
        <h1 className="text-6xl font-bold text-gray-950">404</h1>
        <p className="mt-4 text-xl text-gray-600">Oops! This page doesn&apos;t exist.</p>
        <p className="mt-2 text-gray-500">
          It may have been moved, deleted, or the URL might be incorrect.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block bg-gray-950 text-white font-medium px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors"
        >
          Back to Home
        </Link>
      </div>
    </section>
  );
}
