import { useCallback, useContext, useEffect, useState } from "react";
import API_URL from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

const emptyForm = {
  type: "hero_banner",
  title: "Hero banner",
  heading: "",
  description: "",
  image_url: "",
  cta_label: "",
  cta_href: "",
  limit: "8",
  product_ids: "",
};

function settingsFromForm(form) {
  if (form.type === "hero_banner") {
    return Object.fromEntries(
      ["heading", "description", "image_url", "cta_label", "cta_href"]
        .filter((key) => form[key].trim())
        .map((key) => [key, form[key].trim()]),
    );
  }

  const settings = {};
  if (form.heading.trim()) settings.heading = form.heading.trim();
  if (form.description.trim()) settings.description = form.description.trim();
  const limit = Number(form.limit);
  if (Number.isInteger(limit) && limit >= 1 && limit <= 12) settings.limit = limit;
  if (form.product_ids.trim()) {
    settings.product_ids = form.product_ids.split(",").map((id) => Number(id.trim()));
  }
  return settings;
}

function formFromSection(section) {
  const settings = section.settings ?? {};
  return {
    type: section.type,
    title: section.title,
    heading: settings.heading ?? "",
    description: settings.description ?? "",
    image_url: settings.image_url ?? "",
    cta_label: settings.cta_label ?? "",
    cta_href: settings.cta_href ?? "",
    limit: String(settings.limit ?? settings.max_products ?? 8),
    product_ids: Array.isArray(settings.product_ids) ? settings.product_ids.join(", ") : "",
  };
}

function OwnerDashboard() {
  const { token } = useContext(AuthContext);
  const [sections, setSections] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
        ...options.headers,
      },
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }, [token]);

  const loadSections = useCallback(async () => {
    try {
      const data = await request("/storefront/manage/sections");
      setSections(data.sections ?? []);
      setStatus("ready");
    } catch (error) {
      setMessage(error.message);
      setStatus("error");
    }
  }, [request]);

  useEffect(() => {
    loadSections();
  }, [loadSections]);

  function updateForm(key, value) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function startEdit(section) {
    setEditingId(section.id);
    setForm(formFromSection(section));
    setMessage("");
  }

  function cancelEdit() {
    setEditingId(null);
    setForm(emptyForm);
  }

  async function saveSection(event) {
    event.preventDefault();
    setMessage("");
    const payload = {
      type: form.type,
      title: form.title.trim(),
      settings: settingsFromForm(form),
      is_visible: true,
      display_order: sections.length,
    };
    try {
      if (editingId !== null) {
        await request(`/storefront/sections/${editingId}`, {
          method: "PATCH",
          body: JSON.stringify({
            title: payload.title,
            settings: payload.settings,
          }),
        });
        setMessage("Section saved.");
      } else {
        await request("/storefront/sections", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setMessage("Section added.");
      }
      cancelEdit();
      await loadSections();
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function patchSection(section, patch) {
    setMessage("");
    try {
      await request(`/storefront/sections/${section.id}`, {
        method: "PATCH",
        body: JSON.stringify(patch),
      });
      await loadSections();
      setMessage("Section updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function moveSection(index, direction) {
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sections.length) return;
    const current = sections[index];
    const neighbour = sections[nextIndex];
    setMessage("");
    try {
      await Promise.all([
        request(`/storefront/sections/${current.id}`, {
          method: "PATCH",
          body: JSON.stringify({ display_order: neighbour.display_order }),
        }),
        request(`/storefront/sections/${neighbour.id}`, {
          method: "PATCH",
          body: JSON.stringify({ display_order: current.display_order }),
        }),
      ]);
      await loadSections();
      setMessage("Section order updated.");
    } catch (error) {
      setMessage(error.message);
      await loadSections();
    }
  }

  return (
    <div className="owner-dashboard">
      <h1>Storefront sections</h1>
      <p>Choose which supported sections appear on your homepage and arrange their order.</p>
      {message ? <p role="status" className="owner-message">{message}</p> : null}

      <section className="owner-panel">
        <h2>{editingId === null ? "Add a section" : "Edit section"}</h2>
        <form className="owner-section-form" onSubmit={saveSection}>
          <label>
            Section type
            <select value={form.type} disabled={editingId !== null} onChange={(event) => {
              const type = event.target.value;
              setForm({ ...emptyForm, type, title: type === "hero_banner" ? "Hero banner" : "Featured products" });
            }}>
              <option value="hero_banner">Hero banner</option>
              <option value="featured_products">Featured products</option>
            </select>
          </label>
          <label>
            Section title
            <input required maxLength={150} value={form.title} onChange={(event) => updateForm("title", event.target.value)} />
          </label>
          <label>
            Heading
            <input maxLength={500} value={form.heading} onChange={(event) => updateForm("heading", event.target.value)} />
          </label>
          <label>
            Description
            <textarea maxLength={2000} rows={3} value={form.description} onChange={(event) => updateForm("description", event.target.value)} />
          </label>
          {form.type === "hero_banner" ? (
            <>
              <label>
                Background image URL (optional)
                <input value={form.image_url} onChange={(event) => updateForm("image_url", event.target.value)} placeholder="/images/banner.jpg or https://…" />
              </label>
              <label>
                Button label (optional)
                <input maxLength={500} value={form.cta_label} onChange={(event) => updateForm("cta_label", event.target.value)} />
              </label>
              <label>
                Button link (optional)
                <input maxLength={500} value={form.cta_href} onChange={(event) => updateForm("cta_href", event.target.value)} placeholder="/products" />
              </label>
            </>
          ) : (
            <>
              <label>
                Maximum products (1–12)
                <input type="number" min="1" max="12" value={form.limit} onChange={(event) => updateForm("limit", event.target.value)} />
              </label>
              <label>
                Product IDs (optional, comma-separated)
                <input value={form.product_ids} onChange={(event) => updateForm("product_ids", event.target.value)} placeholder="Leave blank to show available products" />
              </label>
            </>
          )}
          <div className="owner-form-actions">
            <button type="submit">{editingId === null ? "Add section" : "Save changes"}</button>
            {editingId !== null ? <button type="button" className="secondary" onClick={cancelEdit}>Cancel</button> : null}
          </div>
        </form>
      </section>

      <section className="owner-section-list">
        <h2>Homepage order</h2>
        {status === "loading" ? <p>Loading sections…</p> : null}
        {status === "error" ? <p role="alert">Could not load sections. {message}</p> : null}
        {status === "ready" && sections.length === 0 ? <p>No sections yet. Add a hero banner or featured products section above.</p> : null}
        {sections.map((section, index) => (
          <article className="owner-section-card" key={section.id}>
            <div className="owner-section-card-main">
              <div>
                <h3>{section.title}</h3>
                <p>{section.type === "hero_banner" ? "Hero banner" : "Featured products"} · Order {section.display_order + 1}</p>
                <p>{section.is_visible ? "Visible on storefront" : "Hidden from storefront"}</p>
              </div>
              <div className="owner-section-actions">
                <button type="button" onClick={() => moveSection(index, -1)} disabled={index === 0} aria-label={`Move ${section.title} up`}>↑</button>
                <button type="button" onClick={() => moveSection(index, 1)} disabled={index === sections.length - 1} aria-label={`Move ${section.title} down`}>↓</button>
                <button type="button" className="secondary" onClick={() => startEdit(section)}>Edit</button>
                <button type="button" className="secondary" onClick={() => patchSection(section, { is_visible: !section.is_visible })}>
                  {section.is_visible ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default OwnerDashboard;
