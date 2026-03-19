const express = require('express');
const app = express();
const productRoutes = require('./routes/productRoutes');
const PORT = process.env.PORT || 3000;
app.listen(PORT);

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));

app.use('/', productRoutes);

app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});