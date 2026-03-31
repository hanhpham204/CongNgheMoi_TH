const express = require("express")
const router = express.Router();
const multer = require('multer')
const upload = multer();

const controller = require('../controllers/ticketController');

router.get('/', controller.list)

router.get('/add', controller.showAdd)
router.post('/add', upload.single("image"), controller.add)

router.get('/edit/:id', controller.showEdit)
router.post('/edit/:id', upload.single("image"), controller.update)

router.get("/delete/:id", controller.delete);
router.get("/detail/:id", controller.detail);

module.exports = router
