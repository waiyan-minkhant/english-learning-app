import "dotenv/config";
import { createServer } from "node:http";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import { Server } from "socket.io";
import { authRouter } from "./modules/auth/routes/auth.routes.js";
import { attachRealtimeServer } from "./modules/realtime/socket/realtime.socket.js";
import { sessionRouter } from "./modules/session/routes/session.routes.js";
import { videoRouter } from "./modules/video/routes/video.routes.js";

const app = express();
const port = Number(process.env.PORT) || 4000;
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";

app.use(express.json());
app.use(cookieParser());
app.use(
  cors({
    origin: frontendUrl,
    credentials: true
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/sessions", sessionRouter);
app.use("/video", videoRouter);

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl,
    credentials: true
  }
});

async function start() {
  await attachRealtimeServer(io);

  httpServer.listen(port, "0.0.0.0", () => {
    console.log(`API listening on port ${port}`);
  });
}

start().catch((err) => {
  console.error("Failed to start API", err);
  process.exit(1);
});
