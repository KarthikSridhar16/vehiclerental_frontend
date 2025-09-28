import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import api from '../api/client'

export default function AuthLogin({ onAuth }){
  const nav = useNavigate()
  const [params] = useSearchParams()
  const redirect = params.get('redirect') || '/'

  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState('')

  useEffect(()=>{
    // if already logged in, go to redirect target
    if (localStorage.getItem('token')) nav(redirect, { replace: true })
  },[])

  const submit = async e=>{
    e.preventDefault()
    setErr(''); setLoading(true)
    try{
      const r = await api.post('/auth/login',{ email,password })
      onAuth(r.data)
      nav(redirect, { replace: true })
    }catch(e){
      setErr(e?.response?.data?.error || 'Login failed')
    }finally{
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className="card max-w-md mx-auto">
      <h1 className="font-semibold mb-4">Login</h1>
      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}
      <input className="input w-full mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input type="password" className="input w-full mb-4" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
      <button className="btn w-full" disabled={loading}>{loading ? '...' : 'Login'}</button>
    </form>
  )
}
