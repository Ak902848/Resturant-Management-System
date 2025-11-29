// routes/orderRoutes.js
import express from "express";
import db from "../db.js";
const router = express.Router();

router.get("/:userId", (req, res) => {
  const userId = req.params.userId;

  const sql = `
    SELECT 
      o.OrderID,
      DATE_FORMAT(o.OrderDate, '%Y-%m-%d %H:%i:%s') AS OrderDate,
      o.TotalAmount,
      m.Name AS ItemName,
      oi.Quantity,
      oi.Price
    FROM orders o
    LEFT JOIN orderitems oi ON o.OrderID = oi.OrderID
    LEFT JOIN menu m ON oi.MenuItemID = m.MenuItemID
    WHERE o.UserID = ?
    ORDER BY o.OrderDate DESC, o.OrderID DESC
  `;

  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Order fetch error:", err);
      return res.status(500).json({ message: "Error fetching orders" });
    }

    if (!rows.length) return res.json([]);

    // group items by order
    const map = {};
    rows.forEach(r => {
      if (!map[r.OrderID]) {
        map[r.OrderID] = {
          OrderID: r.OrderID,
          OrderDate: r.OrderDate,
          TotalAmount: r.TotalAmount,
          Items: []
        };
      }
      if (r.ItemName) {
        map[r.OrderID].Items.push({
          Name: r.ItemName,
          Quantity: r.Quantity,
          Price: r.Price
        });
      }
    });

    res.json(Object.values(map));
  });
});

export default router;
