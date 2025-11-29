// routes/cartRoutes.js
import express from "express";
import db from "../db.js"; // your mysql connection pool

const router = express.Router();

/*
  Expects DB tables (as provided):
    cart_items(cart_item_id, user_id, menu_item_id, quantity, added_at)
    menu(MenuItemID, Name, Description, Price, CategoryID)
    orders(OrderID, UserID, OrderDate, TotalAmount)
    orderitems(OrderItemID, OrderID, MenuItemID, Quantity, Price)
*/

// -------------------------------
// Add to cart (insert or increment)
// POST /api/cart/add
// body: { userId, menuItemId, quantity }
// -------------------------------
router.post("/add", (req, res) => {
  const { userId, menuItemId, quantity } = req.body;
  if (!userId || !menuItemId) {
    return res.status(400).json({ message: "userId and menuItemId required" });
  }

  const qty = Math.max(1, Number(quantity) || 1);

  const checkSql =
    "SELECT cart_item_id, quantity FROM cart_items WHERE user_id = ? AND menu_item_id = ?";
  db.query(checkSql, [userId, menuItemId], (err, rows) => {
    if (err) {
      console.error("Cart check error:", err);
      return res.status(500).json({ message: "Server error" });
    }

    if (rows.length > 0) {
      const existingId = rows[0].cart_item_id;
      const newQty = Number(rows[0].quantity) + qty;
      const updSql = "UPDATE cart_items SET quantity = ?, added_at = NOW() WHERE cart_item_id = ?";
      db.query(updSql, [newQty, existingId], (err2) => {
        if (err2) {
          console.error("Cart update error:", err2);
          return res.status(500).json({ message: "Server error" });
        }
        return res.json({ message: "Cart updated", cart_item_id: existingId, quantity: newQty });
      });
    } else {
      const insSql =
        "INSERT INTO cart_items (user_id, menu_item_id, quantity, added_at) VALUES (?, ?, ?, NOW())";
      db.query(insSql, [userId, menuItemId, qty], (err3, result) => {
        if (err3) {
          console.error("Cart insert error:", err3);
          return res.status(500).json({ message: "Server error" });
        }
        return res.status(201).json({ message: "Added to cart", cart_item_id: result.insertId });
      });
    }
  });
});

// -------------------------------
// Get cart items for a user
// GET /api/cart/:userId
// -------------------------------
router.get("/:userId", (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT c.cart_item_id, c.menu_item_id, c.quantity, c.added_at,
           m.MenuItemID, m.Name, m.Description, m.Price, m.CategoryID
    FROM cart_items c
    JOIN menu m ON c.menu_item_id = m.MenuItemID
    WHERE c.user_id = ?
    ORDER BY c.added_at DESC
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Get cart error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(rows);
  });
});

// -------------------------------
// Cart summary: count + total
// GET /api/cart/:userId/summary
// -------------------------------
router.get("/:userId/summary", (req, res) => {
  const userId = req.params.userId;
  const sql = `
    SELECT COUNT(*) AS itemCount, IFNULL(SUM(m.Price * c.quantity), 0) AS totalAmount
    FROM cart_items c
    JOIN menu m ON c.menu_item_id = m.MenuItemID
    WHERE c.user_id = ?
  `;
  db.query(sql, [userId], (err, rows) => {
    if (err) {
      console.error("Cart summary error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json(rows[0] || { itemCount: 0, totalAmount: 0 });
  });
});

// -------------------------------
// Update cart item quantity
// PUT /api/cart/update/:cartItemId
// body: { quantity }
// -------------------------------
router.put("/update/:cartItemId", (req, res) => {
  const cartItemId = req.params.cartItemId;
  const quantity = Number(req.body.quantity);

  if (!Number.isInteger(quantity) || quantity < 1) {
    return res.status(400).json({ message: "Quantity must be integer >= 1" });
  }

  const sql = "UPDATE cart_items SET quantity = ?, added_at = NOW() WHERE cart_item_id = ?";
  db.query(sql, [quantity, cartItemId], (err) => {
    if (err) {
      console.error("Update cart quantity error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ message: "Quantity updated" });
  });
});

// -------------------------------
// Remove cart item
// DELETE /api/cart/remove/:cartItemId
// -------------------------------
router.delete("/remove/:cartItemId", (req, res) => {
  const cartItemId = req.params.cartItemId;
  const sql = "DELETE FROM cart_items WHERE cart_item_id = ?";
  db.query(sql, [cartItemId], (err) => {
    if (err) {
      console.error("Delete cart item error:", err);
      return res.status(500).json({ message: "Server error" });
    }
    res.json({ message: "Removed from cart" });
  });
});

// -------------------------------
// Checkout - create order from cart
// POST /api/cart/checkout/:userId
// -------------------------------
router.post("/checkout/:userId", (req, res) => {
  const userId = req.params.userId;

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("Connection error:", connErr);
      return res.status(500).json({ message: "Server error" });
    }

    connection.beginTransaction((tErr) => {
      if (tErr) {
        connection.release();
        console.error("Transaction start error:", tErr);
        return res.status(500).json({ message: "Server error" });
      }

      // 1) Fetch cart items with prices
      const cartSql = `
        SELECT c.cart_item_id, c.menu_item_id, c.quantity, m.Price
        FROM cart_items c
        JOIN menu m ON c.menu_item_id = m.MenuItemID
        WHERE c.user_id = ?
        FOR UPDATE
      `;

      connection.query(cartSql, [userId], (cartErr, cartRows) => {
        if (cartErr) {
          connection.rollback(() => connection.release());
          console.error("Fetch cart for checkout error:", cartErr);
          return res.status(500).json({ message: "Server error" });
        }

        if (!cartRows.length) {
          connection.rollback(() => connection.release());
          return res.status(400).json({ message: "Cart is empty" });
        }

        // calculate total
        let total = 0;
        cartRows.forEach(r => {
          total += Number(r.Price) * Number(r.quantity);
        });

        // 2) Insert into orders
        const insertOrderSql = `
          INSERT INTO orders (UserID, OrderDate, TotalAmount)
          VALUES (?, NOW(), ?)
        `;

        connection.query(insertOrderSql, [userId, total], (ordErr, ordRes) => {
          if (ordErr) {
            connection.rollback(() => connection.release());
            console.error("Insert order error:", ordErr);
            return res.status(500).json({ message: "Server error" });
          }

          const newOrderId = ordRes.insertId;

          // 3) Insert order items
          const orderItemsValues = cartRows.map(r => [newOrderId, r.menu_item_id, r.quantity, r.Price]);
          const insertOI = `
            INSERT INTO orderitems (OrderID, MenuItemID, Quantity, Price)
            VALUES ?
          `;

          connection.query(insertOI, [orderItemsValues], (oiErr) => {
            if (oiErr) {
              connection.rollback(() => connection.release());
              console.error("Insert order items error:", oiErr);
              return res.status(500).json({ message: "Server error" });
            }

            // 4) Clear cart for user
            const clearSql = "DELETE FROM cart_items WHERE user_id = ?";
            connection.query(clearSql, [userId], (clearErr) => {
              if (clearErr) {
                connection.rollback(() => connection.release());
                console.error("Clear cart error:", clearErr);
                return res.status(500).json({ message: "Server error" });
              }

              // commit
              connection.commit((cErr) => {
                if (cErr) {
                  connection.rollback(() => connection.release());
                  console.error("Commit error:", cErr);
                  return res.status(500).json({ message: "Server error" });
                }

                connection.release();
                return res.json({ message: "Order placed", orderId: newOrderId, total });
              });
            });
          });
        });
      });
    });
  });
});

export default router;
