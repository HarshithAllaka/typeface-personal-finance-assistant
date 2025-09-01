// frontend/src/pages/Receipts.jsx
import { useState } from "react";
import api from "../shared/api";

export default function Receipts() {
  const [file, setFile] = useState(null);

  // OCR result (single receipt)
  const [suggestions, setSuggestions] = useState(null); // { type, amount, date, category }
  const [rawText, setRawText] = useState("");           // preview text

  // UI state
  const [uploading, setUploading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);

  async function handleUploadReceipt() {
    if (!file) return alert("Pick a file first");

    const fd = new FormData();
    fd.append("file", file);

    try {
      setUploading(true);
      // your existing OCR endpoint
      const { data } = await api.post("/api/receipts/upload", fd);
      // Expecting: { message, file, suggestions, rawText }
      setSuggestions(data.suggestions || null);
      setRawText(data.rawText || "");
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setUploading(false);
    }
  }

  async function handleAddSuggestion() {
    if (!suggestions) return alert("No suggestion to add yet.");
    // Basic validation to mirror server rules
    if (!suggestions.type || suggestions.amount == null || !suggestions.date) {
      return alert("type, amount, and date required");
    }

    try {
      setAdding(true);
      await api.post("/api/transactions", {
        ...suggestions,
        // ensure date is an ISO string or yyyy-mm-dd
        date: suggestions.date,
        source: "receipt",
      });
      alert("Transaction saved.");
      // Clear only the suggestion (keep file for optional bulk import)
      // setFile(null);
      // setRawText("");
      // setSuggestions(null);
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setAdding(false);
    }
  }

  async function handleImportPdf() {
    if (!file) return alert("Pick a PDF first");

    const fd = new FormData();
    fd.append("file", file);

    try {
      setImporting(true);
      // bulk import endpoint you tested in Postman
      const { data } = await api.post("/api/transactions/import-pdf", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Expecting: { inserted: N }
      alert(`Imported ${data.inserted ?? 0} transactions from PDF.`);
      // You can optionally clear UI here:
      // setFile(null);
      // setRawText("");
      // setSuggestions(null);
    } catch (e) {
      alert(e?.response?.data?.error || e.message);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Receipts</h1>

      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
        <div className="flex flex-wrap items-center gap-5">
          <label className="inline-flex items-center">
            <input
              type="file"
              accept="application/pdf,image/*"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
              id="receipt-file"
            />
            <span className="px-4 py-2 rounded border border-zinc-700 hover:bg-zinc-800 cursor-pointer">
              Choose File
            </span>
          </label>
          <span className="text-sm text-zinc-400">
            {file ? file.name : "No file chosen"}
          </span>

          <button
            onClick={handleUploadReceipt}
            disabled={!file || uploading}
            className="px-4 py-2 rounded bg-white text-black disabled:opacity-50"
          >
            {uploading ? "Uploading…" : "Upload (OCR)"}
          </button>

          <button
            onClick={handleImportPdf}
            disabled={!file || importing}
            className="px-4 py-2 rounded bg-white text-black disabled:opacity-50"
            title="Import rows from a bank/statement PDF table"
          >
            {importing ? "Importing…" : "Import PDF as transactions (bulk)"}
          </button>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 mt-4">
          {/* Suggestions (single txn) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-2">Suggestions</div>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(suggestions || {
                type: "expense",
                amount: null,
                date: new Date().toISOString(),
                category: "General",
              }, null, 2)}
            </pre>

            <button
              onClick={handleAddSuggestion}
              disabled={!suggestions || adding}
              className="mt-3 px-4 py-2 rounded bg-white text-black disabled:opacity-50"
            >
              {adding ? "Adding…" : "Add as transaction"}
            </button>
          </div>

          {/* Extracted text preview (just for user info) */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl p-4">
            <div className="text-sm text-zinc-400 mb-2">Extracted text (preview)</div>
            <pre className="text-xs whitespace-pre-wrap">
              {rawText || "—"}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
