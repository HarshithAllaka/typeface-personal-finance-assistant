export default function StatCard({ title, value, icon, tone='zinc' }) {
  const toneBg = {
    zinc: 'bg-zinc-900 border-zinc-800',
    green: 'bg-emerald-950/50 border-emerald-900/60',
    red: 'bg-rose-950/50 border-rose-900/60',
    blue: 'bg-sky-950/50 border-sky-900/60'
  }[tone] || 'bg-zinc-900 border-zinc-800';

  return (
    <div className={`border ${toneBg} rounded-2xl p-4`}>
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="text-sm text-zinc-400">{title}</div>
          <div className="text-2xl font-semibold">{value}</div>
        </div>
      </div>
    </div>
  );
}
