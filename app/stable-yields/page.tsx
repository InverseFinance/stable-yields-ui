import { YieldTable } from "@/components/yield-table";
import { YieldData } from "../types";

export const revalidate = 300;

export default async function YieldsPage() {
  const data = await fetch(`https://inverse.finance/api/dola/sdola-comparator?v=2`);
  const json = await data.json();
  return (
    <>
      <header className="flex-wrap items-center justify-center py-12">
        {/* <AppNav activeItem="/stable-yields" /> */}
        <div className="text-center">
          <h1 className="text-5xl sm:text-8xl lg:text-8xl font-bold text-primary mb-2">
            Stable Yields
          </h1>
          <h2 className="text-lg sm:text-xl lg:text-2xl text-muted-foreground">
            Compare stablecoin yields across major DeFi protocols
          </h2>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full items-center justify-center">
        <YieldTable data={json.rates.map((r: YieldData) => ({ ...r, project: r.project.replace('FiRM', 'Inverse') }))} timestamp={json.timestamp} />
      </div>
    </>
  );
}
