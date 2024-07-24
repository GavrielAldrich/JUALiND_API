import { db } from "./db.js";
import expressMySqlSession from "express-mysql-session";
import session from "express-session";

const MySQLStore = expressMySqlSession(session);

const sessionStore = new MySQLStore(
  {
    expiration: 1000 * 600,
    endConnectionOnClose: false,
  },
  db
);
export default sessionStore