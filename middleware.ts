import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Define updateSession function directly in this file
async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          // Use try-catch to handle potential Headers read-only errors
          try {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          } catch (error) {
            // If the request cookies are immutable, you may need to handle this case
            // For example, by redirecting the user or returning a specific response
            console.error("Error setting cookies in middleware:", error);
            // Potentially return an error response or redirect here
            // For now, we'll let it proceed but log the error
          }
        },
      },
    }
  );

  // refreshing the auth token, this also applies the cookies
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Export the middleware function that calls updateSession
export async function middleware(request: NextRequest) {
  return await updateSession(request);
}

// Export the config for the middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};