import { db } from "../utils/db.js";
const sellerProduct = (req, res) => {
  const { game, seller, id } = req.params;
  try {
    db.query(
      "SELECT * FROM game_items WHERE game_name = ? AND seller_username = ? AND id = ?",
      [game, seller, id],
      (err, result) => {
        if (err) {
          console.error("Error finding game:", err);
          return res.status(500).send("Internal Server Error");
        }
        res.status(200).send({
          message: "Product found.",
          data: result,
        });
      }
    );
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export default sellerProduct;
