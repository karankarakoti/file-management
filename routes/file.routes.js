const express = require("express");
const fileController = require("../controller/file.controller");
const { isAuthenticatedUser } = require("../middleware/auth");
const { upload } = require("../utils/file-management");

const router = express.Router();

router.route("/")
  .post(isAuthenticatedUser, upload.single("file"), fileController.create)
  .get(isAuthenticatedUser, fileController.getAll);
  
router.route("/share")
  .post(isAuthenticatedUser, fileController.shareFile);
  
router.route("/:id")
  .get(isAuthenticatedUser, fileController.get)

module.exports = router;