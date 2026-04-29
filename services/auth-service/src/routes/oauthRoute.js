import express from "express";
import passport from "../config/passport.js";
import { googleCallback, googleFailure } from "../controllers/oauthController.js";

const router = express.Router();

router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/api/oauth/google/failure",
    session: false,
  }),
  googleCallback
);

router.get("/google/failure", googleFailure);

export default router;