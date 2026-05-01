import { Metadata } from "next";
import { ProseLayout } from "@/components/ProseLayout";
import { JsonLd } from "@/components/JsonLd";
import { buildFaqPageJsonLd } from "@/lib/structured-data";
import { FAQ_ITEMS } from "@/lib/faq-content";

export const metadata: Metadata = {
  title: "FAQ - Stablecoin Yields | Stable Yields",
  description:
    "Frequently asked questions about yield-bearing stablecoins, how APYs are calculated, risks, and how Stable Yields works.",
  alternates: {
    canonical: "https://www.stableyields.info/faq",
  },
};

export default function FaqPage() {
  return (
    <ProseLayout
      title="Frequently Asked Questions"
      subtitle="Common questions about stablecoin yields and how Stable Yields works"
    >
      <JsonLd data={buildFaqPageJsonLd()} />
      {FAQ_ITEMS.map((item) => (
        <section key={item.slug} id={item.slug}>
          <h2>{item.question}</h2>
          <p>{item.answer}</p>
        </section>
      ))}
    </ProseLayout>
  );
}
