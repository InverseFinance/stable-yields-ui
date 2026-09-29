import { Metadata } from "next";
import { StableYieldsPageContent } from "@/components/StableYieldsPageContent";

export const metadata: Metadata = {
  title: "Stable Pairs - Compare Stablecoin LP Yields | Stable Yields",
  description:
    "Compare the best stablecoin LP yields across Curve, Convex, Stake DAO and Yearn. Free, real-time APY data from on-chain sources.",
  alternates: {
    canonical: "https://www.stableyields.info/pairs",
  },
};

export const revalidate = 300;

export default async function PairsPage() {
  return <StableYieldsPageContent title="Stable Yields" tab="stable-pairs" />;
}
