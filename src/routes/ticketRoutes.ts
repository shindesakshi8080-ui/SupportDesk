import { Router } from "express";
import * as ticketController from "../controllers/ticketController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.get("/", authenticate, ticketController.getAllTickets);
router.get("/:id", authenticate, ticketController.getTicketById);
router.post("/", authenticate, ticketController.createTicket);
router.patch("/:id", authenticate, ticketController.updateTicket);
router.get("/:id/comments", authenticate, ticketController.getTicketComments);
router.post("/:id/comments", authenticate, ticketController.createTicketComment);

export default router;
