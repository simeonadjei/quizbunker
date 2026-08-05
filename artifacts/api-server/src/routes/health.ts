import { Router, type IRouter } from "express";
import { HealthCheckResponse } from "@workspace/api-zod";
import { pool } from "@workspace/db";

const router: IRouter = Router();

router.get("/healthz", async (_req, res) => {
  // Run a trivial DB query so this endpoint keeps Neon awake when pinged by
  // UptimeRobot (or any uptime monitor) every 5 minutes.
  // If the DB is unreachable we still return 200 so Render's own health check
  // doesn't restart the server — we just include the error in the payload.
  let dbOk = true;
  let dbError: string | null = null;
  try {
    const client = await pool.connect();
    await client.query("SELECT 1");
    client.release();
  } catch (err) {
    dbOk = false;
    dbError = (err as Error).message ?? String(err);
  }

  const data = HealthCheckResponse.parse({ status: "ok" });
  res.json({ ...data, db: dbOk ? "ok" : "error", dbError });
});

export default router;
