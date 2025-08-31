import { useEffect, useState } from "react";
import api from "../shared/api";

// chart.js
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
} from "chart.js";
import { Doughnut, Bar } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  Title
);

export default function Analysis() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [data, setData] = useState({ byCategory: [], byDate: [] });

  // ---- time range filter state
  const [range, setRange] = useState("30d"); // "7d" | "30d" | "year" | "custom"
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");

  async function load() {
    setLoading(true);
    setErr("");

    const params = new URLSearchParams();
    let from, to;
    const today = new Date();

    if (range === "7d") {
      from = new Date(today);
      from.setDate(today.getDate() - 7);
      to = today;
    } else if (range === "30d") {
      from = new Date(today);
      from.setDate(today.getDate() - 30);
      to = today;
    } else if (range === "year") {
      from = new Date(today.getFullYear(), 0, 1);
      to = today;
    } else if (range === "custom") {
      if (customFrom) params.append("from", customFrom);
      if (customTo) params.append("to", customTo);
    }

    if (from && to && range !== "custom") {
      params.append("from", from.toISOString().slice(0, 10));
      params.append("to", to.toISOString().slice(0, 10));
    }

    try {
      const { data } = await api.get(`/api/transactions/analytics?${params}`);
      setData(data);
    } catch (e) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [range, customFrom, customTo]);

  if (loading) return <div className="text-zinc-400">Loading…</div>;
  if (err) return <div className="text-rose-400">Error: {err}</div>;

  // ---- Doughnut: expenses by category
  const expenseCats = data.byCategory.filter((x) => x.type === "expense");

  const doughnut = {
    labels: expenseCats.map((x) => x.category),
    datasets: [
      {
        data: expenseCats.map((x) => x.total),
        backgroundColor: [
          "#f87171",
          "#60a5fa",
          "#34d399",
          "#fbbf24",
          "#a78bfa",
          "#fb923c",
          "#2dd4bf",
        ],
        borderColor: "#18181b",
        borderWidth: 2,
      },
    ],
  };

  // ---- Bar: per day income vs expense
  const byDate = data.byDate;
  const days = [...new Set(byDate.map((x) => x.date))].sort();
  const income = days.map(
    (d) => byDate.find((x) => x.date === d && x.type === "income")?.total || 0
  );
  const expense = days.map(
    (d) => byDate.find((x) => x.date === d && x.type === "expense")?.total || 0
  );

  const bars = {
    labels: days,
    datasets: [
      { label: "Income", data: income, backgroundColor: "#34d399" },
      { label: "Expense", data: expense, backgroundColor: "#f87171" },
    ],
  };

  const card =
    "bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm shadow-black/20";

  return (
    <div className="space-y-6">
      {/* Header + Filters */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="mr-auto">
          <h1 className="text-2xl font-semibold">Analytics</h1>
          <p className="text-zinc-400 text-sm">Spending patterns and daily flow.</p>
        </div>

        <div className="flex flex-col">
          <label className="text-xs text-zinc-400">Time Range</label>
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="year">This Year</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        {range === "custom" && (
          <>
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400">From</label>
              <input
                type="date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
              />
            </div>
            <div className="flex flex-col">
              <label className="text-xs text-zinc-400">To</label>
              <input
                type="date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1"
              />
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Doughnut */}
        <div className={`${card} h-[360px]`}>
          <div className="text-sm text-zinc-400 mb-0">Expenses by Category</div>
          {expenseCats.length ? (
            <Doughnut
              data={doughnut}
              options={{
                maintainAspectRatio: false,
                plugins: {
                  legend: { labels: { color: "#e4e4e7" } },
                },
              }}
            />
          ) : (
            <div className="text-zinc-400">No expense data yet.</div>
          )}
        </div>

        {/* Bars */}
        <div className={`${card} h-[360px]`}>
          <div className="text-sm text-zinc-400 mb-3">Daily Income vs Expense</div>
          {days.length ? (
            <Bar
              data={bars}
              options={{
                maintainAspectRatio: false,
                responsive: true,
                scales: {
                  x: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "#27272a" },
                  },
                  y: {
                    ticks: { color: "#a1a1aa" },
                    grid: { color: "#27272a" },
                  },
                },
                plugins: {
                  legend: { labels: { color: "#e4e4e7" } },
                  tooltip: {
                    callbacks: {
                      label: (ctx) =>
                        `${ctx.dataset.label}: ${Number(ctx.parsed.y).toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          ) : (
            <div className="text-zinc-400">No daily data yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
