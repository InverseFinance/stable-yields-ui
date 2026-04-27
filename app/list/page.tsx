import { StableYieldsPageContent } from "@/components/StableYieldsPageContent";

export const revalidate = 300;

export default async function YieldsPage() {
  return <StableYieldsPageContent title="Stablecoin Yields" titleSize="text-4xl sm:text-7xl" />;
}
