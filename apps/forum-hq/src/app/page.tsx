import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center px-4 py-16">
      <h1 className="text-3xl font-bold tracking-tight text-neutral-900 mb-2">
        Framework Friday HQ
      </h1>
      <p className="text-neutral-500 mb-12">
        Your home for everything Framework Friday.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
        {/* Forum Members */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 flex flex-col">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Forum Members
          </h2>
          <p className="text-sm text-neutral-600 mb-6 flex-1">
            Access your Forum dashboard, sessions, and community.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center justify-center rounded-lg px-5 py-2.5 text-sm font-medium text-white transition-colors"
            style={{ backgroundColor: "#FF4F1A" }}
          >
            Sign In
          </Link>
        </div>

        {/* Decision Sprint Participants */}
        <div className="rounded-2xl border border-neutral-200 bg-white p-8 flex flex-col">
          <h2 className="text-lg font-semibold text-neutral-900 mb-2">
            Decision Sprint Participants
          </h2>
          <p className="text-sm text-neutral-600 flex-1">
            Looking for your Decision Sprint? Use the unique link sent to you
            via email. If you haven&apos;t received your link, contact us at{" "}
            <a
              href="mailto:hello@frameworkfriday.ai"
              className="underline"
              style={{ color: "#FF4F1A" }}
            >
              hello@frameworkfriday.ai
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
