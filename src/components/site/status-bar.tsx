import { Battery, Signal, Wifi } from "lucide-react";

export function StatusBar({ light = false }: { light?: boolean }) {
  return (
    <div
      className={
        light
          ? "flex h-11 items-end justify-between px-5 pb-1 text-paper"
          : "flex h-11 items-end justify-between px-5 pb-1 text-ink"
      }
    >
      <span className="font-mono text-micro font-medium tabular-nums">9:41</span>
      <div className="flex items-center gap-1">
        <Signal className="size-3" strokeWidth={2.4} />
        <Wifi className="size-3" strokeWidth={2.4} />
        <Battery className="size-3.5" strokeWidth={2.4} />
      </div>
    </div>
  );
}
