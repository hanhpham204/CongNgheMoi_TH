const Product = require('../models/productModel');

exports.index = (req, res) => {
  res.render('products/index', { products: Product.getAll() });
};

exports.createForm = (req, res) => {
  res.render('products/create');
};

exports.create = (req, res) => {
  const { name, price } = req.body;
  Product.create({ id: Date.now(), name, price });
  res.redirect('/');
};

exports.delete = (req, res) => {
  Product.delete(req.params.id);
  res.redirect('/');
};

// Hiển thị form edit
exports.editForm = (req, res) => {
  const product = Product.getById(req.params.id);
  res.render('products/edit', { product });
};

// Xử lý update
exports.update = (req, res) => {
  const { name, price } = req.body;
  Product.update(req.params.id, { name, price });
  res.redirect('/');
};