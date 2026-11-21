import { Router } from "express";
import * as ticketController from "../controllers/ticketController";

const router = Router();

router.get("/", ticketController.getAllTickets);
router.get("/:id", ticketController.getTicketById);
router.post("/", ticketController.createTicket);

export default router;
