import Productslist from "./ProductsList";

function ProductSection() {
  return (
    <section className="product-section">
      <div className="product-section-header">
        <h2>Products</h2>
        <button type="button">View All</button>
      </div>

      <Productslist />
    </section>
  );
}

export default ProductSection;
