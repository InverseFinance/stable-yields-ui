export function WorthDiffWarning({
  warnHighWorthDiff,
  blockHighWorthDiff,
}: {
  warnHighWorthDiff: boolean;
  blockHighWorthDiff: boolean;
}) {
  if (blockHighWorthDiff) {
    return (
      <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
        There seems to be an issue: output worth is too low compared to deposit worth.
      </div>
    );
  }
  if (warnHighWorthDiff) {
    return (
      <div className="px-4 py-3 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
        Output worth is quite low compared to deposit worth. It is not recommended to proceed.
      </div>
    );
  }
  return null;
}
