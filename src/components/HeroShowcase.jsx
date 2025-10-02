import { useEffect, useRef, useState } from "react";
import api from "../api/client";
import "../styles/home.css";

export default function HeroShowcase(){
  const [list,setList] = useState([]);
  const [i,setI] = useState(0);
  const timer = useRef(null);

  useEffect(()=>{
    let alive = true;
    api.get("/vehicles", { params:{ limit: 10 }}).then(r=>{
      const items = r.data?.data || r.data?.items || [];
      if(alive) setList(items.filter(x=>x.images?.[0]));
    });
    return ()=>{ alive=false };
  },[]);

  useEffect(()=>{
    if(!list.length) return;
    timer.current = setInterval(()=> setI(v => (v+1)%list.length), 4500);
    return ()=> clearInterval(timer.current);
  },[list.length]);

  if(!list.length) return null;
  const v = list[i];

  return (
    <section className="hero">
      <img className="hero-img" src={v.images[0]} alt={`${v.make} ${v.model}`} />
      <div className="hero-overlay" />
      <div className="hero-content">
        <h1 className="hero-title">{v.make} {v.model}</h1>
        <div className="hero-sub">{(v.type || "Vehicle")} • {(v.location || "")}</div>
      </div>

      <div className="hero-controls">
        <button className="hero-arrow" aria-label="previous" onClick={()=> setI(i===0? list.length-1 : i-1)}>&larr;</button>
        <button className="hero-arrow" aria-label="next" onClick={()=> setI((i+1)%list.length)}>&rarr;</button>
      </div>

      <div className="hero-dots">
        {list.map((_,k)=><span key={k} className={`hero-dot ${k===i? "active":""}`} />)}
      </div>
    </section>
  );
}
