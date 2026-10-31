const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const roleMiddleware = require("../middleware/roleMiddleware");

// ----------------------------------------
// Protected route: any logged-in user
// ----------------------------------------
router.get(
    "/user",
    authMiddleware,
    (req, res) => {
        res.status(200).json({
            message: "Authentication successful! You are logged in.",
            user: req.user
        });
    }
);

// ----------------------------------------
// Protected route: admin only
// ----------------------------------------
router.get(
    "/admin",
    authMiddleware,
    roleMiddleware("admin"),
    (req, res) => {
        res.status(200).json({
            message: "Authorization successful! You are an admin.",
            user: req.user
        });
    }
);

module.exports = router;