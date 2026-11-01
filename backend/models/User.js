const mongoose = require("mongoose");

const aadhaarDocumentSchema = new mongoose.Schema(
    {
        fileId: { type: mongoose.Schema.Types.ObjectId, default: null },
        filename: { type: String, default: null },
        mimeType: {
            type: String,
            enum: ["application/pdf", "image/jpeg", "image/png"],
            required: true
        },
        iv: { type: String, required: true },
        authTag: { type: String, required: true }
    },
    { _id: false }
);

const userSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },

        password: {
            type: String,
            required: true
        },

        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user"
        },

        profilePicture: {
            type: String,
            default: null
        },

        profilePictureFileId: {
            type: mongoose.Schema.Types.ObjectId,
            default: null
        },

        aadhaarDocument: {
            type: aadhaarDocumentSchema,
            default: null
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("User", userSchema);