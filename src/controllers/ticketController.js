const ticketService = require("../services/ticketService");

function getAllTickets(req, res) {
    const tickets = ticketService.getAllTickets();

    res.status(200).json({
        success: true,
        data: tickets
    });
}

module.exports = {
    getAllTickets
};