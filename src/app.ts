import express from "express";
import authRoutes from "./routes/authRoutes";
import ticketRoutes from "./routes/ticketRoutes";
import aiRoutes from "./routes/aiRoutes";
import requestLogger from "./middleware/requestLogger";
import errorHandler from "./middleware/errorHandler";
import cors from "cors";

const app = express();
app.use(cors({
    origin: [
        "http://localhost:5173",
        "http://127.0.0.1:4173"
    ]
}));

app.use(requestLogger);
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to SupportDesk API"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy"
    });
});

app.use("/api/tickets", aiRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/auth", authRoutes);

// 404 Not Found Handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route not found"
    });
});

// Central Error Handler - Must be last
app.use(errorHandler);

export default app;
