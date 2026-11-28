const express = require("express");
const ticketRoutes = require("./routes/ticketRoutes");
const requestLogger = require("./middleware/requestLogger");

const app = express();

app.use(requestLogger);
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Welcome to SupportDesk API"
    });
});

app.use("/api/tickets", ticketRoutes);

module.exports = app;