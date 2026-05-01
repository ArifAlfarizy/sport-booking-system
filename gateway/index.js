import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import verifyToken from "./authMiddleware.js";

const app = express();
const port = 3000;

// DEBUG - log semua request yang masuk
app.use((req, res, next) => {
  console.log(`[GATEWAY] ${req.method} ${req.path}`);
  next();
});

// 3001 - Auth service
app.use(
  ["/api/auth", "/api/oauth"],
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
  }),
);

// 3002 - Field service
app.use(
  ["/api/fields", "/api/slots"],
  verifyToken,
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
      },
    },
  }),
);

// 3003 - Booking service
// 3003 - Booking service
app.use(
  ["/api/bookings", "/api/payments", "/api/dashboard"],
  verifyToken,
  createProxyMiddleware({
    target: "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: (path, req) => {
      console.log(`[BEFORE REWRITE] path: ${path}, originalUrl: ${req.originalUrl}`);
      const rewritten = req.originalUrl;
      console.log(`[AFTER REWRITE] ${rewritten}`);
      return rewritten;
    },
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
        proxyReq.setHeader("x-internal-key", "ALIT123");
      },
    },
  }),
);

// Fallback - tangkap request yang tidak cocok
app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route tidak ditemukan di gateway" });
});

app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});