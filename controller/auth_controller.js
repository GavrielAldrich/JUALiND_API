import bcrypt from "bcryptjs";
import { db } from "../utils/db.js";

export const userSession = (req, res) => {
  if (!req.session) {
    console.log("Session is not found");
    res.status(400).json({ message: "Session is not found" });
    return;
  }
  res.status(200).json(req.session);
};

export const userRegister = async (req, res) => {
  try {
    const { userEmail, userPassword, username, phone_number } = req.body;
    const lowerCasedUsername = username.toLowerCase();
    const lowerCasedEmail = userEmail.toLowerCase();
    const checkAvailEmail = await findUserData(lowerCasedEmail);

    if (checkAvailEmail) {
      res.status(400).json({
        message: "Email is already in use, please log in",
        isRegistered: false,
      });
      return;
    }
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(userPassword, salt);

    
    db.query(
      "INSERT INTO users (email, username, password, phone_number) VALUES (?, ?, ?, ?)",
      [lowerCasedEmail, lowerCasedUsername, hashedPassword, phone_number],
      (err, result) => {
        if (err) {
          console.log("There is error while registering to database");
          res.status(501).send("Internal Server Error");
          return;
        }
        res.status(200).send({
          message: "User Registered Successfully",
          successRegister: true,
        });
      }
    );
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const userLogin = async (req, res) => {
  try {
    const { userEmail, userPassword } = req.body;
    const lowerCasedEmail = userEmail.toLowerCase();
    const checkAvailEmail = await findUserData(lowerCasedEmail);
    if (!checkAvailEmail) {
      res.status(404).json({
        message: "User is not available / found, please Register",
        isLoggedIn: false,
      });
      return;
    }
    const storedHashedPassword = checkAvailEmail.password;
    bcrypt.compare(userPassword, storedHashedPassword, (err, result) => {
      if (err || !result) {
        console.log("Wrong password");
        res
          .status(400)
          .json({ message: "Wrong Password", authenticated: false });
        return;
      }

      req.session.user = {
        username: checkAvailEmail.username,
        email: checkAvailEmail.email,
        id: checkAvailEmail.id,
        phonenumber: checkAvailEmail.phone_number,
      };
      req.session.authenticated = true;
      res
        .status(200)
        .json({ message: "Correct Password", authenticated: result });
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

export const userLogout = (req, res) => {
  req.session.destroy(function (err) {
    if (err) {
      console.log("Error destroying session");
      res.status(400).json({ message: "Error destroying session" });
      return;
    }
    console.log("Session destroyed successfully");
    res.status(200).json({ message: "Logout successful" });
  });
};

function findUserData(email) {
  return new Promise((resolve, reject) => {
    db.query("SELECT * FROM users WHERE email = ?", [email], (err, result) => {
      if (err) {
        console.error("Error finding user data:", err);
        reject(err);
        return;
      }
      if (result.length > 0) {
        console.log("User data found.");
        resolve(result[0]);
      } else {
        console.log("User data not found.");
        resolve(null);
      }
    });
  });
}
