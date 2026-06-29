import { motion } from "framer-motion";

const statuses = [
  { key: "Created", label: "Created" },
  { key: "WaitingDeposit", label: "Waiting Deposit" },
  { key: "Locked", label: "Deposited" },
  { key: "ReleaseRequested", label: "Release Requested" },
  { key: "Completed", label: "Completed" },
];

const statusIndexMap: Record<string, number> = {};
statuses.forEach((s, i) => {
  statusIndexMap[s.key] = i;
});

interface Props {
  currentStatus: string;
}

export function EscrowStepper({ currentStatus }: Props) {
  const exactIdx = statusIndexMap[currentStatus];

  if (currentStatus === "Disputed") {
    return (
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-red-900 text-white text-xs font-bold">
                {i + 1}
              </div>
              <span className="text-sm text-gray-400">{statuses[i].label}</span>
              {i < 2 && <div className="h-0.5 w-6 bg-red-900" />}
            </div>
          ))}
        </div>
        <span className="text-xs text-red-400 font-semibold ml-2">DISPUTED</span>
      </div>
    );
  }

  if (currentStatus === "Resolved") {
    const idx = 4;
    return (
      <div className="flex items-center gap-2">
        {statuses.map((s, i) => (
          <div key={s.key} className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
                i <= idx ? "bg-indigo-600 text-white" : "bg-gray-800 text-gray-500"
              }`}
            >
              {i + 1}
            </div>
            <span
              className={`text-sm ${i <= idx ? "text-gray-200" : "text-gray-600"}`}
            >
              {s.label}
            </span>
            {i < statuses.length - 1 && (
              <div
                className={`h-0.5 w-6 ${i < idx ? "bg-indigo-600" : "bg-gray-800"}`}
              />
            )}
          </div>
        ))}
      </div>
    );
  }

  const idx = exactIdx ?? -1;

  return (
    <div className="flex items-center gap-2">
      {statuses.map((s, i) => (
        <div key={s.key} className="flex items-center gap-2">
          <motion.div
            animate={{
              scale: i <= idx ? 1 : 0.85,
              opacity: i <= idx ? 1 : 0.4,
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold ${
              i <= idx
                ? "bg-indigo-600 text-white"
                : "bg-gray-800 text-gray-500"
            }`}
          >
            {i + 1}
          </motion.div>
          <span
            className={`text-sm ${i <= idx ? "text-gray-200" : "text-gray-600"}`}
          >
            {s.label}
          </span>
          {i < statuses.length - 1 && (
            <div
              className={`h-0.5 w-6 ${
                i < idx ? "bg-indigo-600" : "bg-gray-800"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}
