import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(req: NextRequest) {
    const { pathname } = req.nextUrl;
    
    const authHeader = req.headers.get('authorization');
    const serviceToken = process.env.SERVICE_TOKEN; //
    if (authHeader !== serviceToken) {
        return NextResponse.json({
            error: {
                code: 403,
                message: 'Method does not allow unauthorized access.',
                details: {
                    message: 'Please provide a valid service token in the authorization header.',
                    reason: 'FORBIDDEN'
                }
            }
        }, {
            status: 403
        });
    }
    return NextResponse.next();
}
export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
