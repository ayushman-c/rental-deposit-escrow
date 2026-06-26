export function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    Created: "bg-yellow-900/50 text-yellow-300 border-yellow-700",
    WaitingDeposit: "bg-blue-900/50 text-blue-300 border-blue-700",
    Locked: "bg-green-900/50 text-green-300 border-green-700",
    ReleaseRequested: "bg-purple-900/50 text-purple-300 border-purple-700",
    Completed: "bg-emerald-900/50 text-emerald-300 border-emerald-700",
    Disputed: "bg-red-900/50 text-red-300 border-red-700",
    Resolved: "bg-cyan-900/50 text-cyan-300 border-cyan-700",
  };

  const color = colors[status] || "bg-gray-800 text-gray-400 border-gray-600";

  return (
    <span
      className={`inline-block rounded-full border px-3 py-0.5 text-xs font-medium ${color}`}
    >
      {status}
    </span>
  );
}
