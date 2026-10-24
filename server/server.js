import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import accountRouter from "./routes/account.js";

dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

app.use("/auth", authRouter);
app.use("/account", accountRouter);

app.get("/", (req, res) => {
  res.json({ message: "Online Store API is running" });
});

export default app;
