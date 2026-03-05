import { MetadataRoute } from "next";
import { getAllPosts } from "@/lib/blog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const posts = await getAllPosts();

  const staticPages: MetadataRoute.Sitemap = [
    { url: "https://www.frameworkfriday.ai", changeFrequency: "weekly", priority: 1.0 },
    { url: "https://www.frameworkfriday.ai/about", changeFrequency: "monthly", priority: 0.8 },
    { url: "https://www.frameworkfriday.ai/resources", changeFrequency: "monthly", priority: 0.7 },
    { url: "https://www.frameworkfriday.ai/media", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.frameworkfriday.ai/careers", changeFrequency: "monthly", priority: 0.5 },
    { url: "https://www.frameworkfriday.ai/events", changeFrequency: "monthly", priority: 0.6 },
    { url: "https://www.frameworkfriday.ai/blog", changeFrequency: "weekly", priority: 0.9 },
    { url: "https://www.frameworkfriday.ai/privacy-policy", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.frameworkfriday.ai/terms-of-service", changeFrequency: "yearly", priority: 0.3 },
    { url: "https://www.frameworkfriday.ai/refund-policy", changeFrequency: "yearly", priority: 0.3 },
  ];

  const blogPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `https://www.frameworkfriday.ai/blog/${post.slug}`,
    lastModified: post.updatedAt || post.publishedAt,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  return [...staticPages, ...blogPages];
}
