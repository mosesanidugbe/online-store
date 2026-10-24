import ProductCard from "./ProductCard";

function ProductsList() {
  const products = [
    { id: 1, name: "Product 1", price: 20000, image: "/images/product1.jpg" },
    { id: 2, name: "Product 2", price: 50000, image: "/images/product2.jpg" },
    { id: 3, name: "Product 3", price: 30000, image: "/images/product3.jpg" },
    { id: 4, name: "Product 4", price: 45000, image: "/images/product4.jpg" },
    { id: 5, name: "Product 5", price: 60000, image: "/images/product5.jpg" },
    { id: 6, name: "Product 6", price: 25000, image: "/images/product6.jpg" },
    { id: 7, name: "Product 7", price: 35000, image: "/images/product7.jpg" },
    { id: 8, name: "Product 8", price: 70000, image: "/images/product8.jpg" },
    { id: 9, name: "Product 9", price: 42000, image: "/images/product9.jpg" },
    {
      id: 10,
      name: "Product 10",
      price: 55000,
      image: "/images/product10.jpg",
    },
    {
      id: 11,
      name: "Product 11",
      price: 28000,
      image: "/images/product11.jpg",
    },
  ];

  return (
    <div className="products-list">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

export default ProductsList;
