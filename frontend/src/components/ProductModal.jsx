import { useState } from "react";

function ProductModal() {
  const [openModal, setOpenModal] = useState(false);

  function handleOpenModal() {
    setOpenModal(true);
  }
  return (
    <>
      <button className="open-modal-button" onClick={handleOpenModal}>
        View Details
      </button>
      {openModal ? (
        <>
          <div className="modal">
            <p> ☆ Size: 1 inch diameter </p>
            <p>☆ 500 pcs/roll </p>
            <p>☆ Price: Rs. 350</p>
            <button
              className="close-modal-button"
              onClick={() => setOpenModal(false)}
            >
              Close
            </button>
          </div>
        </>
      ) : null}
    </>
  );
}
export default ProductModal;
