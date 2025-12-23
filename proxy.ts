import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const ALLOWED_METHODS = 'GET,OPTIONS';
const ALLOWED_HEADERS = 'x-youtube-api-key,content-type';

function applyCorsHeaders(res: NextResponse, origin: string | null) {
    const allowOrigin = origin ?? '*';
    res.headers.set('Access-Control-Allow-Origin', allowOrigin);
    res.headers.set('Access-Control-Allow-Methods', ALLOWED_METHODS);
    res.headers.set('Access-Control-Allow-Headers', ALLOWED_HEADERS);
    res.headers.set('Vary', 'Origin');
    return res;
}

export default function middleware(req: NextRequest) {
    const origin = req.headers.get('origin');

    if (req.method === 'OPTIONS') {
        const preflight = new NextResponse(null, { status: 204 });
        preflight.headers.set('Access-Control-Max-Age', '86400');
        return applyCorsHeaders(preflight, origin);
    }

    const response = NextResponse.next();
    return applyCorsHeaders(response, origin);
}

export const proxy = middleware;

export const config = {
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico).*)',
    ],
};
