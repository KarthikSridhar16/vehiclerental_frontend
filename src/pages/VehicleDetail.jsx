import { useEffect, useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import api from '../api/client'

export default function VehicleDetail(){
  const { id } = useParams()
  const nav = useNavigate()
  const loc = useLocation()

  const [v,setV] = useState(null)
  const [start,setStart] = useState('')
  const [end,setEnd] = useState('')

  useEffect(()=>{
    api.get(`/vehicles/${id}`).then(r=>setV(r.data))
  },[id])

  const book = async ()=>{
    const token = localStorage.getItem('token')
    if (!token) {
      return nav(`/login?redirect=${encodeURIComponent(loc.pathname)}`)
    }
    if (!start || !end) return alert('Select start and end dates')

    const r = await api.post('/bookings', { vehicleId: id, start, end })
    nav(`/checkout/${r.data._id}`)
  }

  if(!v) return <div>Loading...</div>

  return (
    <div className="grid" style={{gridTemplateColumns:'1fr 1fr', gap:24}}>
      <div>
        <img src={v.images?.[0]} className="w-full rounded" style={{objectFit:'cover', maxHeight:380}}/>
        <div className="mt-2" style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
          {v.images?.slice(1).map((src,i)=>(
            <img key={i} src={src} className="rounded" style={{height:80, width:'100%', objectFit:'cover'}}/>
          ))}
        </div>
      </div>
      <div>
        <h1 style={{fontSize:24, fontWeight:700}}>{v.make} {v.model} ({v.year})</h1>
        <p className="text-gray-500">{v.type} · {v.location}</p>
        <p style={{fontSize:20, fontWeight:700, marginTop:8}}>₹{v.pricePerDay}/day</p>

        <div className="mt-4">
          <div className="flex gap-2">
            <input type="date" value={start} onChange={e=>setStart(e.target.value)} className="input w-full" />
            <input type="date" value={end} onChange={e=>setEnd(e.target.value)} className="input w-full" />
          </div>
          <button onClick={book} className="btn mt-3">Book Now</button>
        </div>

        <p className="text-gray-500 mt-4" style={{lineHeight:1.6}}>{v.description}</p>
      </div>
    </div>
  )
}
