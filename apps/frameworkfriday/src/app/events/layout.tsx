import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Events — Framework Friday",
  description:
    "Join Framework Friday events in your area. AI implementation workshops, networking, and hands-on learning for operators.",
  openGraph: {
    title: "Events — Framework Friday",
    description:
      "Join Framework Friday events in your area. AI implementation workshops, networking, and hands-on learning.",
  },
};

export default function EventsLayout({ children }: { children: React.ReactNode }) {
  return children;
}
