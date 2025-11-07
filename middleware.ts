import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    const authHeader = req.headers.get('authorization');
    const serviceToken = process.env.SERVICE_TOKEN; //
    if (authHeader !== serviceToken) {
        return new NextResponse('Unauthorized, invalid service token', { status: 401 });
    }
    return NextResponse.next();
}
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
