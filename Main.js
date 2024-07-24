import express from "express";
import session from "express-session";
import bodyParser from "body-parser";
import cors from "cors";
import multer from "multer";
import { db } from "./utils/db.js";
import limiter from "./utils/limiter.js";
import sessionStore from "./utils/store.js";
import auth from "./routes/auth_route.js";
import gameRouter from "./routes/games_route.js";
import indexRouter from "./routes/index_route.js";
import productRouter from "./routes/product_route.js";
import path, { dirname } from "path";
import { fileURLToPath } from "url";
import { emitWarning } from "process";

const app = express();
const __dirname = dirname(fileURLToPath(import.meta.url));

const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, "/public/files/"));
    },
    filename: (req, file, cb) => {
      cb(null, Date.now() + file.originalname);
    },
  }),
});

// Enable CORS
app.use(
  cors({
    origin: "http://localhost:3000", // Adjust this to match your React app's URL
    credentials: true, // Allow cookies to be sent back and forth
  })
);

app.use(
  session({
    secret: "TOPSECRETWORD",
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 600, // 10 minutes
    },
  })
);

app.use(express.static(path.join(__dirname, "public")));
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

// AS BUYER VIEW ROUTE
// Index router
app.use("/", indexRouter);

// Route to Login, Register, Logout, Session as seller & buyer
app.use("/api", auth);

// Route to find selected game as buyer
app.use("/api", gameRouter);

// Route to find selected product as buyer
app.use("/api", productRouter);

// Route to make an order as buyer
app.post("/api/makeorder", (req, res) => {
  const {
    seller_username,
    seller_email,
    buyer_email,
    item_title,
    game_name,
    item_quantity,
    item_price,
    buyer_note,
  } = req.body;

  const query =
    "INSERT INTO orders (seller_username, seller_email, buyer_email,item_title, game_name, item_quantity, item_price, buyer_note) VALUES (?, ?, ?, ?, ?, ?,?,?)";
  db.query(
    query,
    [
      seller_username,
      seller_email,
      buyer_email,
      item_title,
      game_name,
      item_quantity,
      item_price,
      buyer_note,
    ],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send({ message: "Error placing order" });
      } else {
        res.status(201).send({ message: "Order placed successfully!" });
      }
    }
  );
});

// AS SELLER VIEW ROUTE
// Route to find all of the seller product
app.get("/api/sellerproducts/:sellerusername", (req, res) => {
  const { sellerusername } = req.params;
  const query = "SELECT * FROM game_items WHERE seller_username = ?";
  db.query(query, [sellerusername], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    res
      .status(200)
      .send({ message: "Success retrieving seller data", data: result });
  });
});

// Route to find all of the seller orders
app.get("/api/sellerorders/:sellerusername", (req, res) => {
  const { sellerusername } = req.params;
  const query = "SELECT * FROM orders WHERE seller_username = ?";
  db.query(query, [sellerusername], (err, result) => {
    if (err) {
      console.log(err);
      res.status(500).send("Internal Server Error");
    }
    res
      .status(200)
      .send({ message: "Success retrieving seller data", data: result });
  });
});

// Route to make an item/product as seller
app.post("/api/sellItem", upload.single("item_image"), (req, res) => {
  const {
    game_name,
    seller_username,
    seller_email,
    seller_phonenumber,
    item_price,
    item_title,
    item_description,
    item_stock,
  } = req.body;

  // Check if file is uploaded
  if (!req.file) {
    return res.status(400).send("No file uploaded");
  }

  const file = req.file.filename; // Use filename here, not originalname

  db.query(
    "INSERT INTO game_items (game_name, seller_email, seller_username, seller_phonenumber, item_price, item_title, item_description, item_image, item_stock) VALUES (?, ?, ?, ?, ?, ?, ?, ?,?)",
    [
      game_name,
      seller_email,
      seller_username,
      seller_phonenumber,
      item_price,
      item_title,
      item_description,
      file,
      item_stock,
    ],
    (err, result) => {
      if (err) {
        console.log("Error while inserting item to database", err);
        return res.status(400).send("Error while inserting item to database");
      }
      res.status(200).send("Success adding new items!");
    }
  );
});

// Route to get sellected product by user (to edit)
app.get("/api/getsellerproduct/:sellerusername/:productid", (req, res) => {
  const { sellerusername, productid } = req.params;
  const query = "SELECT * FROM game_items WHERE seller_username = ? AND id = ?";
  db.query(query, [sellerusername, productid], (err, rows) => {
    if (err) {
      console.error(err); // Log the error
      return res.status(500).send({ message: "Internal Server Error" });
    }
    return res.status(200).send({ data: rows });
  });
});

// Route to edit product as seller
app.post(
  "/api/editproduct/:productid",
  upload.single("item_image"),
  async (req, res) => {
    const { productid } = req.params;
    const {
      game_name,
      seller_email,
      item_price,
      item_title,
      item_description,
      item_stock,
    } = req.body;

    const file = req.file;
    const item_image = file.filename;

    const query =
      "UPDATE game_items SET game_name = ?, seller_email = ?, item_price = ?, item_title = ?, item_description = ?, item_stock = ?, item_image = ? WHERE id = ?";
    db.query(
      query,
      [
        game_name,
        seller_email,
        item_price,
        item_title,
        item_description,
        item_stock,
        item_image,
        productid,
      ],
      (err, result) => {
        if (err) {
          console.log("Error updating product:", err);
          res.status(500).send("Error updating product");
        } else {
          res.status(200).send("Product updated successfully!");
        }
      }
    );
  }
);

// Route to remove seller selected product
app.delete("/api/removeproduct/:boothusername/:itemid", (req, res) => {
  const { boothusername, itemid } = req.params;
  // Perform deletion logic here (e.g., delete from database)
  const query = "DELETE FROM game_items WHERE seller_username = ? AND id = ?";
  db.query(query, [boothusername, itemid], (err, result) => {
    if (err) {
      console.log("Error deleting product:", err);
      return res.status(500).send("Error deleting product");
    }
    res.status(200).send(`Deleted product with id ${itemid}`);
  });
});

// Route to remove seller selected order
app.delete("/api/removeorder/:boothusername/:itemid", (req, res) => {
  const { boothusername, itemid } = req.params;
  // Perform deletion logic here (e.g., delete from database)
  const query = "DELETE FROM orders WHERE seller_username = ? AND id = ?";
  db.query(query, [boothusername, itemid], (err, result) => {
    if (err) {
      console.log("Error deleting product:", err);
      return res.status(500).send("Error deleting product");
    }
    res.status(200).send(`Deleted product with id ${itemid}`);
  });
});

// Serve the index.html file for any other routes to support client-side routing
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
