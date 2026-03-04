import fs from "fs";
import path from "path";
import matter from "gray-matter";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  author: string;
  publishedAt: string;
  updatedAt?: string;
  readTime: number;
  featuredImage?: string;
}

const CONTENT_DIR = path.join(process.cwd(), "content", "blog");

function getReadTime(content: string): number {
  const words = content.split(/\s+/).length;
  return Math.max(1, Math.ceil(words / 200));
}

export async function getAllPosts(): Promise<BlogPost[]> {
  if (!fs.existsSync(CONTENT_DIR)) {
    return [];
  }

  const files = fs.readdirSync(CONTENT_DIR).filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const posts = files.map((filename) => {
    const slug = filename.replace(/\.(mdx|md)$/, "");
    const filePath = path.join(CONTENT_DIR, filename);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    return {
      slug,
      title: data.title || slug,
      excerpt: data.excerpt || content.slice(0, 160).replace(/[#*_\n]/g, "").trim() + "...",
      content,
      category: data.category || "General",
      author: data.author || "Framework Friday",
      publishedAt: data.publishedAt || data.date || new Date().toISOString(),
      updatedAt: data.updatedAt,
      readTime: getReadTime(content),
      featuredImage: data.featuredImage,
    } satisfies BlogPost;
  });

  return posts.sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );
}

export async function getPostBySlug(slug: string): Promise<BlogPost | null> {
  const posts = await getAllPosts();
  return posts.find((p) => p.slug === slug) || null;
}

export async function getPostsByCategory(category: string): Promise<BlogPost[]> {
  const posts = await getAllPosts();
  return posts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
}

export async function getAllCategories(): Promise<string[]> {
  const posts = await getAllPosts();
  const categories = new Set(posts.map((p) => p.category));
  return Array.from(categories).sort();
}
