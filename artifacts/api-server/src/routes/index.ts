import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import questionsRouter from "./questions";
import quizRouter from "./quiz";
import songsRouter from "./songs";
import paymentsRouter from "./payments";
import adminRouter from "./admin";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(questionsRouter);
router.use(quizRouter);
router.use(songsRouter);
router.use(paymentsRouter);
router.use(adminRouter);

export default router;
