import { YieldTable } from "@/components/yield-table";

export const revalidate = 300;

export default async function YieldsPage() {
  const data = await fetch(`https://inverse.finance/api/dola/sdola-comparator`);
  const json = await data.json();
  return (
    <>
      <header className="flex-wrap items-center justify-center py-12">
        {/* <AppNav activeItem="/stable-yields" /> */}
        <div className="text-center">
          <h1 className="text-8xl font-bold text-gray-100 dark:text-blue-100 mb-2">
            Stable Yields
          </h1>
          <p className="text-2xl text-gray-300 dark:text-gray-400">
            Compare stablecoin yields across major DeFi protocols
          </p>
        </div>
      </header>
      <div className="flex flex-col gap-4 w-full items-center justify-center">
        <YieldTable data={json.rates} timestamp={json.timestamp} />
      </div>
    </>
  );
}
