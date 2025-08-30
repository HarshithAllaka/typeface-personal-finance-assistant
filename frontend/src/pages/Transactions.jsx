import { useEffect, useMemo, useState } from 'react'
import api from '../shared/api'
import { format } from 'date-fns'

const PAGE_SIZE = 8

export default function Transactions(){
  const [items,setItems]=useState([])
  const [total,setTotal]=useState(0)
  const [page,setPage]=useState(1)
  const [type,setType]=useState('')
  const [from,setFrom]=useState('')
  const [to,setTo]=useState('')
  const [loading,setLoading]=useState(false)

  const [editing,setEditing]=useState(null) // 'new' | id | null
  const [form,setForm]=useState({ type:'expense', amount:'', category:'General', date:'', description:'' })

  const pages = useMemo(()=>Math.max(1, Math.ceil(total / PAGE_SIZE)),[total])

  async function load(p = page){
    setLoading(true)
    const params = new URLSearchParams({ page: p, limit: PAGE_SIZE })
    if (type) params.append('type', type)
    if (from) params.append('from', from)
    if (to) params.append('to', to)

    try {
      const { data } = await api.get(`/api/transactions?${params.toString()}`)
      setItems(data.items); setTotal(data.total); setPage(data.page)
    } finally {
      setLoading(false)
    }
  }

  useEffect(()=>{ load(1) }, [type, from, to])

  function startCreate(){
    setEditing('new')
    setForm({ type:'expense', amount:'', category:'General', date:format(new Date(),'yyyy-MM-dd'), description:'' })
  }
  function startEdit(t){
    setEditing(t._id)
    setForm({ type:t.type, amount:String(t.amount), category:t.category, date:t.date.slice(0,10), description:t.description || '' })
  }
  function cancel(){ setEditing(null) }

  async function save(){
    const body = { ...form, amount: Number(form.amount) }
    if (editing === 'new') await api.post('/api/transactions', body)
    else await api.put(`/api/transactions/${editing}`, body)
    setEditing(null); await load(page)
  }

  async function remove(id){
    if (!confirm('Delete this transaction?')) return
    await api.delete(`/api/transactions/${id}`)
    await load(page)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Transactions</h1>

      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex flex-col">
          <label className="text-xs text-zinc-400">Type</label>
          <select value={type} onChange={e=>setType(e.target.value)}
                  className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1">
            <option value="">All</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-zinc-400">From</label>
          <input type="date" value={from} onChange={e=>setFrom(e.target.value)}
                 className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1" />
        </div>
        <div className="flex flex-col">
          <label className="text-xs text-zinc-400">To</label>
          <input type="date" value={to} onChange={e=>setTo(e.target.value)}
                 className="bg-zinc-900 border border-zinc-800 rounded px-2 py-1" />
        </div>
        <button onClick={()=>load(1)} className="px-3 py-2 rounded border border-zinc-700 hover:bg-zinc-800">
          Apply
        </button>
        <div className="flex-1" />
        <button onClick={startCreate} className="px-3 py-2 rounded bg-white text-black">+ New</button>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-zinc-950/60">
            <tr className="[&>th]:text-left [&>th]:p-3 text-zinc-400">
              <th>Date</th><th>Type</th><th>Category</th><th>Description</th>
              <th className="text-right">Amount</th><th></th>
            </tr>
          </thead>
          <tbody>
            {loading && <tr><td className="p-3 text-zinc-400" colSpan="6">Loading…</td></tr>}
            {!loading && items.map(t=>(
              <tr key={t._id} className="border-t border-zinc-800 hover:bg-zinc-800/40">
                <td className="p-3">{t.date.slice(0,10)}</td>
                <td className="p-3">{t.type}</td>
                <td className="p-3">{t.category}</td>
                <td className="p-3">{t.description}</td>
                <td className="p-3 text-right">{t.amount.toFixed(2)}</td>
                <td className="p-3 text-right space-x-2">
                  <button onClick={()=>startEdit(t)} className="px-2 py-1 border border-zinc-700 rounded">Edit</button>
                  <button onClick={()=>remove(t._id)} className="px-2 py-1 border border-zinc-700 rounded">Delete</button>
                </td>
              </tr>
            ))}
            {!loading && items.length===0 && <tr><td className="p-3 text-zinc-400" colSpan="6">No data</td></tr>}
          </tbody>
        </table>
      </div>

      <div className="flex items-center gap-2 justify-end">
        <button disabled={page<=1} onClick={()=>load(page-1)}
                className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40">Prev</button>
        <span className="text-sm text-zinc-400">Page {page} / {pages}</span>
        <button disabled={page>=pages} onClick={()=>load(page+1)}
                className="px-3 py-1 rounded border border-zinc-700 disabled:opacity-40">Next</button>
      </div>

      {editing && (
        <div className="fixed inset-0 bg-black/60 grid place-items-center">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 w-[480px] max-w-[95vw] space-y-3">
            <h3 className="font-semibold">{editing==='new'?'New':'Edit'} transaction</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-zinc-400">Type</label>
                <select value={form.type} onChange={e=>setForm(f=>({...f,type:e.target.value}))}
                        className="bg-zinc-950 border border-zinc-800 rounded w-full p-2">
                  <option value="income">income</option>
                  <option value="expense">expense</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-zinc-400">Amount</label>
                <input type="number" value={form.amount}
                       onChange={e=>setForm(f=>({...f,amount:e.target.value}))}
                       className="bg-zinc-950 border border-zinc-800 rounded w-full p-2" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Category</label>
                <input value={form.category}
                       onChange={e=>setForm(f=>({...f,category:e.target.value}))}
                       className="bg-zinc-950 border border-zinc-800 rounded w-full p-2" />
              </div>
              <div>
                <label className="text-xs text-zinc-400">Date</label>
                <input type="date" value={form.date}
                       onChange={e=>setForm(f=>({...f,date:e.target.value}))}
                       className="bg-zinc-950 border border-zinc-800 rounded w-full p-2" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-zinc-400">Description</label>
                <input value={form.description}
                       onChange={e=>setForm(f=>({...f,description:e.target.value}))}
                       className="bg-zinc-950 border border-zinc-800 rounded w-full p-2" />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={cancel} className="px-3 py-2 border border-zinc-700 rounded">Cancel</button>
              <button onClick={save} className="px-3 py-2 bg-white text-black rounded">Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
