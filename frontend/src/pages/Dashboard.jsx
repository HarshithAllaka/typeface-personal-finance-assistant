import { useEffect, useState } from 'react'
import api from '../shared/api'

// chart.js setup
import { Doughnut, Bar } from 'react-chartjs-2'
import {
  Chart, ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend
} from 'chart.js'
Chart.register(ArcElement, BarElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function Dashboard(){
  const [data, setData] = useState(null)
  const [err, setErr] = useState('')

  useEffect(() => {
    api.get('/api/transactions/analytics')
      .then(res => setData(res.data))
      .catch(e => setErr(e?.response?.data?.error || 'Failed to load analytics'))
  }, [])

  if (err) return <p className="text-red-400">{err}</p>
  if (!data) return <p className="text-zinc-400">Loading…</p>

  // ---- Build datasets ----
  // Expenses by category (doughnut)
  const catTotals = {}
  for (const r of data.byCategory) {
    if (r.type === 'expense') catTotals[r.category] = (catTotals[r.category] || 0) + r.total
  }
  const doughnutData = {
    labels: Object.keys(catTotals),
    datasets: [{ data: Object.values(catTotals) }]
  }

  // Income vs Expense by day (bar)
  const days = [...new Set(data.byDate.map(d => d.date))].sort()
  const income = days.map(d => data.byDate.find(x => x.date === d && x.type === 'income')?.total || 0)
  const expense = days.map(d => data.byDate.find(x => x.date === d && x.type === 'expense')?.total || 0)
  const barData = {
    labels: days,
    datasets: [
      { label: 'Income', data: income },
      { label: 'Expense', data: expense }
    ]
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Overview</h1>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <h2 className="mb-2 text-sm text-zinc-400">Expenses by Category</h2>
          <Doughnut data={doughnutData} />
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <h2 className="mb-2 text-sm text-zinc-400">Daily Income vs Expense</h2>
          <Bar data={barData} />
        </div>
      </div>
    </div>
  )
}
