import express from "express";
const app = express();
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { connectDatabase } from "./config/dbConnect.js";
import errorHandeler from "./middleware/errors.js";

// Handeling Uncaught Exception
process.on("uncaughtException", (err) => {
  console.log(`Error: ${err}`);
  console.log("Shutting Down the Server Due to UnCaught Exception");
  process.exit(1);
});

dotenv.config({ path: "backend/config/config.env" });

// Connecting to database
connectDatabase();

app.use(express.json());
app.use(cookieParser())

// Import all routes
import productRoutes from "./routes/products.js";
import authRoutes from "./routes/auth.js";
import orderRoutes from "./routes/order.js";

app.use("/api/v1", productRoutes);
app.use("/api/v1", authRoutes);
app.use("/api/v1", orderRoutes);

app.use(errorHandeler);

const server = app.listen(process.env.PORT, () => {
  console.log(
    `Server started on PORT: ${process.env.PORT} in ${process.env.NODE_ENV} mode.`
  );
});

//heandeling promise rejection
process.on("unhandledRejection", (err) => {
  console.log(`Error: ${err}`);
  console.log("Shutting Down the Server due to Unhandeled Promise Rejection");
  server.close(() => {
    process.exit(1);
  });
});
