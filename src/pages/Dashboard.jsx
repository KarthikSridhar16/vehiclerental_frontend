import { useEffect, useState } from 'react'
import api from '../api/client'

export default function Dashboard(){
  const [rows,setRows] = useState([])
  const [loading,setLoading] = useState(true)

  useEffect(()=>{
    api.get('/bookings/me')
      .then(r=> setRows(r.data?.data || []))
      .finally(()=> setLoading(false))
  },[])

  return (
    <div>
      <h1 className="font-semibold mb-4">My Bookings</h1>
      <div className="card overflow-x-auto">
        {loading ? 'Loading...' : (
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-gray-600">
                <th className="py-2 pr-4">Vehicle</th>
                <th className="py-2 pr-4">Dates</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(b=>(
                <tr key={b._id} className="border-t">
                  <td className="py-2 pr-4">{b.vehicle?.make} {b.vehicle?.model}</td>
                  <td className="py-2 pr-4">
                    {new Date(b.start).toLocaleDateString()} → {new Date(b.end).toLocaleDateString()}
                  </td>
                  <td className="py-2 pr-4">{b.status}</td>
                </tr>
              ))}
              {!rows.length && (
                <tr><td className="py-2 pr-4 text-gray-500" colSpan="3">No bookings yet.</td></tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
