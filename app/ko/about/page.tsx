import { AboutPage, aboutMetadata } from "@/components/pages/about-page";

export const metadata = aboutMetadata("ko");

export default function Page() {
  return <AboutPage locale="ko" />;
}
