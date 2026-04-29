import passport from "passport";
import db from "../config/db.js";
import { Strategy as GoogleStrategy } from "passport-google-oauth20"

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL, 
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const email = profile.emails[0].value;
        const name = profile.displayName;
        const photo = profile.photos?.[0]?.value || null;
        const oauth_id = profile.id;
        const oauth_provider = "google";

        // Cek user sudah ada atau belum
        const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);

        if (rows.length > 0) {
          const user = rows[0];

          if (!user.oauth_id) {
            await db.query(
              "UPDATE users SET oauth_provider = ?, oauth_id = ?, photo = ? WHERE id = ?",
              [oauth_provider, oauth_id, photo, user.id]
            );
          }

          return done(null, { ...user, oauth_id, oauth_provider });
        }

        // Buat user baru
        const [result] = await db.query(
          "INSERT INTO users (name, email, photo, oauth_provider, oauth_id) VALUES (?, ?, ?, ?, ?)",
          [name, email, photo, oauth_provider, oauth_id]
        );

        const [newUser] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);

        return done(null, newUser[0]);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);


passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));

export default passport;