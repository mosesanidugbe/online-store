function ProductCard(props) {
  return (
    <div className="product-card">
      <img src={props.product.image} alt={props.product.name} />
      <h3>{props.product.name}</h3>
      <p>NGN {props.product.price.toFixed(2)}</p>
    </div>
  );
}

export default ProductCard;
