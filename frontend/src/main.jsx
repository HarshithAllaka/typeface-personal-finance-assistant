import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Transactions from './pages/Transactions.jsx'
import Receipts from './pages/Receipts.jsx'
import Layout from './shared/Layout.jsx'

function Private({ children }) {
  const t = localStorage.getItem('token')
  return t ? children : <Navigate to="/login" replace />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Private><Layout><Dashboard/></Layout></Private>} />
      <Route path="/transactions" element={<Private><Layout><Transactions/></Layout></Private>} />
      <Route path="/receipts" element={<Private><Layout><Receipts/></Layout></Private>} />
    </Routes>
  </BrowserRouter>
)
