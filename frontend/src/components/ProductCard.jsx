import ProductModal from "../components/ProductModal";

function ProductCard({ image, name, price, openModal, setOpenModal }) {
  return (
    <>
      <div className="product-card">
        <img src={image} alt="Floral Sticker" />
        <h4>{name}</h4>
        <p className="price">{price}</p>
        <button className="add-to-cart-button">Add to Cart</button>
        <ProductModal openModal={openModal} setOpenModal={setOpenModal} />
      </div>
    </>
  );
}
export default ProductCard;
