import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { trustedRole } from '@/lib/auth-policy';

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
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
        if (!user?.password) return null;
        const valid = await bcrypt.compare(credentials.password as string, user.password);
        if (!valid) return null;
        const role = trustedRole(user.role);
        return { id: user.id, name: user.name, email: user.email, role };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = trustedRole(user.role);
      } else if (typeof token.id === 'string') {
        // Revoga também permissões presentes em sessões emitidas antes de uma alteração.
        const currentUser = await prisma.user.findUnique({ where: { id: token.id }, select: { role: true } });
        if (!currentUser) return null;
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
