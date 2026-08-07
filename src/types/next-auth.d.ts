import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface User {
    username: string;
    role: "AGENT" | "ADMIN";
  }

  interface Session {
    user: {
      id: string;
      username: string;
      role: "AGENT" | "ADMIN";
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "AGENT" | "ADMIN";
    username?: string;
  }
}
