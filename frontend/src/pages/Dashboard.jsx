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

  // Skeleton while loading
  if (!data) {
    return (
      <div className="space-y-6">
        <div className="h-7 w-44 bg-zinc-800 rounded" />
        <div className="grid md:grid-cols-2 gap-6">
          <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="h-4 w-40 bg-zinc-800 rounded mb-3" />
            <div className="h-full w-full bg-zinc-950 border border-zinc-900 rounded" />
          </div>
          <div className="h-72 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
            <div className="h-4 w-56 bg-zinc-800 rounded mb-3" />
            <div className="h-full w-full bg-zinc-950 border border-zinc-900 rounded" />
          </div>
        </div>
      </div>
    )
  }

  // ---- Build datasets ----
  // Expenses by category (doughnut)
  const catTotals = {}
  for (const r of data.byCategory) {
    if (r.type === 'expense') catTotals[r.category] = (catTotals[r.category] || 0) + r.total
  }
  const doughnutData = {
    labels: Object.keys(catTotals),
    datasets: [{
        data: Object.values(catTotals),
        backgroundColor: [
        '#f87171', // red
        '#60a5fa', // blue
        '#34d399', // green
        '#fbbf24', // yellow
        '#a78bfa', // purple
        '#fb923c', // orange
        '#2dd4bf'  // teal
        ],
        borderColor: '#18181b', // dark border to match theme
        borderWidth: 2
    }]
    }

  // Income vs Expense by day (bar)
  const days = [...new Set(data.byDate.map(d => d.date))].sort()
  const income = days.map(d => data.byDate.find(x => x.date === d && x.type === 'income')?.total || 0)
  const expense = days.map(d => data.byDate.find(x => x.date === d && x.type === 'expense')?.total || 0)
  const barData = {
  labels: days,
  datasets: [
    { 
      label: 'Income',
      data: income,
      backgroundColor: '#34d399' // green
    },
    { 
      label: 'Expense',
      data: expense,
      backgroundColor: '#f87171' // red
    }
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
