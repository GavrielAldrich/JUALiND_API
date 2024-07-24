import { selectedGames } from "../controller/games_controller.js";
import express from "express";

var router = express.Router();

router.get("/games/:selectedGame", selectedGames);

export default router;