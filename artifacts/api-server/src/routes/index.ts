import { Router, type IRouter } from "express";
import healthRouter from "./health";
import newsRouter from "./news";
import socialAuthRouter from "./social-auth";
import socialPublishRouter from "./social-publish";
import socialConnectRouter from "./social-connect";
import userAuthRouter from "./user-auth";

const router: IRouter = Router();

router.use(healthRouter);
router.use(newsRouter);
router.use("/auth", socialAuthRouter);
router.use("/user", userAuthRouter);
router.use("/publish", socialPublishRouter);
router.use("/connect", socialConnectRouter);

export default router;
