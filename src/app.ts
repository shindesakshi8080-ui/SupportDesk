import express from "express";
import ticketRoutes from "./routes/ticketRoutes";
import requestLogger from "./middleware/requestLogger";
import errorHandler from "./middleware/errorHandler";

const app = express();

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

app.use("/api/tickets", ticketRoutes);

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
