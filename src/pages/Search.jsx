import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import api from '../api/client'
import VehicleCard from '../components/VehicleCard'

export default function Search(){
  const [params] = useSearchParams()
  const [items,setItems] = useState([])
  const [count,setCount] = useState(0)
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    const q = Object.fromEntries(params.entries())
    setLoading(true)
    api.get('/vehicles', { params: q }).then(r=>{
      setItems(r.data?.data || [])
      setCount(r.data?.count || 0)
    }).finally(()=>setLoading(false))
  },[params])

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold">Results ({count})</h2>
      </div>

      {loading ? <div>Loading...</div> : (
        <div className="grid-3">
          {items.map(v => <VehicleCard key={v._id} v={v} />)}
        </div>
      )}
    </div>
  )
}
