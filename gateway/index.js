import express from "express";
import { createProxyMiddleware } from "http-proxy-middleware";
const app = express();
const port = 3000;

// API Gateway mengarahkan permintaan ke service1
app.use(
  "/service1",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/service1": "", // Menghapus '/service1' dari URL untuk diteruskan ke Service1
    },
  }),
);

// API Gateway mengarahkan permintaan ke service2
app.use(
  "/service2",
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
      "^/service2": "", // Menghapus '/service2' dari URL untuk diteruskan ke Service2
    },
  }),
);
app.listen(port, () => {
  console.log(`API Gateway berjalan pada port ${port}`);
});
