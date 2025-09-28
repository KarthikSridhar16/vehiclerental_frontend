import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/client'

export default function AuthRegister({ onAuth }){
  const nav = useNavigate()
  const [name,setName] = useState('')
  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [err,setErr] = useState('')

  const submit = async (e)=>{
    e.preventDefault()
    setErr(''); setLoading(true)
    try{
      const r = await api.post('/auth/register',{ name, email, password })
      onAuth(r.data)
      nav('/')
    }catch(e){
      setErr(e?.response?.data?.error || 'Registration failed')
    }finally{ setLoading(false) }
  }

  return (
    <form onSubmit={submit} className="card max-w-md mx-auto">
      <h1 className="font-semibold mb-4">Create account</h1>
      {err && <div className="mb-3 text-red-600 text-sm">{err}</div>}
      <input className="input w-full mb-3" placeholder="Name" value={name} onChange={e=>setName(e.target.value)}/>
      <input className="input w-full mb-3" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <input type="password" className="input w-full mb-4" placeholder="Password" value={password} onChange={e=>setPassword(e.target.value)}/>
      <button className="btn w-full" disabled={loading}>{loading ? '...' : 'Sign up'}</button>
    </form>
  )
}
