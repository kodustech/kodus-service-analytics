import { Router } from "express";
import { developerProductivityRoutes } from "./developer-productivity.routes";
import { codeHealthRoutes } from "./code-health.routes";
import { cockpitValidationRoutes } from "./cockpit-validation.routes";

const router = Router();

router.use("/productivity", developerProductivityRoutes);
router.use("/code-health", codeHealthRoutes);
router.use("/cockpit", cockpitValidationRoutes);

export const analyticsRoutes = router;
