import { useState } from 'react'
import api from '../shared/api'

export default function Receipts(){
  const [file,setFile] = useState(null)
  const [res,setRes] = useState(null)
  const [err,setErr] = useState('')
  const [loading,setLoading] = useState(false)
  const [adding,setAdding] = useState(false)

  async function upload(){
    if (!file) return
    setErr(''); setRes(null); setLoading(true)
    try{
      const fd = new FormData()
      fd.append('file', file)           // key MUST be 'file' for multer.single('file')
      const { data } = await api.post('/api/receipts/upload', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setRes(data)
    }catch(e){
      setErr(e?.response?.data?.error || 'Upload failed')
    }finally{
      setLoading(false)
    }
  }

  async function addFromSuggestion(){
    if (!res?.suggestions) return
    setAdding(true)
    try{
      const s = res.suggestions
      await api.post('/api/transactions', {
        type: s.type || 'expense',
        amount: Number(s.amount || 0),
        category: s.category || 'General',
        date: s.date ? new Date(s.date) : new Date(),
        description: 'From receipt',
        source: 'receipt',
        receiptFile: res.file || ''
      })
      alert('Transaction added')
    }catch(e){
      alert(e?.response?.data?.error || 'Failed to add')
    }finally{
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Receipts</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="file"
            onChange={e=>setFile(e.target.files?.[0] || null)}
            className="file:mr-3 file:px-3 file:py-2 file:rounded file:border-0 file:bg-white file:text-black" />
          <button
            disabled={!file || loading}
            onClick={upload}
            className="px-3 py-2 rounded bg-white text-black disabled:opacity-40">
            {loading ? 'Uploading…' : 'Upload'}
          </button>
        </div>

        {err && <p className="text-red-400 text-sm">{err}</p>}

        {res && (
          <div className="mt-4 grid md:grid-cols-2 gap-4">
            <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
              <div className="text-sm text-zinc-400 mb-2">Suggestions</div>
              <pre className="text-xs whitespace-pre-wrap">
                {JSON.stringify(res.suggestions, null, 2)}
              </pre>
              <button
                onClick={addFromSuggestion}
                disabled={adding}
                className="mt-3 px-3 py-2 rounded bg-white text-black disabled:opacity-40">
                {adding ? 'Adding…' : 'Add as transaction'}
              </button>
            </div>

            <div className="bg-zinc-950 border border-zinc-800 rounded p-3">
              <div className="text-sm text-zinc-400 mb-2">Extracted text (preview)</div>
              <pre className="text-xs max-h-80 overflow-auto whitespace-pre-wrap">
                {res.rawText}
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
