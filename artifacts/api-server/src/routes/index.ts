import { Router, type IRouter } from "express";
import healthRouter from "./health";
import channelsRouter from "./channels";
import videosRouter from "./videos";
import statsRouter from "./stats";
import insightsRouter from "./insights";
import playlistRouter from "./playlist";

const router: IRouter = Router();

router.use(healthRouter);
router.use(channelsRouter);
router.use(videosRouter);
router.use(statsRouter);
router.use(insightsRouter);
router.use(playlistRouter);

export default router;
