import express from "express";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();

/* ======================================
   USER SIGNUP
====================================== */
router.post("/signup", async (req, res) => {
    const { name, email, mobile, password } = req.body;

    // Validate required fields
    if (!name || !email || !mobile || !password) {
        return res.status(400).json({ message: "All fields required" });
    }

    try {
        // Check existing email or username
        const checkSql = "SELECT id FROM users WHERE email = ? OR name = ?";
        db.query(checkSql, [email, name], async (err, rows) => {
            if (err) return res.status(500).json({ message: "Database error" });

            if (rows.length > 0) {
                return res.status(400).json({ message: "User already exists" });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Insert new user
            const sql = `
                INSERT INTO users (name, email, mobile_no, password)
                VALUES (?, ?, ?, ?)
            `;

            db.query(sql, [name, email, mobile, hashedPassword], (err) => {
                if (err) return res.status(500).json({ message: "Signup failed!" });

                return res.json({ message: "Signup successful" });
            });
        });

    } catch (error) {
        return res.status(500).json({ message: "Server error" });
    }
});
router.get("/me", (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Not logged in" });
    res.json(req.session.user);
});


/* ======================================
   USER LOGIN
====================================== */
router.post("/login", (req, res) => {
    const { name, password } = req.body;

    if (!name || !password) {
        return res.status(400).json({ message: "All fields required" });
    }

    console.log("\n===== LOGIN ATTEMPT =====");
    console.log("Name:", name);
    console.log("Password:", password);

    const sql = "SELECT * FROM users WHERE name = ?";
    db.query(sql, [name], async (err, results) => {
        if (err) return res.status(500).json({ message: "Database error" });

        if (results.length === 0) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        const user = results[0];

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);

        console.log("\n===== BCRYPT VERIFY =====");
        console.log("Password match:", isMatch);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid username or password" });
        }

        // Save session
        req.session.user = {
            id: user.id,
            name: user.name,
            email: user.email,
            mobile: user.mobile_no
        };

        return res.json({
            message: "Login successful",
            user: req.session.user
        });
    });
});

/* ======================================
   USER LOGOUT
====================================== */
router.get("/logout", (req, res) => {
    req.session.destroy(() => {
        return res.json({ message: "Logged out" });
    });
});

export default router;
