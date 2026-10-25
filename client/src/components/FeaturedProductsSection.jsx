import { useEffect, useState } from "react";
import API_URL from "../api";
import ProductCard from "./ProductCard";

const MAX_PRODUCTS = 12;

function FeaturedProductsSection({ section }) {
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const settings = section.settings ?? {};
  const requestedLimit = Number(settings.limit ?? settings.max_products ?? 8);
  const limit = Number.isFinite(requestedLimit)
    ? Math.min(MAX_PRODUCTS, Math.max(1, Math.floor(requestedLimit)))
    : 8;
  const productIds = settings.product_ids;

  useEffect(() => {
    const controller = new AbortController();

    async function loadProducts() {
      try {
        const response = await fetch(`${API_URL}/products`, {
          signal: controller.signal,
        });
        if (!response.ok) {
          throw new Error("Failed to load products");
        }

        const data = await response.json();
        const availableProducts = Array.isArray(data.products)
          ? data.products
          : [];
        const selectedIds = Array.isArray(productIds)
          ? productIds.map(Number).filter(Number.isFinite)
          : [];
        const selectedProducts = selectedIds.length
          ? availableProducts.filter((product) =>
              selectedIds.includes(Number(product.id)),
            )
          : availableProducts;

        setProducts(selectedProducts.slice(0, limit));
        setStatus("success");
      } catch (error) {
        if (error.name !== "AbortError") {
          setStatus("error");
        }
      }
    }

    loadProducts();
    return () => controller.abort();
  }, [limit, productIds]);

  return (
    <section className="product-section">
      <div className="product-section-header">
        <div>
          <h2>{settings.heading || section.title}</h2>
          {settings.description ? <p>{settings.description}</p> : null}
        </div>
      </div>

      {status === "loading" ? <p role="status">Loading products…</p> : null}
      {status === "error" ? (
        <p role="alert">Products are temporarily unavailable.</p>
      ) : null}
      {status === "success" && products.length === 0 ? (
        <p>No featured products are available yet.</p>
      ) : null}
      {status === "success" && products.length > 0 ? (
        <div className="products-list">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={{
                ...product,
                image: product.image_url || "",
                price: Number(product.price),
              }}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default FeaturedProductsSection;
