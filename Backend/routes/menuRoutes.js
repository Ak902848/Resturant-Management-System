import express from "express";
import db from "../db.js";

const router = express.Router();

// GET ALL MENU ITEMS (Optional filter by categoryId)
router.get("/", (req, res) => {
  const { categoryId } = req.query;

  // Base Query
  let sql = `
    SELECT 
      m.MenuItemID, 
      m.Name, 
      m.Description, 
      m.Price,
      m.CategoryID, 
      c.CategoryName
    FROM Menu m
    LEFT JOIN Category c ON m.CategoryID = c.CategoryID
    WHERE 1=1
  `;

  const params = [];

  // Filter if categoryId is provided
  if (categoryId) {
    sql += " AND m.CategoryID = ? ";
    params.push(categoryId);
  }

  sql += " ORDER BY m.MenuItemID";

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("❌ Error fetching menu:", err);
      return res.status(500).json({ message: "Database error" });
    }

    return res.json(results);
  });
});

export default router;
