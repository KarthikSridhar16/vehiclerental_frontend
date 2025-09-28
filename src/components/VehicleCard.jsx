import { Link } from 'react-router-dom'

export default function VehicleCard({ v }){
  return (
    <div className="card">
      <img
        src={v.images?.[0]}
        alt={`${v.make} ${v.model}`}
        className="w-full rounded"
        style={{ height: 160, objectFit: 'cover' }}
      />
      <div className="mt-3">
        <div className="flex justify-between items-center">
          <h3 className="font-semibold">
            {v.make} {v.model} <span className="text-gray-500 text-sm">({v.year})</span>
          </h3>
          <span className="font-bold">₹{v.pricePerDay}/day</span>
        </div>
        <p className="muted">{v.type} · {v.location}</p>
        <div className="mt-3">
          <Link to={`/vehicle/${v._id}`} className="btn text-sm">View</Link>
        </div>
      </div>
    </div>
  )
}
