const mongoose = require("mongoose");

const bookingSchema = new mongoose.Schema(
    {
        userId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },
        slotId: {
            type: String,
            trim: true,
            minlength: 1,
            maxlength: 100,
            required: true,
            index: true
        },
        bookingDate: {
            type: String,
            required: true,
            match: /^\d{4}-\d{2}-\d{2}$/
        },
        startTime: {
            type: String,
            required: true,
            match: /^\d{2}:\d{2}$/
        },
        endTime: {
            type: String,
            required: true,
            match: /^\d{2}:\d{2}$/
        },
        status: {
            type: String,
            enum: ["reserved", "confirmed", "cancelled", "completed"],
            default: "confirmed"
        }
    },
    { timestamps: true }
);

// Prevent duplicate active reservations for the same slot and time range.
bookingSchema.index(
    {
        slotId: 1,
        bookingDate: 1,
        startTime: 1,
        endTime: 1
    },
    {
        unique: true,
        partialFilterExpression: {
            status: { $in: ["reserved", "confirmed"] }
        }
    }
);

module.exports = mongoose.model("Booking", bookingSchema);
