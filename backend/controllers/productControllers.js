import catchAsycError from "../middleware/catchAsycError.js";
import Product from "../models/product.js";
import ApiFilters from "../utils/apiFilters.js";
import ErrorHandeler from "../utils/errorhandler.js";

// Create new Product   =>  /api/v1/products
export const getProducts = catchAsycError(async (req, res) => {
  const resPerPage = 4;
  const apiFileter = new ApiFilters(Product, req.query).search().filters();
  let products = await apiFileter.query;
  
  apiFileter.pagination(resPerPage);
  products = await apiFileter.query.clone();
  
  let filteredproductCount = products.length;
  res.status(200).json({
    resPerPage,
    filteredproductCount,
    products,
  });
});

// Create new Product   =>  /api/v1/admin/products
export const newProduct = catchAsycError(async (req, res) => {

  req.body.user = req.user._id
  const product = await Product.create(req.body);

  res.status(200).json({
    product,
  });
});

// Get single product details   =>  /api/v1/products/:id
export const getProductDetails = catchAsycError(async (req, res, next) => {
  const product = await Product.findById(req?.params?.id);

  if (!product) {
    return next(new ErrorHandeler("Product Not Found", 404));
  }

  res.status(200).json({
    product,
  });
});

// Update product details   =>  /api/v1/products/:id
export const updateProduct = catchAsycError(async (req, res,next) => {
  let product = await Product.findById(req?.params?.id);

  if (!product) {
    return next(new ErrorHandeler("Product Not Found", 404));
  }

  product = await Product.findByIdAndUpdate(req?.params?.id, req.body, {
    new: true,
  });

  res.status(200).json({
    product,
  });
});

// Delete product   =>  /api/v1/products/:id
export const deleteProduct = catchAsycError(async (req, res) => {
  const product = await Product.findById(req?.params?.id);

  if (!product) {
    return next(new ErrorHandeler("Product Not Found", 404));
  }

  await product.deleteOne();

  res.status(200).json({
    message: "Product Deleted",
  });
});
