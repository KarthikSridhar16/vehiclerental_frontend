import { Link } from 'react-router-dom'

export default function Home(){
  return (
    <section style={{ textAlign: 'center' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Find your ride</h1>
      <p className="muted" style={{ marginBottom: 24 }}>SUVs, Sedans, EVs and more.</p>
      <Link to="/search" className="btn">Browse vehicles</Link>
    </section>
  )
}
