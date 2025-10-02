// src/pages/Search.jsx
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../api/client";
import VehicleCard from "../components/VehicleCard";


const pickArray = (raw) => {
  if (Array.isArray(raw)) return raw;
 
  for (const k of ["data", "results", "docs", "items", "list"]) {
    if (Array.isArray(raw?.[k])) return raw[k];
  }

  if (raw && typeof raw === "object") {
    for (const v of Object.values(raw)) if (Array.isArray(v)) return v;
  }
  return [];
};

export default function Search() {
  const [params] = useSearchParams();
  const [items, setItems] = useState([]);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = Object.fromEntries(params.entries());
    let on = true;
    setLoading(true);

    api
      .get("/vehicles", { params: q })
      .then((r) => {

        const arr = pickArray(r?.data);

        const serverCount =
          r?.data?.count ??
          r?.data?.total ??
          r?.data?.totalDocs ??
          r?.data?.pagination?.total ??
          null;

        if (!on) return;
        setItems(arr);
        setCount(typeof serverCount === "number" ? serverCount : arr.length);
      })
      .catch(() => {
        if (!on) return;
        setItems([]);
        setCount(0);
      })
      .finally(() => on && setLoading(false));

    return () => {
      on = false;
    };
  }, [params]);

  return (
    <div className="container-xl py-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-[Cinzel] text-2xl">
          Available Vehicles ({loading ? "…" : count})
        </h2>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-slate-300">No vehicles match your search.</div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((v) => (
            <VehicleCard key={v._id || v.id} v={v} />
          ))}
        </div>
      )}
    </div>
  );
}
