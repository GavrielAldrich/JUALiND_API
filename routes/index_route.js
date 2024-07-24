import express from "express";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

var router = express.Router();
const __dirname = dirname(fileURLToPath(import.meta.url));
const indexPath = path.join(__dirname, "../", "public", "index.html");

router.get("/", (req, res, next) => {
  res.sendFile(indexPath);
});

export default router;