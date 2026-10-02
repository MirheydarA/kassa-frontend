import { Routes, Route } from 'react-router-dom'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Loans from './pages/Loans'
import LoanDetails from './pages/LoanDetails'
import MyDebts from './pages/MyDebts'
import MyDebtDetails from './pages/MyDebtDetails'
import Exchange from './pages/Exchange'
import Expenses from './pages/Expenses'
import Clients from './pages/Clients'

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/:id" element={<LoanDetails />} />
          <Route path="/mydebts" element={<MyDebts />} />
          <Route path="/mydebts/:id" element={<MyDebtDetails />} />
          <Route path="/exchange" element={<Exchange />} />
          <Route path="/expenses" element={<Expenses />} />
          <Route path="/clients" element={<Clients />} />
        </Route>
      </Route>
    </Routes>
  )
}
