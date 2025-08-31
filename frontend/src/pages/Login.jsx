import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../shared/api";
import Brand from "../components/Brand";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      localStorage.setItem("token", data.token);
      navigate("/dashboard", { replace: true });
    } catch (e) {
      setErr(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-24 -left-24 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-5xl place-items-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          {/* Brand */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <Brand />
          </div>

          <h1 className="mb-1 text-center text-2xl font-semibold">Welcome back</h1>
          <p className="mb-6 text-center text-sm text-zinc-400">
            Sign in to your <span className="font-medium text-zinc-200">FinSight</span> account.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-12 outline-none focus:border-zinc-600"
                  type={showPwd ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showPwd ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {err && (
              <div className="rounded-xl border border-rose-700/40 bg-rose-900/20 p-2 text-sm text-rose-300">
                {err}
              </div>
            )}

            <button
              disabled={loading}
              className="w-full rounded-xl bg-white py-2 font-medium text-black transition hover:opacity-90 disabled:opacity-50"
            >
              {loading ? "Signing in…" : "Login"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-zinc-400">
            Don’t have an account?{" "}
            <Link to="/signup" className="text-zinc-200 underline decoration-zinc-500 underline-offset-4 hover:text-white">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
