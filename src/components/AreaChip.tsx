import { areaColor } from "@/lib/areaColors";

export function AreaChip({ code }: { code: string }) {
  const c = areaColor(code);
  return (
    <span className="chip" style={{ color: c, backgroundColor: `${c}1a` }}>
      {code}
    </span>
  );
}
