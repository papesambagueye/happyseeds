import { NextResponse } from 'next/server'

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export function middleware(request: Request) {
  if (!MUTATING_METHODS.has(request.method) || !new URL(request.url).pathname.startsWith('/api/')) {
    return NextResponse.next()
  }

  const origin = request.headers.get('origin')
  if (!origin) return NextResponse.next()

  const url = new URL(request.url)
  if (origin !== url.origin) {
    return NextResponse.json({ success: false, error: 'Origine de requête refusée.' }, { status: 403 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*'],
}