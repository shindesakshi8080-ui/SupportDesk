const ticketRepository = require("../repositories/ticketRepository");

function getAllTickets() {
    return ticketRepository.getAllTickets();
}

module.exports = {
    getAllTickets
};