import ProductModal from "../components/ProductModal";

function ProductCard({ image, name, openModal, setOpenModal }) {
  return (
    <>
      <div className="product-card">
        <img src={image} alt="Floral Stickers" />
        <h4>{name}</h4>
        <ProductModal openModal={openModal} setOpenModal={setOpenModal} />
      </div>
    </>
  );
}
export default ProductCard;
