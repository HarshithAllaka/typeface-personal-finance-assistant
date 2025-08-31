// frontend/src/pages/Signup.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../shared/api";
import Brand from "../components/Brand";

export default function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // Helper: persist token + set default header
  function setToken(token) {
    if (!token) return;
    localStorage.setItem("token", token);
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    const nm = name.trim();
    const em = email.trim();
    const pw = password;

    if (!nm || !em || !pw || !confirm) {
      setErr("Please fill in all fields.");
      return;
    }
    if (pw.length < 6) {
      setErr("Password must be at least 6 characters.");
      return;
    }
    if (pw !== confirm) {
      setErr("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      // Try your register endpoint (change path if your backend uses /signup)
      const { data } = await api.post("/api/auth/register", {
        name: nm,
        email: em,
        password: pw,
      });

      // If backend returns a token on register, use it
      if (data?.token) {
        setToken(data.token);
      } else {
        // Otherwise immediately log the user in using the same credentials
        const res = await api.post("/api/auth/login", { email: em, password: pw });
        setToken(res?.data?.token);
      }

      // Go to your Dashboard (root path renders it in your router)
      navigate("/", { replace: true });
    } catch (e) {
      const msg =
        e?.response?.data?.error ||
        e?.response?.data?.message ||
        e?.message ||
        "Signup failed";
      setErr(msg);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 relative overflow-hidden">
      {/* Subtle background accents */}
      <div className="pointer-events-none absolute inset-0 opacity-30">
        <div className="absolute -top-28 -right-28 h-64 w-64 rounded-full bg-fuchsia-500/20 blur-3xl" />
        <div className="absolute -bottom-28 -left-28 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto grid min-h-screen max-w-5xl place-items-center px-4">
        <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/60 p-8 shadow-2xl shadow-black/40 backdrop-blur">
          {/* Brand */}
          <div className="mb-6 flex items-center justify-center gap-2">
            <Brand />
          </div>

          <h1 className="mb-1 text-center text-2xl font-semibold">Create your account</h1>
          <p className="mb-6 text-center text-sm text-zinc-400">
            Join <span className="font-medium text-zinc-200">FinSight</span> and track your money smarter.
          </p>

          <form onSubmit={onSubmit} className="space-y-4">
            <div>
              <label className="mb-1 block text-sm text-zinc-400">Name</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Email</label>
              <input
                className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 outline-none focus:border-zinc-600"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Password</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-12 outline-none focus:border-zinc-600"
                  type={showPwd ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  autoComplete="new-password"
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

            <div>
              <label className="mb-1 block text-sm text-zinc-400">Confirm password</label>
              <div className="relative">
                <input
                  className="w-full rounded-xl border border-zinc-800 bg-zinc-950 px-3 py-2 pr-12 outline-none focus:border-zinc-600"
                  type={showConfirm ? "text" : "password"}
                  placeholder="Repeat the password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded px-2 py-1 text-xs text-zinc-400 hover:text-zinc-200"
                >
                  {showConfirm ? "Hide" : "Show"}
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
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <div className="mt-5 text-center text-sm text-zinc-400">
            Already have an account?{" "}
            <Link to="/login" className="text-zinc-200 underline decoration-zinc-500 underline-offset-4 hover:text-white">
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
