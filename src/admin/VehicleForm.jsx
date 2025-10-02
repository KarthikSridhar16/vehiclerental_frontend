import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { adminVehicles } from "../api/admin";

export default function VehicleForm({ mode = "create" }) {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);

  const [form, setForm] = useState({
    make: "", model: "", year: "", type: "",
    location: "", pricePerDay: "", status: "approved", 
    description: "",
  });

  const imagesRef = useRef(null);
  const specsRef  = useRef(null);
  const [defaults, setDefaults] = useState({ imagesText: "", specsText: "{}" });

  const [previewUrl, setPreviewUrl] = useState("");

  const remountKey = useMemo(() => `${mode}-${id || "new"}`, [mode, id]);

  const update = (k) => (e) => setForm((p) => ({ ...p, [k]: e.target.value }));

  const deriveFirstImage = () => {
    const raw = imagesRef.current?.value || defaults.imagesText || "";
    const first = raw.split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)[0] || "";
    setPreviewUrl(first);
  };

  useEffect(() => {
    if (mode !== "edit") return;
    let on = true;
    (async () => {
      try {
        setLoading(true);
        const res = await adminVehicles.get(id);
        const v = res?.data?.data || res?.data || {};
        if (!on) return;

        setForm({
          make: v.make || "",
          model: v.model || "",
          year: v.year ?? "",
          type: v.type || "",
          location: v.location || "",
          pricePerDay: v.pricePerDay ?? "",
          status: "approved",                 // ← force approved in UI
          description: v.description || "",
        });

        const imagesText = Array.isArray(v.images)
          ? v.images.map(String).join("\n")
          : (typeof v.images === "string" ? v.images : "");

        setDefaults({
          imagesText,
          specsText: JSON.stringify(v.specs || {}, null, 2),
        });

        // set preview
        const first = (imagesText || "")
          .split(/\r?\n|,/).map(s => s.trim()).filter(Boolean)[0] || "";
        setPreviewUrl(first);
      } catch (e) {
        setErr(e?.response?.data?.message || "Failed to load vehicle");
      } finally {
        setLoading(false);
      }
    })();
    return () => { on = false; };
  }, [id, mode]);

  useEffect(() => { deriveFirstImage(); }, [remountKey, defaults.imagesText]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErr(null);

    const imagesRaw = imagesRef.current?.value || "";
    const specsRaw  = specsRef.current?.value || "";

    const images = imagesRaw
      .split(/\r?\n|,/)
      .map((s) => s.trim())
      .filter(Boolean);

    let specs = {};
    try {
      specs = specsRaw.trim() ? JSON.parse(specsRaw) : {};
      if (specs === null || typeof specs !== "object") throw new Error();
    } catch {
      return setErr('Specs must be valid JSON, e.g. {"color":"red"}.');
    }

    const payload = {
      make: form.make.trim(),
      model: form.model.trim(),
      year: form.year === "" ? undefined : Number(form.year),
      type: form.type.trim(),
      location: form.location.trim(),
      pricePerDay: form.pricePerDay === "" ? undefined : Number(form.pricePerDay),
      status: "approved",                    
      description: form.description || "",
      images,
      specs,
    };

    try {
      setSaving(true);
      if (mode === "create") await adminVehicles.create(payload);
      else await adminVehicles.update(id, payload);
      navigate("/admin/vehicles");
    } catch (e) {
      setErr(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="admin-form space-y-5" key={remountKey}>
      <h1 className="admin-title">{mode === "create" ? "Add Vehicle" : "Edit Vehicle"}</h1>

      {loading && <div>Loading…</div>}

      {!loading && (
        <form onSubmit={onSubmit} className="space-y-5">
          {err && <div className="form-alert">{err}</div>}

          {/* ===== Basic Info ===== */}
          <section className="form-card">
            <h2 className="form-card-title">Basic Info</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Make" htmlFor="make">
                <input id="make" className="input" value={form.make} onChange={update("make")} required />
              </Field>
              <Field label="Model" htmlFor="model">
                <input id="model" className="input" value={form.model} onChange={update("model")} required />
              </Field>
              <Field label="Year" htmlFor="year" help="Optional">
                <input id="year" type="number" className="input" value={form.year} onChange={update("year")} />
              </Field>
              <Field label="Type" htmlFor="type" help="e.g., bike, SUV, sedan">
                <input id="type" className="input" value={form.type} onChange={update("type")} required />
              </Field>
              <Field label="Location" htmlFor="location">
                <input id="location" className="input" value={form.location} onChange={update("location")} required />
              </Field>
            </div>
          </section>

          {/* ===== Pricing & Status ===== */}
          <section className="form-card">
            <h2 className="form-card-title">Pricing & Status</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <Field label="Price per day (₹)" htmlFor="pricePerDay">
                <input id="pricePerDay" type="number" className="input" value={form.pricePerDay} onChange={update("pricePerDay")} required />
              </Field>
              <Field label="Status" htmlFor="status">
                {/* Read-only status (no dropdown) */}
                <input id="status" className="input" value="approved" readOnly />
              </Field>
            </div>
          </section>

          {/* ===== Description ===== */}
          <section className="form-card">
            <h2 className="form-card-title">Description</h2>
            <Field htmlFor="description">
              <textarea id="description" className="textarea min-h-[90px]" value={form.description} onChange={update("description")} />
            </Field>
          </section>

          {/* ===== Media ===== */}
          <section className="form-card">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <h2 className="form-card-title">Media</h2>
              {previewUrl ? (
                <a href={previewUrl} target="_blank" rel="noreferrer" className="link-soft">Open full image</a>
              ) : null}
            </div>

            {/* Preview */}
            <div className="img-preview-wrap">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="img-preview" onError={() => setPreviewUrl("")} />
              ) : (
                <div className="img-preview empty">First image URL preview</div>
              )}
            </div>

            <Field label="Images (one URL per line or comma separated)" htmlFor="imagesText">
              <textarea
                id="imagesText"
                name="imagesText"
                className="textarea min-h-[120px]"
                defaultValue={defaults.imagesText}
                ref={imagesRef}
                onInput={deriveFirstImage}
                onKeyDown={(e) => e.stopPropagation()}
                style={{ pointerEvents: "auto" }}
                placeholder={`https://.../img1.jpg
https://.../img2.jpg`}
              />
            </Field>
          </section>

          {/* ===== Specs ===== */}
          <section className="form-card">
            <h2 className="form-card-title">Specs (JSON)</h2>
            <Field htmlFor="specsText" help={`Example: {"color":"red","transmission":"manual"}`}>
              <textarea
                id="specsText"
                name="specsText"
                className="textarea font-mono min-h-[140px]"
                defaultValue={defaults.specsText}
                ref={specsRef}
                onKeyDown={(e) => e.stopPropagation()}
                style={{ pointerEvents: "auto" }}
                spellCheck={false}
              />
            </Field>
          </section>

          {/* ===== Actions (Sticky) ===== */}
          <div className="sticky-actions">
            <div className="sticky-actions-inner">
              <button
                type="submit"
                className="btn-primary"
                disabled={saving}
              >
                {saving ? "Saving…" : mode === "create" ? "Create" : "Save changes"}
              </button>
              <button
                type="button"
                className="btn-outline"
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}

function Field({ label, htmlFor, help, children }) {
  return (
    <div className="field">
      {label && (
        <label htmlFor={htmlFor} className="label">
          {label}
        </label>
      )}
      {children}
      {help && <div className="help">{help}</div>}
    </div>
  );
}
