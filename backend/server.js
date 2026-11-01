const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const path = require("path");

// Load project-root settings first, then fill missing values from backend/.env.
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const authRoutes = require("./routes/auth");
const testRoutes = require("./routes/test");
const uploadRoutes = require("./routes/uploads");
const app = express();
const PORT = process.env.PORT || 5000;


// -------------------- MIDDLEWARE --------------------

app.use(cors());
app.use(express.json());


// -------------------- FRONTEND --------------------

// Serve frontend files such as index.html, login.html,
// signup.html, style.css and script.js.
const frontendPath = path.join(__dirname, "../frontend");

app.use(express.static(frontendPath));


// -------------------- API ROUTES --------------------

// Signup and login APIs
app.use("/api/auth", authRoutes);
app.use("/api/test", testRoutes);
app.use("/api/uploads", uploadRoutes);

// -------------------- HOME ROUTE --------------------

app.get("/", (req, res) => {
    res.sendFile(path.join(frontendPath, "index.html"));
});


// -------------------- DATABASE + SERVER --------------------

mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
        console.log("MongoDB connected successfully!");

        app.listen(PORT, () => {
            console.log(`Slotify server is running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error("MongoDB connection failed:", error.message);
    });