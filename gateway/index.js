import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import verifyToken from "./authMiddleware.js";

const app = express();
const port = 3000;

const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => {
    console.warn(`[RATE LIMIT] ${req.ip} terkena rate limit pada ${req.path}`);
    res.status(429).json({
      message: "Terlalu banyak permintaan. Coba lagi dalam 1 menit.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => ipKeyGenerator(req),
  handler: (req, res) => {
    console.warn(`[RATE LIMIT AUTH] ${req.ip} terkena rate limit auth`);
    res.status(429).json({
      message: "Terlalu banyak percobaan login. Coba lagi dalam 1 menit.",
      retryAfter: Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000),
    });
  },
});

app.set("trust proxy", 1);
app.use(globalLimiter);

app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.path}`);
  next();
});

app.use(
  ["/api/auth", "/api/oauth", "/api/user"],
  authLimiter,
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
  }),
);

app.use(
  ["/api/fields", "/api/slots"],
  verifyToken,
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req) => {
        if (!req.user?.id || !req.user?.role) {
          proxyReq.destroy(new Error("Missing user context"));
          return;
        }
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
      },
      error: (err, req, res) => {
        res.status(401).json({ message: "Unauthorized. Invalid token payload." });
      },
    },
  }),
);

app.use(
  ["/api/bookings", "/api/payments", "/api/dashboard"],
  verifyToken,
  createProxyMiddleware({
    target: "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
    on: {
      proxyReq: (proxyReq, req) => {
        if (!req.user?.id || !req.user?.role) {
          proxyReq.destroy(new Error("Missing user context"));
          return;
        }
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
        proxyReq.setHeader("x-internal-key", "ALIT123");
      },
      error: (err, req, res) => {
        res.status(401).json({ message: "Unauthorized. Invalid token payload." });
      },
    },
  }),
);

app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route tidak ditemukan di gateway" });
});

app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});