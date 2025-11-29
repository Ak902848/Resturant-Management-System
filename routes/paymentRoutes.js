// routes/paymentRoutes.js
import express from "express";
import db from "../db.js"; // MySQL pool

const router = express.Router();

router.post("/process", (req, res) => {
  const { user_id, amount, method } = req.body;

  if (!user_id || !amount || !method) {
    return res.status(400).json({ message: "Missing fields" });
  }

  db.getConnection((connErr, connection) => {
    if (connErr) {
      console.error("Connection error:", connErr);
      return res.status(500).json({ message: "Server error (DB connection)" });
    }

    connection.beginTransaction((tErr) => {
      if (tErr) {
        console.error("Transaction start error:", tErr);
        connection.release();
        return res.status(500).json({ message: "Server error (transaction)" });
      }

      console.log("Transaction started for user", user_id);

      // 1) Fetch cart items
      const cartSql = `
        SELECT c.cart_item_id, c.menu_item_id, c.quantity, m.Price
        FROM cart_items c
        JOIN menu m ON c.menu_item_id = m.MenuItemID
        WHERE c.user_id = ?
        FOR UPDATE
      `;

      connection.query(cartSql, [user_id], (cartErr, cartRows) => {
        if (cartErr) {
          console.error("Error fetching cart:", cartErr);
          connection.rollback(() => connection.release());
          return res.status(500).json({ message: "DB error (fetch cart)" });
        }

        if (!cartRows.length) {
          console.warn("Cart is empty for user", user_id);
          connection.rollback(() => connection.release());
          return res.status(400).json({ message: "Cart is empty" });
        }

        // 2) Calculate total
        let calcTotal = 0;
        cartRows.forEach(r => {
          if (!r.Price || !r.quantity) {
            console.error("Invalid cart item data:", r);
          }
          calcTotal += Number(r.Price) * Number(r.quantity);
        });

        console.log(`Calculated total for user ${user_id}:`, calcTotal);

        // Optional: overwrite provided amount
        if (Math.abs(calcTotal - Number(amount)) > 0.01) {
          console.warn("Amount mismatch, using calculated total:", calcTotal, "provided:", amount);
        }

        // 3) Insert into orders
        const insertOrderSql = `INSERT INTO orders (UserID, OrderDate, TotalAmount) VALUES (?, NOW(), ?)`;

        connection.query(insertOrderSql, [user_id, calcTotal], (ordErr, ordRes) => {
          if (ordErr) {
            console.error("Error inserting order:", ordErr);
            connection.rollback(() => connection.release());
            return res.status(500).json({ message: "DB error (create order)" });
          }

          const orderId = ordRes.insertId;
          console.log("Created order with ID:", orderId);

          // 4) Insert order items
          const orderItemsValues = cartRows.map(r => [orderId, r.menu_item_id, r.quantity, r.Price]);
          const insertOI = `INSERT INTO orderitems (OrderID, MenuItemID, Quantity, Price) VALUES ?`;

          connection.query(insertOI, [orderItemsValues], (oiErr) => {
            if (oiErr) {
              console.error("Error inserting order items:", oiErr);
              connection.rollback(() => connection.release());
              return res.status(500).json({ message: "DB error (order items)" });
            }

            console.log("Inserted order items for order ID:", orderId);

            // 5) Insert payment
            const paySql = `INSERT INTO payments (user_id, order_id, amount, method, payment_date) VALUES (?, ?, ?, ?, NOW())`;

            connection.query(paySql, [user_id, orderId, calcTotal, method], (payErr) => {
              if (payErr) {
                console.error("Error inserting payment:", payErr);
                connection.rollback(() => connection.release());
                return res.status(500).json({ message: "DB error (payment)" });
              }

              console.log("Payment recorded for order ID:", orderId);

              // 6) Clear cart
              connection.query("DELETE FROM cart_items WHERE user_id = ?", [user_id], (clearErr) => {
                if (clearErr) {
                  console.error("Error clearing cart:", clearErr);
                  connection.rollback(() => connection.release());
                  return res.status(500).json({ message: "DB error (clear cart)" });
                }

                console.log("Cart cleared for user:", user_id);

                // 7) Commit transaction
                connection.commit((cErr) => {
                  if (cErr) {
                    console.error("Error committing transaction:", cErr);
                    connection.rollback(() => connection.release());
                    return res.status(500).json({ message: "Commit error" });
                  }

                  console.log("Transaction committed successfully for order ID:", orderId);
                  connection.release();
                  res.json({
                    message: "Payment successful & Order placed",
                    order_id: orderId,
                    total: calcTotal
                  });
                });
              });
            });
          });
        });
      });
    });
  });
});

export default router;
