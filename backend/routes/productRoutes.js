import express from "express";
import getProduct from "../controller/productController.js";
import getProductSize from "../controller/productSizeController.js";

const router = express.Router();

router.get("/api/products", getProduct);
router.get("/api/productSize", getProductSize);

export default router;
