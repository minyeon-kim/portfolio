import { HandoffPage, handoffMetadata } from "@/components/pages/devsign-handoff-page";

export const generateMetadata = () => handoffMetadata("ko");

export default function Page() {
  return <HandoffPage locale="ko" />;
}
