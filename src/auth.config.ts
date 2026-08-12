import type { NextAuthConfig } from "next-auth";

export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isOnBoards = request.nextUrl.pathname.startsWith("/boards");

      if (isOnBoards && !isLoggedIn) {
        return false; // redirects to signIn page automatically
      }
      return true;
    },
  },
  providers: [], // filled in by the full config
};