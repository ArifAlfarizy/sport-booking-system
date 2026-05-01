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
  ["/api/auth", "/api/oauth", "/api/user"],
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: (path, req) => req.originalUrl,
  }),
);

// 3002 - Field service
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
        res
          .status(401)
          .json({ message: "Unauthorized. Invalid token payload." });
      },
    },
  }),
);

// 3003 - Booking service
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
        res
          .status(401)
          .json({ message: "Unauthorized. Invalid token payload." });
      },
    },
  }),
);

// Fallback
app.use((req, res) => {
  console.log(`[NO MATCH] ${req.method} ${req.path}`);
  res.status(404).json({ message: "Route tidak ditemukan di gateway" });
});

app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});
