import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
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

app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});
