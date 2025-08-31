export default function QuickAction({ title, desc, icon, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left bg-zinc-900 border border-zinc-800 hover:bg-zinc-800/60 rounded-2xl p-4 transition"
    >
      <div className="flex items-center gap-3">
        <div className="text-xl">{icon}</div>
        <div>
          <div className="font-medium">{title}</div>
          <div className="text-sm text-zinc-400">{desc}</div>
        </div>
      </div>
    </button>
  );
}
