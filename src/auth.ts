import NextAuth, { CredentialsSignin } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isEmailVerificationEnabled } from "@/lib/config";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import authConfig from "./auth.config";

class RateLimitedError extends CredentialsSignin {
  code = "RateLimitExceeded";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  providers: [
    ...authConfig.providers.filter((p) => {
      const id = typeof p === "function" ? undefined : p.id;
      return id !== "credentials";
    }),
    Credentials({
      credentials: {
        email: {},
        password: {},
      },
      async authorize(credentials, request) {
        const email = typeof credentials?.email === "string" ? credentials.email.trim().toLowerCase() : "";
        const password = typeof credentials?.password === "string" ? credentials.password : "";
        if (!email || !password) return null;

        const ip = getClientIp(request);
        const rl = await checkRateLimit("login", `${ip}:${email}`);
        if (!rl.success) {
          throw new RateLimitedError();
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user?.password) return null;

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) return null;

        if (isEmailVerificationEnabled() && !user.emailVerified) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        const u = await prisma.user.findUnique({
          where: { id: user.id },
          select: { passwordChangedAt: true },
        });
        if (u) token.pwAt = u.passwordChangedAt.getTime();
      }
      return token;
    },
    async session({ session, token }) {
      if (typeof token.id !== "string" || !session.user) return session;

      const u = await prisma.user.findUnique({
        where: { id: token.id },
        select: { passwordChangedAt: true },
      });

      // Invalidate the session if the user was deleted, the token predates this
      // tracking field (forces a one-time re-login on deploy), or the password
      // has been changed since this token was issued.
      if (
        !u ||
        typeof token.pwAt !== "number" ||
        u.passwordChangedAt.getTime() > token.pwAt
      ) {
        return { ...session, user: { ...session.user, id: undefined as unknown as string } };
      }

      session.user.id = token.id;
      return session;
    },
  },
});
