import { motion } from "framer-motion";

const statuses = [
  { key: "Created", label: "Created" },
  { key: "Locked", label: "Deposited" },
  { key: "ReleaseRequested", label: "Release Requested" },
  { key: "Completed", label: "Completed" },
];

interface Props {
  currentStatus: string;
}

export function EscrowStepper({ currentStatus }: Props) {
  const idx = statuses.findIndex((s) => s.key === currentStatus);

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
