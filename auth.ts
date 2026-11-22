import NextAuth, { CredentialsSignin } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import { trustedRole } from '@/lib/auth-policy';
import {
  authenticateCredentials,
  sessionVersionMatches,
  LoginAreaMismatchError,
} from '@/lib/auth-credentials';

class AreaSignInError extends CredentialsSignin {
  code = 'area_incorreta';
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  adapter: PrismaAdapter(prisma),
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'E-mail ou usuário', type: 'text' },
        password: { label: 'Senha', type: 'password' },
        expectedRole: { label: 'Área selecionada', type: 'text' },
      },
      async authorize(credentials) {
        let user;
        try {
          user = await authenticateCredentials(credentials ?? {}, (lookup) =>
            prisma.user.findMany({
              where:
                lookup.kind === 'email'
                  ? { email: { equals: lookup.value, mode: 'insensitive' } }
                  : { username: { equals: lookup.value, mode: 'insensitive' } },
              take: 2,
              select: {
                id: true,
                name: true,
                email: true,
                password: true,
                role: true,
                authVersion: true,
              },
            }),
          );
        } catch (error) {
          if (error instanceof LoginAreaMismatchError)
            throw new AreaSignInError();
          throw error;
        }
        if (!user) return null;
        const role = trustedRole(user.role);
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role,
          authVersion: user.authVersion,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = trustedRole(user.role);
        token.authVersion = user.authVersion ?? 0;
      } else if (typeof token.id === 'string') {
        // Revoga também permissões presentes em sessões emitidas antes de uma alteração.
        const currentUser = await prisma.user.findUnique({
          where: { id: token.id },
          select: { role: true, authVersion: true },
        });
        if (
          !currentUser ||
          !sessionVersionMatches(token.authVersion, currentUser.authVersion)
        )
          return null;
        token.role = trustedRole(currentUser.role);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        session.user.role = trustedRole(token.role as string);
      }
      return session;
    },
  },
});
