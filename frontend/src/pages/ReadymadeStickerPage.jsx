import ProductCard from "../components/ProductCard";
//import { products } from "./ProductPage";

function ReadymadeStickerPage() {
  return (
    <>
      <div className="readymade-sticker-page">
        <h4>Discover more designs</h4>
        <div className="readymade-sticker-grid">
          {products.map((prod) => (
            <ProductCard key={prod.id} name={prod.name} image={prod.image} />
          ))}
        </div>
      </div>
    </>
  );
}

export default ReadymadeStickerPage;
