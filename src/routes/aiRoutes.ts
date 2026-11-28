import { Router } from "express";
import * as aiController from "../controllers/aiController";
import { authenticate } from "../middleware/authMiddleware";
import { aiRateLimit } from "../middleware/aiRateLimit";

const router = Router();

router.post("/:id/ai/reply", authenticate, aiRateLimit, aiController.streamReply);
router.post("/:id/ai/categorize", authenticate, aiRateLimit, aiController.suggestCategorization);

export default router;
