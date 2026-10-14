import prisma from "../prisma/lib/prisma.js";

const getProductSize = async (_req, res) => {
  try {
    const productSize = await prisma.Product_Size.findMany();
    res.status(200).json(productSize);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    res.status(500).json({ error: "Failed to fetch products" });
  }
};

export default getProductSize;
