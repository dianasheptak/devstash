import NextAuth from "next-auth";
import authConfig from "./auth.config";

const { auth } = NextAuth(authConfig);

export const proxy = auth;

export const config = {
  matcher: ["/dashboard/:path*", "/items/:path*", "/collections/:path*", "/upgrade/:path*", "/settings/:path*"],
};
