import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { prisma } from "@nq/db/client";

export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: process.env.BETTER_AUTH_SECRET ?? "dev-secret-change-me",
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    minPasswordLength: 6,
  },
  user: {
    additionalFields: {
      role: { type: "string", required: false, defaultValue: "USER", input: false },
      status: { type: "string", required: false, defaultValue: "ACTIVE", input: false },
      displayName: { type: "string", required: false },
      bio: { type: "string", required: false },
      coinBalance: { type: "number", required: false, defaultValue: 0, input: false },
      vipUntil: { type: "date", required: false, input: false },
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 30,
    updateAge: 60 * 60 * 24,
  },
  trustedOrigins: [
    process.env.NEXT_PUBLIC_WEB_URL,
    process.env.NEXT_PUBLIC_ADMIN_URL,
    "tauri://localhost",
    "http://tauri.localhost",
  ].filter((x): x is string => Boolean(x)),
});

export type Session = typeof auth.$Infer.Session;
