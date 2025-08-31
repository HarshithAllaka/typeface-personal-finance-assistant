import { format } from 'date-fns';

export default function RecentList({ items=[] }) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl">
      <div className="p-4 border-b border-zinc-800 text-sm text-zinc-400">
        Recent Transactions
      </div>
      <ul className="divide-y divide-zinc-800">
        {items.length === 0 && (
          <li className="p-4 text-zinc-400">No recent transactions.</li>
        )}
        {items.map(t => (
          <li key={t._id} className="p-4 flex items-center justify-between">
            <div>
              <div className="font-medium">{t.description || (t.type === 'income' ? 'Income' : 'Expense')}</div>
              <div className="text-sm text-zinc-400">
                {t.category} • {format(new Date(t.date), 'd MMM yyyy')}
              </div>
            </div>
            <div className={`font-semibold ${t.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
              {t.type === 'income' ? '+' : '-'} {t.amount.toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
