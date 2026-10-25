import { useCallback, useContext, useEffect, useState } from "react";
import API_URL from "../api.js";
import AuthContext from "../context/AuthContext.jsx";

const initialForm = { name: "", description: "", price: "", image_url: "", category: "", stock_quantity: "0", is_placeholder: true, is_active: true };

function ProductsManager() {
  const { token } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const request = useCallback(async (path, options = {}) => {
    const response = await fetch(`${API_URL}${path}`, { ...options, headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...options.headers } });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(data.message || "Request failed");
    return data;
  }, [token]);

  const loadProducts = useCallback(async () => {
    try {
      const data = await request("/manage/products");
      setProducts(data.products ?? []);
    } catch (error) {
      setMessage(error.message);
    } finally {
      setLoading(false);
    }
  }, [request]);

  useEffect(() => {
    let ignore = false;

    async function fetchProducts() {
      try {
        const data = await request("/manage/products");
        if (!ignore) setProducts(data.products ?? []);
      } catch (error) {
        if (!ignore) setMessage(error.message);
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [request]);

  function update(key, value) { setForm((current) => ({ ...current, [key]: value })); }

  async function updateProduct(product, patch) {
    setMessage("");
    try {
      await request(`/manage/products/${product.id}`, { method: "PATCH", body: JSON.stringify(patch) });
      await loadProducts();
      setMessage("Product updated.");
    } catch (error) {
      setMessage(error.message);
    }
  }

  async function createProduct(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await request("/manage/products", { method: "POST", body: JSON.stringify({ ...form, price: Number(form.price), stock_quantity: Number(form.stock_quantity) }) });
      setForm(initialForm);
      await loadProducts();
      setMessage("Product created.");
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="owner-dashboard product-manager">
      <h1>Products</h1>
      <p>Create test products or real catalogue entries for the store.</p>
      {message ? <p role="status" className="owner-message">{message}</p> : null}
      <section className="owner-panel">
        <h2>Add a product</h2>
        <form className="owner-section-form" onSubmit={createProduct}>
          <label>Product name<input required maxLength={150} value={form.name} onChange={(event) => update("name", event.target.value)} /></label>
          <label>Description<textarea rows={3} maxLength={5000} value={form.description} onChange={(event) => update("description", event.target.value)} /></label>
          <label>Price<input required type="number" min="0" step="0.01" value={form.price} onChange={(event) => update("price", event.target.value)} /></label>
          <label>Image URL<input value={form.image_url} onChange={(event) => update("image_url", event.target.value)} placeholder="https://… or /images/product.jpg" /></label>
          <label>Category<input maxLength={100} value={form.category} onChange={(event) => update("category", event.target.value)} /></label>
          <label>Stock quantity<input required type="number" min="0" step="1" value={form.stock_quantity} onChange={(event) => update("stock_quantity", event.target.value)} /></label>
          <label className="product-manager-check"><input type="checkbox" checked={form.is_placeholder} onChange={(event) => update("is_placeholder", event.target.checked)} /> Test/placeholder product</label>
          <label className="product-manager-check"><input type="checkbox" checked={form.is_active} onChange={(event) => update("is_active", event.target.checked)} /> Active</label>
          <div className="owner-form-actions"><button type="submit" disabled={saving}>{saving ? "Saving…" : "Create product"}</button></div>
        </form>
      </section>
      <section className="owner-section-list">
        <h2>Saved products</h2>
        {loading ? <p>Loading products…</p> : null}
        {!loading && products.length === 0 ? <p>No products yet. Add a test product above to get started.</p> : null}
        {products.map((product) => (
          <article className="owner-section-card" key={product.id}>
            <div className="owner-section-card-main">
              <div><h3>{product.name}</h3><p>{product.category || "Uncategorised"} · {Number(product.price).toFixed(2)}</p><p>{product.is_placeholder ? "Test product" : "Real product"} · {product.is_active ? "Active" : "Inactive"} · Stock: {product.stock_quantity}</p></div>
              <div className="owner-section-actions">
                <button type="button" className="secondary" onClick={() => updateProduct(product, { is_placeholder: !product.is_placeholder })}>{product.is_placeholder ? "Mark as real" : "Mark as test"}</button>
                <button type="button" className="secondary" onClick={() => updateProduct(product, { is_active: !product.is_active })}>{product.is_active ? "Deactivate" : "Activate"}</button>
                {product.image_url ? <img className="product-manager-image" src={product.image_url} alt={product.name} loading="lazy" /> : null}
              </div>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

export default ProductsManager;
