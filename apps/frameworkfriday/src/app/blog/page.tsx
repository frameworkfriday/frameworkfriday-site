import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts, getAllCategories } from "@/lib/blog";

export const metadata: Metadata = {
  title: "Blog — AI Implementation Insights",
  description:
    "Practical insights on AI implementation from operators who build, not theorize. Frameworks, case studies, and lessons learned.",
  openGraph: {
    title: "Blog — AI Implementation Insights",
    description: "Practical insights on AI implementation from operators.",
  },
};

export default async function Blog() {
  const posts = await getAllPosts();
  const categories = await getAllCategories();

  return (
    <>
      {/* Hero */}
      <section className="py-12 sm:py-20 md:py-28 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">Blog</h1>
          <p className="mt-5 sm:mt-6 text-gray-500 text-base sm:text-lg leading-relaxed">
            Practical insights on AI implementation from operators who build, not theorize.
          </p>
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="px-4 pb-4">
          <div className="max-w-6xl mx-auto flex flex-wrap gap-2 justify-center">
            {categories.map((cat) => (
              <span
                key={cat}
                className="text-xs font-medium text-gray-500 border border-gray-200 rounded-full px-3 py-1"
              >
                {cat}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Posts */}
      <section className="py-12 sm:py-20 md:py-24 px-4 bg-warm-50">
        <div className="max-w-6xl mx-auto">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg">Blog posts coming soon.</p>
              <p className="text-gray-400 mt-2">
                Follow us on{" "}
                <a href="https://x.com/frameworkfri" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                  X
                </a>{" "}
                for updates.
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="card-hover bg-white border border-gray-200 rounded-2xl overflow-hidden flex flex-col"
                >
                  <div className="p-6 sm:p-8 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">
                        {post.category}
                      </span>
                      <span className="text-xs text-gray-400">{post.readTime} min read</span>
                    </div>
                    <h3 className="text-base sm:text-lg font-bold flex-1">{post.title}</h3>
                    <p className="text-gray-500 mt-3 text-sm leading-relaxed line-clamp-3">
                      {post.excerpt}
                    </p>
                    <div className="flex items-center justify-between mt-5 pt-4 border-t border-gray-100 text-xs text-gray-400">
                      <span>{post.author}</span>
                      <span>
                        {new Date(post.publishedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
