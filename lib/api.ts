import { currentUser } from './auth';
import { ZodError } from 'zod';
export class ApiError extends Error { constructor(message: string, public status = 400) { super(message); } }
export async function account(request?: Request) {
  if (request && !['GET','HEAD'].includes(request.method)) {
    const origin = request.headers.get('origin');
    const allowed = process.env.APP_URL || new URL(request.url).origin;
    if (!origin || origin !== allowed) throw new ApiError('Please refresh this page and try again.', 403);
  }
  const user = await currentUser();
  if (!user) throw new ApiError('Sign in to save your binder online.', 401);
  return user;
}
export async function jsonBody(request: Request) {
  if (Number(request.headers.get('content-length')) > 4200000) throw new ApiError('This upload is too large.',413);
  const text = await request.text();
  if (text.length > 4200000) throw new ApiError('This upload is too large.',413);
  try { return JSON.parse(text); } catch { throw new ApiError('That request could not be read.'); }
}
export function failure(error: unknown) {
  if (error instanceof ApiError) return Response.json({error:error.message},{status:error.status});
  if (error instanceof ZodError) return Response.json({error:'Check the name, image, and other details.'},{status:400});
  console.error('Binder request failed',error instanceof Error ? error.message : 'unknown error');
  return Response.json({error:'Could not save right now. Your changes have not been saved. Try again.'},{status:500});
}
