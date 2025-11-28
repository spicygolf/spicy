import { Database } from "bun:sqlite";
import { betterAuth } from "better-auth";
import { customSession } from "better-auth/plugins";
import { jazzPlugin } from "jazz-tools/better-auth/auth/server";
import { isAdmin } from "../utils/auth";

export const auth = betterAuth({
  appName: "Spicy Golf",
  basePath: `/${process.env.API_VERSION || "v4"}/auth/`,
  database: new Database("./data/auth.db"),
  trustedOrigins: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://0.0.0.0:3040",
  ],
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  socialProviders: {
    // google: {
    //   clientId: process.env.GOOGLE_CLIENT_ID || "a",
    //   clientSecret: process.env.GOOGLE_CLIENT_SECRET || "b",
    // },
    // facebook: {
    //   clientId: process.env.FACEBOOK_CLIENT_ID || "c",
    //   clientSecret: process.env.FACEBOOK_CLIENT_SECRET || "d",
    // },
    // apple: {
    //   clientId: process.env.APPLE_CLIENT_ID || "e",
    //   clientSecret: process.env.APPLE_CLIENT_SECRET || "f",
    // },
  },
  plugins: [
    jazzPlugin(),
    customSession(async ({ user, session }) => {
      return {
        user,
        session: {
          ...session,
          isAdmin: isAdmin(user.email),
        },
      };
    }),
  ],
});
