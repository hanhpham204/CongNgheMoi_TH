const express = require("express");
const router = express.Router();
const controller = require("../controllers/product.controller");
const upload = require("../middlewares/upload.middleware");

router.get("/", controller.getAll);
router.post("/create", upload.single("image"), controller.create);

module.exports = router;
