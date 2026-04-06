import { Router, type IRouter } from "express";
import healthRouter from "./health";
import broadcastsRouter from "./broadcasts";
import likesRouter from "./likes";
import usersRouter from "./users";
import followsRouter from "./follows";
import discoveryRouter from "./discovery";

const router: IRouter = Router();

router.use(healthRouter);
router.use(broadcastsRouter);
router.use(likesRouter);
router.use(usersRouter);
router.use(followsRouter);
router.use(discoveryRouter);

export default router;
