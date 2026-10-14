import express from "express";
import productRoutes from "./routes/productRoutes.js";
import cors from "cors";
const app = express();
app.use(cors());
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({ status: "ok" });
});

app.use(productRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
