import { HandoffPage, handoffMetadata } from "@/components/pages/devsign-handoff-page";

export const generateMetadata = () => handoffMetadata("en");

export default function Page() {
  return <HandoffPage locale="en" />;
}
