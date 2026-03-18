"use server";

import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function createResource(formData: FormData) {
  const admin = createAdminClient();
  const title = formData.get("title") as string;
  const url = formData.get("url") as string;
  const description = formData.get("description") as string;
  const category = formData.get("category") as string;

  if (!title || !url || !category) return;

  // Get max position for this category
  const { data: existing } = await admin
    .from("resources")
    .select("position")
    .eq("category", category)
    .order("position", { ascending: false })
    .limit(1);

  const position = existing?.[0]?.position != null ? existing[0].position + 1 : 0;

  await admin.from("resources").insert({
    title: title.trim(),
    url: url.trim(),
    description: description?.trim() || null,
    category,
    position,
  });

  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}

export async function deleteResource(formData: FormData) {
  const admin = createAdminClient();
  const id = formData.get("id") as string;
  if (!id) return;
  await admin.from("resources").delete().eq("id", id);
  revalidatePath("/admin/resources");
  revalidatePath("/resources");
}
