const express = require('express');
const router = express.Router();
const controller = require('../controllers/productController');

router.get('/', controller.index);
router.get('/create', controller.createForm);
router.post('/create', controller.create);
router.get('/delete/:id', controller.delete);
router.get('/edit/:id', controller.editForm);
router.post('/edit/:id', controller.update);

module.exports = router;