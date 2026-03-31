const express = require("express");
const multer = require("multer");
const roomController = require("../controllers/roomController");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", roomController.getRoomsPage);
router.get("/add", roomController.getAddRoomPage);
router.get("/:roomId/edit", roomController.getEditRoomPage);

router.post("/api", upload.single("image"), roomController.createRoom);
router.put("/api/:roomId", upload.single("image"), roomController.updateRoom);
router.delete("/api/:roomId", roomController.deleteRoom);

module.exports = router;
