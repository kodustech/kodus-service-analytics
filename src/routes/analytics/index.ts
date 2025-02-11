import { Router } from 'express';
import { suggestionsRoutes } from './suggestions.routes';
import { leadTimeRoutes } from './lead-time.routes';
import { pullRequestsRoutes } from './pull-requests.routes';
import { developerRoutes } from './developer.routes';
// import outras rotas quando forem criadas

const router = Router();

router.use('/suggestions', suggestionsRoutes);
router.use('/lead-time', leadTimeRoutes);
router.use('/pull-requests', pullRequestsRoutes);
router.use('/developer', developerRoutes);
// Adicionar outras rotas conforme forem implementadas
// router.use('/developer', developerRoutes);

export const analyticsRoutes = router; 