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

  useEffect(() => {
    let alive = true;
    api
      .get("/api/transactions/analytics")
      .then(({ data }) => {
        if (alive) setData(data);
      })
      .catch((e) => setErr(e?.response?.data?.error || e.message))
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

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
      <div>
        <h1 className="text-2xl font-semibold">Analytics</h1>
        <p className="text-zinc-400 text-sm">Spending patterns and daily flow.</p>
      </div>

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
