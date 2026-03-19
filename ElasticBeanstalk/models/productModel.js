let products = [];

exports.getAll = () => products;

exports.getById = (id) => {
  return products.find(p => p.id == id);
};

exports.create = (product) => {
  products.push(product);
};

exports.update = (id, newData) => {
  const index = products.findIndex(p => p.id == id);
  if (index !== -1) {
    products[index] = { ...products[index], ...newData };
  }
};

exports.delete = (id) => {
  products = products.filter(p => p.id != id);
};