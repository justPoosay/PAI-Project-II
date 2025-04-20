import { inferAdditionalFields } from 'better-auth/client/plugins';
import { createAuthClient } from 'better-auth/vue';
import type { Auth } from 'common';

export const { signIn, signOut, useSession, getSession } = createAuthClient({
  basePath: '/api/auth',
  plugins: [inferAdditionalFields<Auth>()]
});
