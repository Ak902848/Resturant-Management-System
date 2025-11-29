import express from "express";
import db from "../db.js";

const router = express.Router();

/* ======================================
   GET ALL CATEGORIES
====================================== */
router.get("/", (req, res) => {
  const sql = "SELECT * FROM Category ORDER BY CategoryID ASC";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("❌ Error fetching categories:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(results);
  });
});

/* ======================================
   ADD NEW CATEGORY
====================================== */
router.post("/", (req, res) => {
  const { CategoryName } = req.body;

  if (!CategoryName || CategoryName.trim() === "") {
    return res.status(400).json({ message: "Category name is required" });
  }

  // Step 1: Check for duplicate category
  const checkSql = "SELECT * FROM Category WHERE CategoryName = ?";
  db.query(checkSql, [CategoryName], (err, rows) => {
    if (err) {
      console.error("❌ Error checking category:", err);
      return res.status(500).json({ message: "Database error" });
    }

    if (rows.length > 0) {
      return res.status(400).json({ message: "Category already exists" });
    }

    // Step 2: Insert new category
    const insertSql = "INSERT INTO Category (CategoryName) VALUES (?)";
    db.query(insertSql, [CategoryName], (err, result) => {
      if (err) {
        console.error("❌ Error inserting category:", err);
        return res.status(500).json({ message: "Insert failed" });
      }

      return res.status(201).json({
        message: "Category added successfully",
        id: result.insertId,
        CategoryName,
      });
    });
  });
});

export default router;
