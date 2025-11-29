// db.js
import mysql from "mysql2";

const pool = mysql.createPool({
  host: "localhost",
  user: "root",
  password: "Cdac@123",
  database: "RMS_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// quick test connection
pool.getConnection((err, conn) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
  } else {
    console.log("✅ Connected to MySQL (pool) - OK");
    conn.release();
  }
});

export default pool;
