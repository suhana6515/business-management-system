import ProductCard from "../components/ProductCard";
import FloralSticker from "../assets/stickers/FloralSticker.jpeg";

const products = [
  {
    id: 1,
    name: "Floral Sticker",
    price: "Rs.600",
    image: FloralSticker,
  },
  {
    id: 2,
    name: "Multi-Design Sticker",
    price: "Rs.600",
    image: FloralSticker,
  },
  {
    id: 3,
    name: "Heart Sticker",
    price: "Rs.600",
    image: FloralSticker,
  },
  {
    id: 4,
    name: "Floral Sticker",
    price: "Rs.600",
    image: FloralSticker,
  },
];

function ProductPage() {
  return (
    <div className="main-page">
      <h4>CRAFTED WITH GRATITUDE</h4>
      <h3>BROWSE STICKER CATEGORIES</h3>

      <div className="product-container">
        <h4>POPULAR STICKERS</h4>
        <div className="product-grid">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              name={product.name}
              price={product.price}
              image={product.image}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
