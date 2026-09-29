import { Metadata } from "next";
import { StableYieldsPageContent } from "@/components/StableYieldsPageContent";

export const metadata: Metadata = {
  title: "Leverage - Loop Stablecoin Yields | Stable Yields",
  description:
    "Compare the best stablecoin leverage opportunities on FiRM, Morpho and Llamalend: borrow rates, max leverage and net APY.",
  alternates: {
    canonical: "https://www.stableyields.info/leverage",
  },
};

export const revalidate = 300;

export default async function LeveragePage() {
  return <StableYieldsPageContent title="Stable Yields" tab="leverage" />;
}
