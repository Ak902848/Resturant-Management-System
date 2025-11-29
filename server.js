import express from "express";
import session from "express-session";
import cors from "cors";

import authRoutes from "./routes/authRoutes.js";
import menuRoutes from "./routes/menuRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import orderRoutes from "./routes/orderRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import cartRoutes from "./routes/cartRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";


const app = express();
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.originalUrl}`);
  next();
});


// --------------------------------------
// CORS FIXED
// --------------------------------------
app.use(cors({
    origin: ["http://127.0.0.1:5500", "http://localhost:5500"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --------------------------------------
// SESSION
// --------------------------------------
app.use(
    session({
        secret: "yourSecretKey",
        resave: false,
        saveUninitialized: false,
        cookie: { 
            maxAge: 24 * 60 * 60 * 1000,
            httpOnly: false 
        }
    })
);

// --------------------------------------
// ROUTES
// --------------------------------------
app.use("/auth", authRoutes);
app.use("/api/menu", menuRoutes);
app.use("/api/categories", categoryRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/users", userRoutes);
app.use("/api/cart", cartRoutes);
app.use("/api/payment", paymentRoutes);


// --------------------------------------
// STATIC FILES
// --------------------------------------
app.use(express.static("public"));

// --------------------------------------
app.listen(5000, () => 
    console.log("🚀 Server running on port 5000")
);
