import { CasePage, caseMetadata, caseParams } from "@/components/pages/case-page";

export const generateStaticParams = caseParams;

export async function generateMetadata({ params }: PageProps<"/work/[slug]">) {
  return caseMetadata((await params).slug, "en");
}

export default async function Page({ params }: PageProps<"/work/[slug]">) {
  return <CasePage slug={(await params).slug} locale="en" />;
}
