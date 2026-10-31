import { Bar, BarChart, CartesianGrid, Cell, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { FacultySummary } from "@/domain/types";
import { units } from "@/data/fixtures/curriculum";
import { Donut } from "@/components/art/Ring";
import { unitGradient } from "@/components/art/UnitArt";

const C = { mastered: "oklch(0.62 0.17 150)", demonstrated: "oklch(0.78 0.16 70)", needs: "oklch(0.6 0.2 255)" };

export const ROSTER_COLORS = { active: "oklch(0.62 0.17 150)", invited: "oklch(0.7 0.15 230)", notInvited: "oklch(0.75 0.01 260)" };

/** Charts for the faculty overview. All values come from the summary service. */
export function FacultyCharts({ s }: { s: FacultySummary }) {
  const unitData = s.unitProgress.map((u) => ({ name: `U${units.find((x) => x.id === u.unitId)?.number}`, Mastered: u.mastered, Demonstrated: u.demonstrated, "Needs practice": u.needsPractice, id: u.unitId }));
  const buckets = s.assessmentBuckets.map((b) => ({ name: b.label, count: b.count ?? 0, hidden: b.count === null }));
  const bucketColors = ["oklch(0.6 0.2 25)", "oklch(0.78 0.16 70)", "oklch(0.7 0.15 230)", "oklch(0.62 0.17 150)"];
  return (
    <section className="grid gap-6 lg:grid-cols-[0.8fr_1.4fr_1fr]" data-testid="faculty-charts">
      <div className="glass-panel cf-rise rounded-3xl p-5">
        <p className="eyebrow">Roster status</p>
        <div className="mt-4 flex justify-center">
          <Donut size={170} stroke={22} parts={[{ label: "Active", value: s.active, color: ROSTER_COLORS.active }, { label: "Invited", value: s.invited, color: ROSTER_COLORS.invited }, { label: "Not invited", value: s.notInvited, color: ROSTER_COLORS.notInvited }]}>
            <span><span className="block font-display text-3xl">{s.rosterCount}</span><span className="text-[10px] text-muted-foreground">of {s.capacity} seats</span></span>
          </Donut>
        </div>
        <ul className="mt-4 space-y-1.5 text-sm">
          {([["Active", s.active, ROSTER_COLORS.active], ["Invited", s.invited, ROSTER_COLORS.invited], ["Not invited", s.notInvited, ROSTER_COLORS.notInvited]] as const).map(([l, v, c]) => (
            <li key={l} className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="size-2.5 rounded-full" style={{ background: c }} />{l}</span><span className="font-mono">{v}</span></li>
          ))}
        </ul>
      </div>
      <div className="glass-panel cf-rise rounded-3xl p-5" style={{ animationDelay: "100ms" }}>
        <p className="eyebrow">Students per state, by unit</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={unitData} barCategoryGap="22%">
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="oklch(0.2 0.01 260 / 0.08)" />
              <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
              <YAxis tickLine={false} axisLine={false} fontSize={11} width={28} />
              <Tooltip cursor={{ fill: "oklch(0.6 0.2 255 / 0.06)" }} contentStyle={{ borderRadius: 14, border: "1px solid white", background: "oklch(1 0 0 / 0.9)" }} />
              <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="Mastered" fill={C.mastered} radius={[6, 6, 0, 0]} animationDuration={1100} />
              <Bar dataKey="Demonstrated" fill={C.demonstrated} radius={[6, 6, 0, 0]} animationDuration={1300} />
              <Bar dataKey="Needs practice" fill={C.needs} radius={[6, 6, 0, 0]} animationDuration={1500} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 flex gap-1">{unitData.map((u) => <span key={u.id} className="h-1 flex-1 rounded-full" style={{ background: unitGradient(u.id) }} />)}</div>
      </div>
      <div className="glass-panel cf-rise rounded-3xl p-5" style={{ animationDelay: "200ms" }}>
        <p className="eyebrow">Preview score distribution</p>
        <div className="mt-3 h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={buckets} layout="vertical" margin={{ left: 8 }}>
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} fontSize={11} width={64} />
              <Tooltip cursor={{ fill: "oklch(0.6 0.2 255 / 0.06)" }} formatter={(v, _n, p) => ((p.payload as { hidden: boolean }).hidden ? "hidden (<3 students)" : v)} contentStyle={{ borderRadius: 14, border: "1px solid white" }} />
              <Bar dataKey="count" radius={[0, 8, 8, 0]} animationDuration={1200}>
                {buckets.map((b, i) => <Cell key={b.name} fill={b.hidden ? "oklch(0.2 0.01 260 / 0.1)" : bucketColors[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="text-[11px] text-muted-foreground">Buckets under three students are hidden.</p>
      </div>
    </section>
  );
}
