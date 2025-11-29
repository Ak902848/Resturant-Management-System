import express from "express";
import db from "../db.js";
import multer from "multer";
import path from "path";
import fs from "fs";

const router = express.Router();

/* -----------------------------
   SETUP UPLOAD DIRECTORY
------------------------------*/
const uploadDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, uploadDir),
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `avatar_${req.params.id}_${Date.now()}${ext}`);
    }
});
const upload = multer({ storage });


/* ============================================================
   ⚠ IMPORTANT: ORDER OF ROUTES (nested routes must come first)
============================================================ */

/* -----------------------------
   USER AVATAR UPLOAD
------------------------------*/
router.post("/:id/avatar", upload.single("avatar"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    const avatar = `/uploads/${req.file.filename}`;
    const sql = "UPDATE users SET avatar = ? WHERE id = ?";

    db.query(sql, [avatar, req.params.id], (err) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json({ message: "Avatar updated", avatar });
    });
});


/* -----------------------------
   USER FAVORITES
------------------------------*/
router.get("/:id/favorites", (req, res) => {
    const sql = `
        SELECT f.id, f.menu_item_id, m.Name, m.Price
        FROM favorites f
        JOIN Menu m ON f.menu_item_id = m.MenuItemID
        WHERE f.user_id = ?
    `;

    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(rows);
    });
});

router.post("/:id/favorites", (req, res) => {
    const { menu_item_id } = req.body;
    if (!menu_item_id) return res.status(400).json({ message: "menu_item_id required" });

    db.query(
        "INSERT INTO favorites (user_id, menu_item_id) VALUES (?, ?)",
        [req.params.id, menu_item_id],
        (err, result) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.status(201).json({ id: result.insertId, menu_item_id });
        }
    );
});


/* -----------------------------
   USER PAYMENTS
------------------------------*/
router.get("/:id/payments", (req, res) => {
    const sql = `
        SELECT payment_id AS PaymentID, amount, method,
               payment_date AS PaymentDate
        FROM payments
        WHERE user_id = ?
        ORDER BY payment_date DESC
    `;

    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(rows);
    });
});


/* -----------------------------
   USER CART
------------------------------*/
router.get("/:id/cart", (req, res) => {
    const sql = `
        SELECT c.cart_item_id AS CartItemID,
               c.menu_item_id AS MenuItemID,
               c.quantity AS Quantity,
               m.Name,
               m.Price
        FROM cart_items c
        JOIN Menu m ON c.menu_item_id = m.MenuItemID
        WHERE c.user_id = ?
    `;

    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error" });
        res.json(rows);
    });
});


router.post("/:id/cart", (req, res) => {
    const { menu_item_id, quantity } = req.body;

    db.query(
        "INSERT INTO cart_items (user_id, menu_item_id, quantity) VALUES (?, ?, ?)",
        [req.params.id, menu_item_id, quantity || 1],
        (err, result) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.status(201).json({ id: result.insertId });
        }
    );
});


router.put("/:id/cart/:cartItemId", (req, res) => {
    db.query(
        "UPDATE cart_items SET quantity = ? WHERE cart_item_id = ?",
        [req.body.quantity, req.params.cartItemId],
        (err) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.json({ message: "Cart updated" });
        }
    );
});

router.delete("/:id/cart/:cartItemId", (req, res) => {
    db.query(
        "DELETE FROM cart_items WHERE cart_item_id = ?",
        [req.params.cartItemId],
        (err) => {
            if (err) return res.status(500).json({ message: "DB error" });
            res.json({ message: "Item removed" });
        }
    );
});


/* -----------------------------
   USER PROFILE (GET)
------------------------------*/
router.get("/:id", (req, res) => {
    const sql = `
        SELECT 
            id,
            name AS Name,
            email AS Email,
            mobile_no AS Mobile,
            avatar AS Avatar,
            created_at AS CreatedDate
        FROM users
        WHERE id = ?
    `;

    db.query(sql, [req.params.id], (err, rows) => {
        if (err) return res.status(500).json({ message: "DB error" });
        if (!rows.length) return res.status(404).json({ message: "User not found" });

        res.json(rows[0]);
    });
});

router.put("/:id", (req, res) => {
    const { name, mobile_no } = req.body;

    if (!name || !mobile_no) {
        return res.status(400).json({ message: "Missing fields" });
    }

    const sql = `
        UPDATE users 
        SET name = ?, mobile_no = ?
        WHERE id = ?
    `;

    db.query(sql, [name, mobile_no, req.params.id], (err) => {
        if (err) {
            console.error("UPDATE ERROR:", err);
            return res.status(500).json({ message: "DB error" });
        }

        res.json({ message: "Profile updated successfully" });
    });
});



export default router;
