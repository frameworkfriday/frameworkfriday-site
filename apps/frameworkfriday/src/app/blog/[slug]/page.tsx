import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { MDXRemote } from "next-mdx-remote/rsc";
import { JsonLd } from "@/components/JsonLd";
import { getAllPosts, getPostBySlug } from "@/lib/blog";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const posts = await getAllPosts();
  return posts.map((post) => ({ slug: post.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) return { title: "Post Not Found" };

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      type: "article",
      title: post.title,
      description: post.excerpt,
      publishedTime: post.publishedAt,
      authors: [post.author],
    },
  };
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params;
  const post = await getPostBySlug(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        data={{
          "@context": "https://schema.org",
          "@type": "Article",
          headline: post.title,
          description: post.excerpt,
          author: { "@type": "Person", name: post.author },
          datePublished: post.publishedAt,
          dateModified: post.updatedAt || post.publishedAt,
          publisher: {
            "@type": "Organization",
            name: "Framework Friday",
            url: "https://frameworkfriday.ai",
          },
        }}
      />

      <article className="py-12 sm:py-20 md:py-24 px-4">
        <div className="max-w-3xl mx-auto">
          {/* Back link */}
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-950 transition-colors mb-8"
          >
            <ArrowLeft size={14} /> Back to Blog
          </Link>

          {/* Header */}
          <div className="mb-10">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-xs font-bold text-primary uppercase tracking-wider">
                {post.category}
              </span>
              <span className="text-xs text-gray-400">{post.readTime} min read</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold leading-tight">
              {post.title}
            </h1>
            <div className="flex items-center gap-4 mt-5 text-sm text-gray-500">
              <span>By {post.author}</span>
              <span>
                {new Date(post.publishedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray prose-lg max-w-none">
            <MDXRemote source={post.content} />
          </div>
        </div>
      </article>
    </>
  );
}
