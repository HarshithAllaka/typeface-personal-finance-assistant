import { useEffect, useState } from 'react'
import api from '../shared/api'
import StatCard from '../components/StatCard'
import QuickAction from '../components/QuickAction'
import RecentList from '../components/RecentList'
import { useNavigate } from 'react-router-dom'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [err, setErr] = useState('')
  const [summary, setSummary] = useState({ totalIncome: 0, totalExpense: 0, net: 0, recent: [] })
  const navigate = useNavigate()

  useEffect(() => {
    let alive = true
    api.get('/api/transactions/summary')
      .then(({ data }) => { if (alive) setSummary(data) })
      .catch(e => { if (alive) setErr(e?.response?.data?.error || e.message) })
      .finally(() => { if (alive) setLoading(false) })
    return () => { alive = false }
  }, [])

  if (loading) {
    return <div className="text-zinc-400">Loading…</div>
  }
  if (err) {
    return <div className="text-rose-400">Error: {err}</div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Welcome back 👋</h1>
        <p className="text-zinc-400 text-sm">Manage your finances with ease.</p>
      </div>

      {/* Quick actions */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <QuickAction
          title="Add Transaction"
          desc="Quickly log income or expenses"
          icon="➕"
          onClick={() => navigate('/transactions')}
        />
        <QuickAction
          title="Upload Receipt"
          desc="Extract data from receipts"
          icon="🧾"
          onClick={() => navigate('/receipts')}
        />
        <QuickAction
          title="View Analytics"
          desc="See spending patterns"
          icon="📊"
          onClick={() => navigate('/analysis')}
        />
        <QuickAction
          title="All Transactions"
          desc="View and manage transactions"
          icon="📚"
          onClick={() => navigate('/transactions')}
        />
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Income"
          value={summary.totalIncome.toLocaleString()}
          icon="💰"
          tone="green"
        />
        <StatCard
          title="Total Expenses"
          value={summary.totalExpense.toLocaleString()}
          icon="🧾"
          tone="red"
        />
        <StatCard
          title="Net Balance"
          value={summary.net.toLocaleString()}
          icon="⚖️"
          tone="blue"
        />
      </div>

      {/* Recent list */}
      <RecentList items={summary.recent} />
    </div>
  )
}
