import type { Metadata } from "next";
import { HomePage } from "@/components/pages/home-page";
import { ui } from "@/lib/i18n";
import { shareMeta, site } from "@/lib/site";

export const metadata: Metadata = { description: ui.ko.positioning, ...shareMeta("/ko/", `${site.name} — Product Designer`, ui.ko.positioning) };

export default function Page() {
  return <HomePage locale="ko" />;
}
