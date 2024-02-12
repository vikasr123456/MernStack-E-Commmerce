import mongoose from "mongoose";
import Product from "../models/product.js";
import products from "./data.js";

const seedProducts = async () => {
  try {
    mongoose.connect("mongodb://localhost:27017/shopit-v2");
    await Product.deleteMany()
    console.log("All Products are deleted");

    await Product.insertMany(products)
    console.log("The produts are added ");
    process.exit()

  } catch (error) {
    console.log(error.message);
    process.exit();
  }
};


seedProducts();
