const express = require("express");
const mongoose = require("mongoose");
const Booking = require("../models/Booking");
const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();
const activeStatuses = { $in: ["reserved", "confirmed"] };

const isValidTime = (value) => /^\d{2}:\d{2}$/.test(value);

const isTimeRangeValid = (startTime, endTime) => {
    if (!isValidTime(startTime) || !isValidTime(endTime)) {
        return false;
    }

    const [startHour, startMinute] = startTime.split(":").map(Number);
    const [endHour, endMinute] = endTime.split(":").map(Number);

    if (
        startHour > 23 ||
        endHour > 23 ||
        startMinute > 59 ||
        endMinute > 59
    ) {
        return false;
    }

    return startTime < endTime;
};

router.post("/", authMiddleware, async (req, res) => {
    try {
        const { slotId, bookingDate, startTime, endTime } = req.body;

        if (
            !slotId ||
            !bookingDate ||
            !/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) ||
            !isTimeRangeValid(startTime, endTime)
        ) {
            return res.status(400).json({
                message: "A valid slot, date and time range are required."
            });
        }

        const existingBooking = await Booking.findOne({
            slotId,
            bookingDate,
            status: activeStatuses,
            startTime: { $lt: endTime },
            endTime: { $gt: startTime }
        });

        if (existingBooking) {
            return res.status(409).json({
                message: "This parking slot is already booked for that time."
            });
        }

        const booking = await Booking.create({
            userId: req.user.userId,
            slotId,
            bookingDate,
            startTime,
            endTime
        });

        return res.status(201).json({
            message: "Booking created successfully.",
            booking
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "This slot was just booked by another user."
            });
        }

        if (error.name === "ValidationError") {
            return res.status(400).json({
                message: "The booking details are invalid."
            });
        }

        console.error("Booking creation error:", error.message);
        return res.status(500).json({
            message: "Could not create booking."
        });
    }
});

router.get("/mine", authMiddleware, async (req, res) => {
    try {
        const bookings = await Booking.find({ userId: req.user.userId })
            .sort({ bookingDate: 1, startTime: 1 })
            .lean();

        return res.status(200).json({ bookings });
    } catch (error) {
        console.error("Booking lookup error:", error.message);
        return res.status(500).json({
            message: "Could not load your bookings."
        });
    }
});

router.patch("/:bookingId/cancel", authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.bookingId)) {
            return res.status(400).json({ message: "Invalid booking ID." });
        }

        const booking = await Booking.findOneAndUpdate(
            {
                _id: req.params.bookingId,
                userId: req.user.userId,
                status: activeStatuses
            },
            { status: "cancelled" },
            { new: true }
        );

        if (!booking) {
            return res.status(404).json({
                message: "Active booking not found."
            });
        }

        return res.status(200).json({
            message: "Booking cancelled successfully.",
            booking
        });
    } catch (error) {
        console.error("Booking cancellation error:", error.message);
        return res.status(500).json({
            message: "Could not cancel booking."
        });
    }
});

module.exports = router;
