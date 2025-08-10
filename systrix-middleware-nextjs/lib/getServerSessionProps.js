import { getServerSession } from 'next-auth';
import { authOptions } from '../pages/api/auth/[...nextauth]';

export async function getServerSessionProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);
  return { props: { serverSession: session ?? null } };
}