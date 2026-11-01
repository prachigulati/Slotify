const express = require("express");
const multer = require("multer");
const crypto = require("crypto");
const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");
const { uploadAadhaar, uploadImage } = require("../middleware/uploadMiddleware");
const {
    getBucket,
    readBuffer,
    removeFile,
    saveBuffer
} = require("../services/gridfsStorage");

const router = express.Router();

router.post("/profile-picture", authMiddleware, (req, res) => {
    uploadImage.single("image")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            return res.status(status).json({ message: error.message });
        }

        if (error) {
            if (error.status === 400) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Profile picture upload error:", error.message);
            return res.status(500).json({
                message: "Something went wrong while uploading your profile picture."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'An image file is required in the "image" field.'
            });
        }

        updateProfilePicture(req, res);
    });
});

router.get("/profile-picture", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("profilePictureFileId");
        if (!user) {
            return res.status(404).json({ message: "User account not found." });
        }
        if (!user.profilePictureFileId) {
            return res.status(404).json({ message: "No profile picture has been uploaded." });
        }

        const file = await getGridFSFile(user.profilePictureFileId);
        const contentType = file?.metadata?.contentType;
        if (!file || !["image/jpeg", "image/png", "image/webp"].includes(contentType)) {
            return res.status(404).json({ message: "The stored profile picture is unavailable." });
        }
        const image = await readBuffer(user.profilePictureFileId);

        res.set({
            "Cache-Control": "private, no-store",
            "Content-Type": contentType,
            "X-Content-Type-Options": "nosniff"
        });
        return res.status(200).send(image);
    } catch (error) {
        console.error("Profile picture retrieval error:", error.message);
        return res.status(500).json({
            message: "Something went wrong while retrieving your profile picture."
        });
    }
});

router.post("/aadhaar", authMiddleware, (req, res) => {
    let encryptionKey;
    try {
        encryptionKey = getAadhaarEncryptionKey();
    } catch (error) {
        console.error("Aadhaar upload is not configured:", error.message);
        return res.status(503).json({
            message: "Secure document uploads are not configured on this server."
        });
    }

    uploadAadhaar.single("document")(req, res, (error) => {
        if (error instanceof multer.MulterError) {
            const status = error.code === "LIMIT_FILE_SIZE" ? 413 : 400;
            return res.status(status).json({ message: error.message });
        }

        if (error) {
            if (error.status === 400) {
                return res.status(400).json({ message: error.message });
            }
            console.error("Aadhaar upload error:", error.message);
            return res.status(500).json({
                message: "Something went wrong while uploading your document."
            });
        }

        if (!req.file) {
            return res.status(400).json({
                message: 'A document file is required in the "document" field.'
            });
        }

        saveAadhaarDocument(req, res, encryptionKey);
    });
});

router.get("/aadhaar", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId).select("aadhaarDocument");
        if (!user) {
            return res.status(404).json({ message: "User account not found." });
        }
        if (!user.aadhaarDocument) {
            return res.status(404).json({ message: "No Aadhaar document has been uploaded." });
        }

        const key = getAadhaarEncryptionKey();
        const document = user.aadhaarDocument;
        if (!document.fileId) {
            return res.status(409).json({
                message: "This older document must be migrated to MongoDB before it can be downloaded."
            });
        }
        const encrypted = await readBuffer(document.fileId);
        const decipher = crypto.createDecipheriv(
            "aes-256-gcm",
            key,
            Buffer.from(document.iv, "hex")
        );
        decipher.setAuthTag(Buffer.from(document.authTag, "hex"));
        const decrypted = Buffer.concat([
            decipher.update(encrypted),
            decipher.final()
        ]);
        const extension = document.mimeType === "application/pdf"
            ? "pdf"
            : document.mimeType === "image/jpeg" ? "jpg" : "png";

        res.set({
            "Cache-Control": "private, no-store",
            "Content-Disposition": `attachment; filename="aadhaar-document.${extension}"`,
            "Content-Type": document.mimeType,
            "X-Content-Type-Options": "nosniff"
        });
        return res.status(200).send(decrypted);
    } catch (error) {
        if (error.code === "ENOENT") {
            return res.status(404).json({
                message: "The stored document is no longer available."
            });
        }
        if (error.message === "AADHAAR_ENCRYPTION_KEY is missing or invalid.") {
            console.error("Aadhaar download is not configured:", error.message);
            return res.status(503).json({
                message: "Secure document access is not configured on this server."
            });
        }
        console.error("Aadhaar download error:", error.message);
        return res.status(500).json({
            message: "Something went wrong while retrieving your document."
        });
    }
});

