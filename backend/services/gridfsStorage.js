const mongoose = require("mongoose");

const bucketName = "uploads";

function getBucket() {
    if (mongoose.connection.readyState !== 1) {
        throw new Error("MongoDB must be connected before accessing uploaded files.");
    }

    return new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName });
}

function saveBuffer(buffer, { filename, contentType, metadata }) {
    return new Promise((resolve, reject) => {
        const uploadStream = getBucket().openUploadStream(filename, {
            metadata: {
                ...metadata,
                contentType
            }
        });

        uploadStream.once("error", reject);
        uploadStream.once("finish", () => resolve(uploadStream.id));
        uploadStream.end(buffer);
    });
}

function readBuffer(fileId) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        const downloadStream = getBucket().openDownloadStream(
            new mongoose.Types.ObjectId(fileId)
        );

        downloadStream.on("data", chunk => chunks.push(chunk));
        downloadStream.once("error", reject);
        downloadStream.once("end", () => resolve(Buffer.concat(chunks)));
    });
}

async function removeFile(fileId) {
    try {
        await getBucket().delete(new mongoose.Types.ObjectId(fileId));
    } catch (error) {
        const missingGridFSFile = error.name === "MongoRuntimeError" &&
            error.message.startsWith("File not found for id ");
        if (!missingGridFSFile) {
            throw error;
        }
    }
}

module.exports = { getBucket, readBuffer, removeFile, saveBuffer };
