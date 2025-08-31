import { Link, useLocation, Outlet, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import clsx from "clsx";
import Brand from "../components/Brand";

export default function Layout() {
  const [dark, setDark] = useState(() => localStorage.getItem("theme") !== "light");
  const loc = useLocation();
  const navigate = useNavigate();

  // theme toggle (optional)
  useEffect(() => {
    const html = document.documentElement;
    if (dark) {
      html.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      html.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [dark]);

  function logout() {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  }

  const link = (to, label) => (
    <Link
      to={to}
      className={clsx(
        "px-3 py-2 rounded hover:bg-zinc-800",
        loc.pathname === to && "bg-zinc-800 text-white"
      )}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200">
      <header className="border-b border-zinc-800 sticky top-0 bg-zinc-950/80 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center justify-between">
          {/* Left: brand + nav */}
          <div className="flex items-center gap-6">
            <Brand />
            <nav className="flex items-center gap-2">
              {link("/dashboard", "Dashboard")}
              {link("/transactions", "Transactions")}
              {link("/receipts", "Receipts")}
              {link("/analysis", "Analysis")}
            </nav>
          </div>

          {/* Right: controls */}
          <div className="flex items-center gap-2">
            {/* Optional theme toggle
            <button
              onClick={() => setDark(d => !d)}
              className="px-3 py-1 rounded border border-zinc-700 hover:bg-zinc-800"
            >
              {dark ? "🌙 Dark" : "☀️ Light"}
            </button>
            */}
            <button
              onClick={logout}
              className="px-3 py-1 rounded border border-zinc-700 hover:bg-zinc-800"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6">
        {/* Child page renders here */}
        <Outlet />
      </main>
    </div>
  );
}
