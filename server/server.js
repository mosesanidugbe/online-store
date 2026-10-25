import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import accountRouter from "./routes/account.js";
import productsRouter from "./routes/products.js";
import storefrontRouter from "./routes/storefront.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRouter);
app.use("/account", accountRouter);
app.use("/products", productsRouter);
app.use("/storefront", storefrontRouter);

app.get("/", (req, res) => {
  res.json({ message: "Online Store API is running" });
});

export default app;
