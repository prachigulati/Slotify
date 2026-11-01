const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const path = require("path");
const dotenv = require("dotenv");
dotenv.config({ path: path.join(__dirname, "../.env") });
dotenv.config({ path: path.join(__dirname, ".env") });

const User = require("./models/User");

const createAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("MongoDB connected!");

        const adminEmail = "admin@slotify.com";
        const adminPassword = "ChangeThisAdmin123!";
        const adminName = "Slotify Admin";

        const existingAdmin = await User.findOne({
            email: adminEmail
        });

        if (existingAdmin) {
            console.log("Admin account already exists.");

            // Ensure the existing account has the admin role
            existingAdmin.role = "admin";
            await existingAdmin.save();

            console.log("Admin role verified.");
        } else {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);

            await User.create({
                name: adminName,
                email: adminEmail,
                password: hashedPassword,
                role: "admin"
            });

            console.log("Admin account created successfully!");
        }

        console.log("Admin email:", adminEmail);
        console.log("Admin password:", adminPassword);

    } catch (error) {
        console.error("Error creating admin:", error.message);
    } finally {
        await mongoose.disconnect();
        console.log("MongoDB disconnected.");
    }
};

createAdmin();