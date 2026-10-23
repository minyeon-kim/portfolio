import type { Metadata } from "next";
import { HomePage } from "@/components/pages/home-page";
import { ui } from "@/lib/i18n";

export const metadata: Metadata = { description: ui.ko.positioning };

export default function Page() {
  return <HomePage locale="ko" />;
}
