import { notFound } from "next/navigation";
import { Metadata } from "next";
import { ASSET_CONTENT, ASSET_SLUGS } from "@/lib/asset-content";
import { JsonLd } from "@/components/JsonLd";
import { ProseLayout } from "@/components/ProseLayout";
import { StakingData } from "@/app/types";

export function generateStaticParams() {
  return ASSET_SLUGS.map((slug) => ({ asset: slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ asset: string }>;
}): Promise<Metadata> {
  const { asset } = await params;
  const content = ASSET_CONTENT[asset];
  if (!content) return {};
  return {
    title: `${content.symbol} — ${content.name} | Stable Yields`,
    description: content.metaDescription,
    alternates: {
      canonical: `https://www.stableyields.info/${content.slug}`,
    },
  };
}

export const revalidate = 3600;

async function fetchLiveData(symbol: string) {
  try {
    const res = await fetch(
      "https://www.inverse.finance/api/dola/sdola-comparator?v=2",
      { next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const json = await res.json();
    const match = json.rates?.find(
      (r: StakingData) =>
        r.symbol.toLowerCase().replace("fxsave", "fxsave") ===
        symbol.toLowerCase()
    );
    return match || null;
  } catch {
    return null;
  }
}

export default async function AssetPage({
  params,
}: {
  params: Promise<{ asset: string }>;
}) {
  const { asset } = await params;
  const content = ASSET_CONTENT[asset];
  if (!content) notFound();

  const liveData = await fetchLiveData(content.symbol);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FinancialProduct",
    name: content.name,
    description: content.metaDescription,
    provider: {
      "@type": "Organization",
      name: content.issuer,
      url: content.issuerUrl,
    },
    url: `https://www.stableyields.info/${content.slug}`,
    category: "Yield-bearing Stablecoin",
  };

  return (
    <ProseLayout title={content.name} subtitle={`by ${content.issuer}`}>
      <JsonLd data={jsonLd} />

      {liveData && (
        <section className="not-prose mb-8">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                Current APY
              </div>
              <div className="text-2xl font-bold text-accent">
                {liveData.apy?.toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                30d Avg APY
              </div>
              <div className="text-2xl font-bold text-foreground">
                {liveData.avg30?.toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">
                90d Avg APY
              </div>
              <div className="text-2xl font-bold text-foreground">
                {liveData.avg90?.toFixed(2)}%
              </div>
            </div>
            <div className="bg-card border border-border rounded-lg p-4 text-center">
              <div className="text-sm text-muted-foreground mb-1">TVL</div>
              <div className="text-2xl font-bold text-foreground">
                $
                {liveData.tvl >= 1_000_000
                  ? `${(liveData.tvl / 1_000_000).toFixed(1)}M`
                  : liveData.tvl >= 1_000
                    ? `${(liveData.tvl / 1_000).toFixed(0)}K`
                    : liveData.tvl?.toLocaleString()}
              </div>
            </div>
          </div>
        </section>
      )}

      {content.sections.map((section) => (
        <section key={section.heading}>
          <h2>{section.heading}</h2>
          <p>{section.body}</p>
        </section>
      ))}

      <section>
        <h2>Key Risk Factors</h2>
        <ul>
          {content.riskFactors.map((risk) => (
            <li key={risk}>{risk}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>How to Get {content.symbol}</h2>
        <ul>
          {content.redeemableVia.map((method) => (
            <li key={method}>{method}</li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Details</h2>
        <ul>
          <li>
            <strong>Underlying stablecoin:</strong> {content.underlyingStable}
          </li>
          <li>
            <strong>Mechanism:</strong> {content.mechanism}
          </li>
          <li>
            <strong>Chain:</strong> {content.chainSupport.join(", ")}
          </li>
          {content.contractAddress && (
            <li>
              <strong>Contract:</strong>{" "}
              <a
                href={`https://etherscan.io/address/${content.contractAddress}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {content.contractAddress.slice(0, 6)}...
                {content.contractAddress.slice(-4)}
              </a>
            </li>
          )}
          {content.coingeckoId && (
            <li>
              <strong>CoinGecko:</strong>{" "}
              <a
                href={`https://www.coingecko.com/en/coins/${content.coingeckoId}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                View on CoinGecko
              </a>
            </li>
          )}
          <li>
            <strong>Issuer:</strong>{" "}
            <a
              href={content.issuerUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              {content.issuer}
            </a>
          </li>
        </ul>
      </section>
    </ProseLayout>
  );
}
