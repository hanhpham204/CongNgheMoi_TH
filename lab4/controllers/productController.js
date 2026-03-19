const Product = require("../models/productModel");
const { v4: uuidv4 } = require("uuid");

// VIEW LIST + SEARCH
exports.index = async (req, res) => {
  let products = await Product.getAll();

  const keyword = req.query.keyword;
  if (keyword) {
    products = products.filter(p =>
      p.name.toLowerCase().includes(keyword.toLowerCase())
    );
  }

  res.render("products/index", { products });
};

// FORM CREATE
exports.showCreate = (req, res) => {
  res.render("products/create");
};

// CREATE
exports.create = async (req, res) => {
  const { name, price } = req.body;

  const product = {
    id: uuidv4(),
    name,
    price,
    url_image: req.file ? "/uploads/" + req.file.filename : "",
  };

  await Product.create(product);
  res.redirect("/products");
};

// FORM EDIT
exports.showEdit = async (req, res) => {
  const product = await Product.getById(req.params.id);
  res.render("products/edit", { product });
};

// UPDATE
exports.update = async (req, res) => {
  const { name, price } = req.body;

  const data = {
    name,
    price,
    url_image: req.file
      ? "/uploads/" + req.file.filename
      : req.body.old_image,
  };

  await Product.update(req.params.id, data);
  res.redirect("/products");
};

// DELETE
exports.delete = async (req, res) => {
  await Product.remove(req.params.id);
  res.redirect("/products");
};