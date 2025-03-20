import { AppNav } from "@/components/app-nav";
import { YieldTable } from "@/components/yield-table";

export default async function YieldsPage() {
  const data = await fetch(`https://inverse.finance/api/dola/sdola-comparator`);
  const json = await data.json();
  return (
    <>
      <header className="flex-wrap items-center justify-center py-15">
        {/* <AppNav activeItem="/stable-yields" /> */}
        <div className="text-center gap-2">
          <h1 className="text-6xl font-extrabold text-gray-200 dark:text-blue-100">
            Stable Yields
          </h1>
          <p className="text-xl font-bold text-gray-300/80 dark:text-gray-400">
            Compare stablecoin yields across major DeFi protocols
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full">
        <YieldTable data={json.rates} timestamp={json.timestamp} />
      </div>
    </>
  );
}
