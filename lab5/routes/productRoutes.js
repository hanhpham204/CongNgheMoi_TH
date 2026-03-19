const express = require("express");
const router = express.Router();
const controller = require("../controllers/productController");
const multer = require("multer");

const storage = multer.diskStorage({
  destination: "public/uploads",
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({ storage });

// VIEW
router.get("/", controller.index);
router.get("/create", controller.showCreate);
router.get("/edit/:id", controller.showEdit);

// CRUD
router.post("/", upload.single("image"), controller.create);
router.put("/:id", upload.single("image"), controller.update);
router.delete("/:id", controller.delete);

module.exports = router;