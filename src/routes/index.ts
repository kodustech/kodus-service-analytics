import { Router } from "express";
import { developerProductivityRoutes } from "./developer-productivity.routes";
import { codeHealthRoutes } from "./code-health.routes";

const router = Router();

router.use("/productivity", developerProductivityRoutes);
router.use("/code-health", codeHealthRoutes);

export const analyticsRoutes = router;
