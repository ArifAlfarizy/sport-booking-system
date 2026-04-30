import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
import verifyToken from "./authMiddleware.js";
const app = express();
const port = 3000;

app.use(
  "/auth",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: (path) => `/auth${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        console.log(
          `[PROXY] ${req.method} ${req.originalUrl} → ${proxyReq.path}`,
        );
      },
    },
  }),
);

app.use(
  "/",
  verifyToken,
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: (path) => `/${path}`,
    on: {
      proxyReq: (proxyReq, req) => {
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
      },
    },
  }),
);

app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});
