import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { authenticate } from "../middleware/authMiddleware";

const router = Router();

router.post("/:id/ai/reply", authenticate, aiController.streamReply);
router.post("/:id/ai/categorize", authenticate, aiController.suggestCategorization);

export default router;
