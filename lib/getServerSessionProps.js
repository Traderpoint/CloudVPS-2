// lib/getServerSessionProps.js
import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function getServerSessionProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  return { props: { serverSession: session } };
}

// Varianta s automatickým přesměrováním pro chráněné stránky
export async function getServerSessionPropsWithRedirect(context, redirectTo = '/login') {
  const session = await getServerSession(context.req, context.res, authOptions);

  if (!session) {
    return {
      redirect: {
        destination: redirectTo,
        permanent: false
      }
    };
  }

  return { props: { serverSession: session } };
}
