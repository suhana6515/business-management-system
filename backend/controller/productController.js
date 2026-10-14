import prisma from "../prisma/lib/prisma.js";

const getProduct = async (_req, res) => {
  try {
    const products = await prisma.Product.findMany();
    res.status(200).json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export default getProduct;
