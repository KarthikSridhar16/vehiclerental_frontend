import { useParams } from 'react-router-dom'

export default function Checkout(){
  const { bookingId } = useParams()
  return (
    <div className="card">
      <h2 className="font-semibold mb-2">Checkout</h2>
      <p className="muted">Booking ID: {bookingId}</p>
      <p className="mt-3">Razorpay integration will go here.</p>
    </div>
  )
}
