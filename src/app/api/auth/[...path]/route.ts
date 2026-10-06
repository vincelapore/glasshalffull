import { auth } from "@/lib/auth/server";
import { withHttpCookies } from "@/lib/auth/http-cookies";

const handler = auth.handler();

function wrap(
  method: (request: Request, context: { params: Promise<{ path: string[] }> }) => Promise<Response>
) {
  return async (
    request: Request,
    context: { params: Promise<{ path: string[] }> }
  ) => withHttpCookies(request, await method(request, context));
}

export const GET = wrap(handler.GET);
export const POST = wrap(handler.POST);
export const PUT = wrap(handler.PUT);
export const DELETE = wrap(handler.DELETE);
export const PATCH = wrap(handler.PATCH);
