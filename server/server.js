import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import authRoutes from "./routes/authRoutes.js";
import slotRoutes from "./routes/slotRoutes.js";
import appointmentRoutes from "./routes/appointmentRoutes.js";
import visitNoteRoutes from "./routes/visitNoteRoutes.js";
import historyRoutes from "./routes/historyRoutes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/slots", slotRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/visit-notes", visitNoteRoutes);
app.use("/api/history", historyRoutes);

app.get("/", (req, res) => {
    res.json({
        message: "Clinic Appointment Scheduling API is running"
    });
});

const PORT = process.env.PORT || 5001;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (error) {
        console.error("Server startup failed");
    }
};

startServer();