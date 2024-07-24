import express from "express";
import sellerProduct from "../controller/product_controller.js";

var router = express.Router();

router.get("/product/:game/:seller/:id", sellerProduct);

export default router;
