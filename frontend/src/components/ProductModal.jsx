import { useState, useEffect } from "react";
import { MdClose } from "react-icons/md";
import axios from "axios";
import { API_URL } from "../api";
//import getProductSize from "../../../backend/controller/productSizeController";

function ProductModal() {
  /*const sizeOptions = [
    {
      id: 1,
      size: "1 inch",
      price: 350,
    },
    {
      id: 2,
      size: "1.5 inch",
      price: 600,
    },
    {
      id: 3,
      size: "1*3 inch",
      price: 500,
    },
    {
      id: 4,
      size: "4*1.5 inch",
      price: 500,
    },
  ];*/

  const [productSizes, setProductSizes] = useState([]);
  const [selectedSizeId, setSelectedSizeId] = useState(null);
  const [openModal, setOpenModal] = useState(false);

  //const [size, setSize] = useState();

  const [quantity, setQuantity] = useState(1);
  const minimumQuantity = 1;
  const maximumQuantity = 20;

  function handleOpenModal() {
    setOpenModal(true);
  }

  const handleSizeChange = (event) => {
    setSelectedSizeId(Number(event.target.value));
  };

  const handleQuantityLimit = (event) => {
    const value = event.target.value;

    if (value === "") {
      setQuantity("");
      return;
    }

    const number = Number(value);

    if (number < minimumQuantity) {
      setQuantity(minimumQuantity);
      return;
    }

    if (number > maximumQuantity) {
      setQuantity(maximumQuantity);
      return;
    }

    setQuantity(number);
  };

  const selectedSize = productSizes.find(
    (option) => option.product_size_id === selectedSizeId,
  );
  const totalPrice = selectedSize
    ? Number(selectedSize.size_price) * quantity
    : 0;

  useEffect(() => {
    async function fetchProductSize() {
      try {
        const response = await axios.get(`${API_URL}/productsize`);
        console.log("Product Sizes:", response);
        setProductSizes(response.data);
      } catch (error) {
        console.error(error);
      }
    }
    fetchProductSize();
  }, []);

  return (
    <>
      <button className="open-modal-button" onClick={handleOpenModal}>
        Add to Cart
      </button>
      {openModal ? (
        <>
          <div className="modal">
            <MdClose
              className="close-icon"
              onClick={() => setOpenModal(false)}
            />
            <h4>Select a size</h4>
            {productSizes.map((option) => (
              <div className="size-option" key={option.product_size_id}>
                <input
                  type="radio"
                  name="size"
                  id={`size-${option.product_size_id}`}
                  value={option.product_size_id}
                  checked={selectedSizeId === option.product_size_id}
                  onChange={handleSizeChange}
                />
                <label htmlFor={`size-${option.product_size_id}`}>
                  {option.size_name}
                </label>
              </div>
            ))}

            <h4>Select a quantity</h4>
            <div className="quantity-editor">
              <input
                className="quantity-input"
                type="number"
                min={minimumQuantity}
                max={maximumQuantity}
                value={quantity}
                placeholder="Enter a quantity"
                onChange={handleQuantityLimit}
              ></input>
            </div>
            <div className="total-price">Estimated Price:{totalPrice}</div>

            <button className="close-modal-button">Purchase</button>
          </div>
        </>
      ) : null}
    </>
  );
}
export default ProductModal;
