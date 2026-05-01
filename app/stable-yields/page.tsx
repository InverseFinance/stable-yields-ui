import { StableYieldsPageContent } from "@/components/StableYieldsPageContent";
import { JsonLd } from "@/components/JsonLd";
import { buildDatasetJsonLd, buildFaqPageJsonLd } from "@/lib/structured-data";

export const revalidate = 300;

export default async function YieldsPage() {
  return (
    <>
      <JsonLd data={buildDatasetJsonLd()} />
      <JsonLd data={buildFaqPageJsonLd()} />
      <StableYieldsPageContent title="Stable Yields" />
    </>
  );
}
