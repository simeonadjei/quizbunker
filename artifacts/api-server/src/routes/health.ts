import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/healthz", (_req, res) => {
  // Returns 200 immediately — no DB query.
  // This keeps Render's free tier from spinning down (UptimeRobot pings here
  // every 5 minutes) without consuming any Neon network transfer quota.
  // Hitting Neon on every health-check exhausted the 5 GB/month free-tier
  // transfer limit in under 5 days (288 SELECT 1 queries/day via the proxy).
  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, db: "unchecked" });
});

export default router;
