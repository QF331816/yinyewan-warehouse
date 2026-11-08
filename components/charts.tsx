import { money } from "@/lib/format";

/** 近 14 天出入库柱状图（纯 SVG，无第三方图表库） */
export function TrendChart({
  data,
}: {
  data: { date: string; inQty: number; outQty: number }[];
}) {
  const W = 720;
  const H = 190;
  const padL = 34;
  const padR = 8;
  const padT = 10;
  const padB = 26;
  const innerW = W - padL - padR;
  const innerH = H - padT - padB;

  const max = Math.max(10, ...data.map((d) => Math.max(d.inQty, d.outQty)));
  const step = niceStep(max);
  const top = Math.ceil(max / step) * step;
  const ticks = [0, top / 2, top];

  const slot = innerW / Math.max(1, data.length);
  const barW = Math.min(14, (slot - 8) / 2);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-[190px] w-full" role="img" aria-label="近14天出入库趋势">
      {ticks.map((t) => {
        const y = padT + innerH - (t / top) * innerH;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="#eef3ec" strokeWidth={1} />
            <text x={padL - 8} y={y + 3.5} textAnchor="end" fontSize={10} fill="#93a29a">
              {t >= 1000 ? `${(t / 1000).toFixed(1)}k` : t}
            </text>
          </g>
        );
      })}

      {data.map((d, i) => {
        const x = padL + i * slot + slot / 2;
        const hIn = (d.inQty / top) * innerH;
        const hOut = (d.outQty / top) * innerH;
        const [, m, day] = d.date.split("-");
        const showLabel = i % 2 === 0 || i === data.length - 1;
        return (
          <g key={d.date}>
            <rect
              x={x - barW - 1.5}
              y={padT + innerH - hIn}
              width={barW}
              height={Math.max(hIn, d.inQty > 0 ? 2 : 0)}
              rx={3}
              fill="#0f6f42"
              opacity={0.9}
            />
            <rect
              x={x + 1.5}
              y={padT + innerH - hOut}
              width={barW}
              height={Math.max(hOut, d.outQty > 0 ? 2 : 0)}
              rx={3}
              fill="#d08a2c"
              opacity={0.95}
            />
            {showLabel ? (
              <text x={x} y={H - 8} textAnchor="middle" fontSize={10} fill="#93a29a">
                {Number(m)}/{Number(day)}
              </text>
            ) : null}
          </g>
        );
      })}
    </svg>
  );
}

function niceStep(max: number) {
  const raw = max / 3;
  const mag = Math.pow(10, Math.floor(Math.log10(raw || 1)));
  const norm = raw / mag;
  const nice = norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 5 ? 5 : 10;
  return nice * mag;
}

/** 分类库存金额占比条 */
export function CategoryBars({
  data,
}: {
  data: { name: string; qty: number; value: number }[];
}) {
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const colors = ["#0f6f42", "#3e9b6b", "#7fb89a", "#d08a2c", "#8b93a7", "#b06a8f"];
  return (
    <ul className="space-y-3.5">
      {data.map((d, i) => {
        const pct = (d.value / total) * 100;
        return (
          <li key={d.name}>
            <div className="mb-1 flex items-baseline justify-between text-[12.5px]">
              <span className="text-ink-2">{d.name}</span>
              <span className="num text-ink-3">
                ¥{money(d.value, 0)}
                <span className="ml-1.5 text-ink-3/80">{pct.toFixed(0)}%</span>
              </span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-[#eef3ec]">
              <div
                className="h-full rounded-full"
                style={{ width: `${Math.max(pct, 1.5)}%`, background: colors[i % colors.length] }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}