router.delete("/aadhaar", authMiddleware, async (req, res) => {
    try {
        const user = await User.findById(req.user.userId);
        if (!user) {
            return res.status(404).json({ message: "User account not found." });
        }
        if (!user.aadhaarDocument) {
            return res.status(200).json({
                message: "No Aadhaar document is stored.",
                hasAadhaarDocument: false
            });
        }

        const oldFileId = user.aadhaarDocument.fileId;
        user.aadhaarDocument = null;
        await user.save();
        if (oldFileId) {
            await removeFile(oldFileId);
        }

        return res.status(200).json({
            message: "Your Aadhaar document was deleted.",
            hasAadhaarDocument: false
        });
    } catch (error) {
        console.error("Aadhaar deletion error:", error.message);
        return res.status(500).json({
            message: "Something went wrong while deleting your document."
        });
    }
});

async function saveAadhaarDocument(req, res, encryptionKey) {
    if (!matchesDeclaredFileType(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
            message: "The file contents do not match the selected document type."
        });
    }

    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", encryptionKey, iv);
    const encrypted = Buffer.concat([
        cipher.update(req.file.buffer),
        cipher.final()
    ]);
    let fileId;

    try {
        fileId = await saveBuffer(encrypted, {
            filename: `aadhaar-${req.user.userId}-${crypto.randomUUID()}.enc`,
            contentType: "application/octet-stream",
            metadata: {
                ownerId: req.user.userId,
                purpose: "aadhaar",
                encrypted: true
            }
        });

        const user = await User.findById(req.user.userId);
        if (!user) {
            await removeFile(fileId);
            return res.status(404).json({ message: "User account not found." });
        }

        const previousFileId = user.aadhaarDocument?.fileId;
        user.aadhaarDocument = {
            fileId,
            mimeType: req.file.mimetype,
            iv: iv.toString("hex"),
            authTag: cipher.getAuthTag().toString("hex")
        };
        await user.save();

        if (previousFileId) {
            try {
                await removeFile(previousFileId);
            } catch (cleanupError) {
                console.error("Could not remove replaced Aadhaar GridFS file:", cleanupError.message);
            }
        }

        return res.status(200).json({
            message: "Your Aadhaar document was uploaded securely.",
            hasAadhaarDocument: true
        });
    } catch (error) {
        if (fileId) {
            try {
                await removeFile(fileId);
            } catch (cleanupError) {
                console.error("Could not remove failed Aadhaar GridFS file:", cleanupError.message);
            }
        }
        console.error("Aadhaar upload error:", error.message);
        return res.status(500).json({
            message: "Something went wrong while saving your document."
        });
    }
}

function getAadhaarEncryptionKey() {
    const value = process.env.AADHAAR_ENCRYPTION_KEY;
    if (!value || !/^[a-fA-F0-9]{64}$/.test(value)) {
        throw new Error("AADHAAR_ENCRYPTION_KEY is missing or invalid.");
    }
    return Buffer.from(value, "hex");
}

function matchesDeclaredFileType(buffer, mimeType) {
    if (mimeType === "application/pdf") {
        return buffer.subarray(0, 5).toString("ascii") === "%PDF-";
    }
    if (mimeType === "image/jpeg") {
        return buffer.length >= 3 &&
            buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
    }
    if (mimeType === "image/png") {
        return buffer.subarray(0, 8).equals(
            Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
        );
    }
    if (mimeType === "image/webp") {
        return buffer.length >= 12 &&
            buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
            buffer.subarray(8, 12).toString("ascii") === "WEBP";
    }
    return false;
}

async function updateProfilePicture(req, res) {
    if (!matchesDeclaredFileType(req.file.buffer, req.file.mimetype)) {
        return res.status(400).json({
            message: "The file contents do not match the selected image type."
        });
    }

    let fileId;

    try {
        fileId = await saveBuffer(req.file.buffer, {
            filename: `profile-${req.user.userId}-${crypto.randomUUID()}`,
            contentType: req.file.mimetype,
            metadata: {
                ownerId: req.user.userId,
                purpose: "profile-picture"
            }
        });

        const user = await User.findById(req.user.userId);

        if (!user) {
            await removeFile(fileId);
            return res.status(404).json({ message: "User account not found." });
        }

        const previousFileId = user.profilePictureFileId;
        user.profilePictureFileId = fileId;
        user.profilePicture = null;
        await user.save();

        if (previousFileId) {
            try {
                await removeFile(previousFileId);
            } catch (error) {
                console.error("Could not remove previous profile picture GridFS file:", error.message);
            }
        }

        return res.status(200).json({
            message: "Profile picture updated successfully.",
            hasProfilePicture: true
        });
    } catch (error) {
        if (fileId) {
            try {
                await removeFile(fileId);
            } catch (cleanupError) {
                console.error("Could not remove failed profile picture GridFS file:", cleanupError.message);
            }
        }

        console.error("Profile picture update error:", error.message);
        return res.status(500).json({
            message: "Something went wrong while updating your profile picture."
        });
    }
}

async function getGridFSFile(fileId) {
    return getBucket().find({ _id: fileId }).next();
}

module.exports = router;
