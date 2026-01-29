const Product = require("../models/product.model");
const { v4: uuidv4 } = require("uuid");

exports.getAll = async (req, res) => {
  const products = await Product.getAll();
  res.render("products", { products });
};

exports.create = async (req, res) => {
  const { name, price, quantity } = req.body;
  // If you have image upload, add url_image here
  await Product.create({
    id: uuidv4(),
    name,
    price: Number(price),
    quantity: Number(quantity),
    url_image: req.file ? `/uploads/${req.file.filename}` : ""
  });
  res.redirect("/");
};
