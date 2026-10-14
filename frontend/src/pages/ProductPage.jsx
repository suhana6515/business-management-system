import ProductCard from "../components/ProductCard";
import axios from "axios";
import { useState, useEffect } from "react";
import { API_URL } from "../api";

/*export const products = [
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
];*/

function ProductPage() {
  const [product, setProduct] = useState([]);

  useEffect(() => {
    async function fetchProduct(_req, res) {
      try {
        const response = await axios.get(`${API_URL}/products`);
        const data = response.data;
        setProduct(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
        res.status(500).json({ error: "Failed to fetch products" });
      }
    }
    fetchProduct();
  }, []);

  return (
    <div className="main-page">
      <h4>CRAFTED WITH GRATITUDE</h4>
      <h3>BROWSE STICKER CATEGORIES</h3>

      <div className="product-container">
        <h4>POPULAR STICKERS</h4>
        <div className="product-grid">
          {product.map((prod) => (
            <ProductCard
              key={prod.product_id}
              image={prod.image_url}
              name={prod.product_name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default ProductPage;
