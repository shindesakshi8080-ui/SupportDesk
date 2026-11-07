const tickets = [
    {
        id: 1,
        title: "Login issue",
        status: "Open"
    },
    {
        id: 2,
        title: "Payment issue",
        status: "Closed"
    }
];

function getAllTickets() {
    return tickets;
}

module.exports = {
    getAllTickets
};