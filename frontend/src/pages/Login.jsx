import { useState } from 'react';
import api from '../shared/api';

export default function Login(){
  const [email,setEmail] = useState('');
  const [password,setPassword] = useState('');
  const [loading,setLoading] = useState(false);
  const [err,setErr] = useState('');

  async function onSubmit(e){
    e.preventDefault();
    setErr(''); setLoading(true);
    try{
      const { data } = await api.post('/api/auth/login', { email, password });
      localStorage.setItem('token', data.token);
      window.location.href = '/';
    }catch(e){
      setErr(e?.response?.data?.error || 'Login failed');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-200 grid place-items-center">
      <form onSubmit={onSubmit} className="w-80 bg-zinc-900 border border-zinc-800 p-6 rounded-2xl space-y-3 shadow">
        <h1 className="text-xl font-semibold">Sign in</h1>
        <input
          className="bg-zinc-950 border border-zinc-800 w-full p-2 rounded"
          placeholder="email" value={email} onChange={e=>setEmail(e.target.value)}
        />
        <input
          className="bg-zinc-950 border border-zinc-800 w-full p-2 rounded"
          type="password" placeholder="password" value={password} onChange={e=>setPassword(e.target.value)}
        />
        {err && <p className="text-red-400 text-sm">{err}</p>}
        <button
          disabled={loading}
          className="bg-white text-black w-full py-2 rounded hover:opacity-90 disabled:opacity-50">
          {loading ? 'Signing in…' : 'Login'}
        </button>
      </form>
    </div>
  );
}
