const multer = require("multer");

const imageMimeTypes = new Set([
    "image/jpeg",
    "image/png",
    "image/webp"
]);

const uploadImage = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 0,
        parts: 1
    },
    fileFilter: (req, file, callback) => {
        if (!imageMimeTypes.has(file.mimetype)) {
            const error = new Error("Only JPEG, PNG, and WebP images are allowed.");
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    }
});

const aadhaarMimeTypes = new Set([
    "application/pdf",
    "image/jpeg",
    "image/png"
]);

const uploadAadhaar = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024,
        files: 1,
        fields: 0,
        parts: 1
    },
    fileFilter: (req, file, callback) => {
        if (!aadhaarMimeTypes.has(file.mimetype)) {
            const error = new Error("Choose a PDF, JPEG, or PNG document.");
            error.status = 400;
            return callback(error);
        }

        callback(null, true);
    }
});

module.exports = {
    uploadAadhaar,
    uploadImage
};
