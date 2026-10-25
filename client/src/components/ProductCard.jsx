function ProductCard(props) {
  const imageUrl = props.product.image?.trim();

  return (
    <div className="product-card">
      {imageUrl ? <img src={imageUrl} alt={props.product.name} /> : null}
      <h3>{props.product.name}</h3>
      <p>NGN {props.product.price.toFixed(2)}</p>
    </div>
  );
}

export default ProductCard;
