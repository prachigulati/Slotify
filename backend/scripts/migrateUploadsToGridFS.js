const fs = require("fs/promises");
const path = require("path");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const User = require("../models/User");
const { saveBuffer } = require("../services/gridfsStorage");

dotenv.config({ path: path.join(__dirname, "../../.env") });
dotenv.config({ path: path.join(__dirname, "../.env") });

const publicUploadDirectory = path.join(__dirname, "../uploads");
const privateUploadDirectory = path.join(__dirname, "../private-uploads");
const profileMimeTypes = {
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".webp": "image/webp"
};

async function migrateProfilePicture(user) {
    if (!user.profilePicture || user.profilePictureFileId) {
        return false;
    }

    const match = /^\/uploads\/([0-9a-f-]+\.(?:jpg|jpeg|png|webp))$/i.exec(
        user.profilePicture
    );
    if (!match) {
        throw new Error("Profile picture does not reference a supported legacy upload.");
    }

    const filename = match[1];
    const mimeType = profileMimeTypes[path.extname(filename).toLowerCase()];
    const filePath = path.join(publicUploadDirectory, filename);
    const contents = await fs.readFile(filePath);
    const fileId = await saveBuffer(contents, {
        filename: `profile-${user._id}-${filename}`,
        contentType: mimeType,
        metadata: { ownerId: user._id, purpose: "profile-picture" }
    });

    user.profilePictureFileId = fileId;
    user.profilePicture = null;
    try {
        await user.save();
    } catch (error) {
        const { removeFile } = require("../services/gridfsStorage");
        await removeFile(fileId);
        throw error;
    }

    await fs.unlink(filePath);
    return true;
}

async function migrateAadhaarDocument(user) {
    const document = user.aadhaarDocument;
    if (!document || document.fileId || !document.filename) {
        return false;
    }

    if (!/^[0-9a-f-]+\.enc$/i.test(document.filename)) {
        throw new Error("Aadhaar document does not reference a supported legacy upload.");
    }

    const filePath = path.join(privateUploadDirectory, document.filename);
    const encryptedContents = await fs.readFile(filePath);
    const fileId = await saveBuffer(encryptedContents, {
        filename: `aadhaar-${user._id}-${document.filename}`,
        contentType: "application/octet-stream",
        metadata: {
            ownerId: user._id,
            purpose: "aadhaar",
            encrypted: true
        }
    });

    document.fileId = fileId;
    document.filename = null;
    try {
        await user.save();
    } catch (error) {
        const { removeFile } = require("../services/gridfsStorage");
        await removeFile(fileId);
        throw error;
    }

    await fs.unlink(filePath);
    return true;
}

async function main() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be configured before migrating uploads.");
    }

    await mongoose.connect(process.env.MONGO_URI);
    let migratedProfilePictures = 0;
    let migratedAadhaarDocuments = 0;
    let failures = 0;

    for await (const user of User.find()) {
        try {
            if (await migrateProfilePicture(user)) migratedProfilePictures += 1;
            if (await migrateAadhaarDocument(user)) migratedAadhaarDocuments += 1;
        } catch (error) {
            failures += 1;
            console.error(`Could not migrate uploads for user ${user._id}: ${error.message}`);
        }
    }

    console.log(`Migrated profile pictures: ${migratedProfilePictures}`);
    console.log(`Migrated Aadhaar documents: ${migratedAadhaarDocuments}`);
    console.log(`Migration failures: ${failures}`);
    if (failures > 0) process.exitCode = 1;
}

main()
    .catch(error => {
        console.error("Upload migration failed:", error.message);
        process.exitCode = 1;
    })
    .finally(async () => {
        if (mongoose.connection.readyState !== 0) {
            await mongoose.disconnect();
        }
    });
