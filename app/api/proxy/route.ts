// app/api/proxy/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const target = searchParams.get('url');

  if (!target) {
    return NextResponse.json(
      { error: 'Missing `url` query parameter' },
      { status: 400 }
    );
  }

  let res;
  try {
    res = await fetch(target, {
      headers: { 'User-Agent': 'VarifyProxy/1.0' },
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Unable to fetch target URL' },
      { status: 502 }
    );
  }

  let html = await res.text();

  // Strip out all <script> tags to prevent cross-origin JS errors
  html = html.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Inject a <base> tag so relative paths resolve correctly
  html = html.replace(
    /<head([^>]*)>/i,
    `<head$1><base href="${target}" />`
  );

  return new Response(html, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'ALLOWALL',
    },
  });
}
