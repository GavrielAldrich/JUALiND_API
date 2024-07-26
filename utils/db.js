import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const pool = mysql.createPool({
  connectionLimit: 10, // Adjust this as needed
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD || '', // Use empty string if no password
  database: process.env.DB_NAME,
});

pool.getConnection()
  .then(connection => {
    console.log('Connected to database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to database:', err);
  });

export { pool as db };
