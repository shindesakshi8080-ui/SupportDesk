import { Router } from "express";
import * as ticketController from "../controllers/ticketController";

const router = Router();

router.get("/", ticketController.getAllTickets);
router.get("/:id", ticketController.getTicketById);
router.post("/", ticketController.createTicket);
router.patch("/:id", ticketController.updateTicket);

export default router;
