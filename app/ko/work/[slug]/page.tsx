import { CasePage, caseMetadata, caseParams } from "@/components/pages/case-page";

export const generateStaticParams = () => caseParams("ko");

export async function generateMetadata({ params }: PageProps<"/ko/work/[slug]">) {
  return caseMetadata((await params).slug, "ko");
}

export default async function Page({ params }: PageProps<"/ko/work/[slug]">) {
  return <CasePage slug={(await params).slug} locale="ko" />;
}
