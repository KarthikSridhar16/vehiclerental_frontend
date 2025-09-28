import { Routes, Route, Link, useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'
import Home from './pages/Home.jsx'
import Search from './pages/Search.jsx'
import VehicleDetail from './pages/VehicleDetail.jsx'
import Checkout from './pages/Checkout.jsx'
import AuthLogin from './pages/AuthLogin.jsx'
import AuthRegister from './pages/AuthRegister.jsx'
import Dashboard from './pages/Dashboard.jsx'
import NotFound from './pages/NotFound.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'

export default function App(){
  const [user, setUser] = useState(()=>{
    const u = localStorage.getItem('user')
    return u ? JSON.parse(u) : null
  })
  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    setUser(null)
  }

  const nav = useNavigate()
  const [params] = useSearchParams()

  return (
    <>
      {/* Navbar */}
      <header className="navbar border-b bg-white">
        <div className="navbar-inner max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Link className="brand font-bold text-xl text-indigo-600" to="/">VehicleRent</Link>
          <form
            onSubmit={(e)=>{e.preventDefault(); nav(`/search?q=${e.target.q.value}`)}}
            style={{ flex: 1 }}
          >
            <input
              name="q"
              defaultValue={params.get('q') || ''}
              placeholder="Search make/model/location"
              className="input w-full border rounded-md px-3 py-2"
            />
          </form>
          <nav className="flex gap-2">
            {user ? (
              <>
                <Link to="/dashboard" className="badge">Dashboard</Link>
                {user.role === 'admin' && <Link to="/admin" className="badge">Admin</Link>}
                <button onClick={logout} className="badge bg-red-50 text-red-700">Logout</button>
              </>
            ) : (
              <>
                <Link to="/login" className="badge">Login</Link>
                <Link to="/register" className="badge">Sign up</Link>
              </>
            )}
          </nav>
        </div>
      </header>

      {/* Main */}
      <main className="container max-w-7xl mx-auto px-4 py-6">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/vehicle/:id" element={<VehicleDetail />} />
          <Route path="/checkout/:bookingId" element={
            <ProtectedRoute user={user}>
              <Checkout />
            </ProtectedRoute>
          } />
          <Route path="/login" element={<AuthLogin onAuth={(data)=>{ 
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
          }} />} />
          <Route path="/register" element={<AuthRegister onAuth={(data)=>{ 
            localStorage.setItem('token', data.token)
            localStorage.setItem('user', JSON.stringify(data.user))
            setUser(data.user)
          }} />} />
          <Route path="/dashboard" element={
            <ProtectedRoute user={user}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </>
  )
}
