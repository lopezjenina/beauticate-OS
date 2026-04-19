// src/app/api/admin/create-user/route.ts
import { createClient } from '@supabase/supabase-js'

export async function DELETE(req: Request) {
    // Defer client creation until runtime to prevent build errors when SUPABASE_SERVICE_ROLE_KEY is missing
    const adminClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    // In production, implement real server-side session check 
    // to verify caller has the 'superadmin' role. 
    // Example: verify token against auth.getUser() or Next.js proxy
    
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId');

    if (!userId) {
        return new Response('User ID required', { status: 400 });
    }

    try {
        const { error } = await adminClient.auth.admin.deleteUser(userId);
        if (error) throw error;
        return new Response('User deleted', { status: 200 });
    } catch (err: any) {
        return new Response(err.message, { status: 500 });
    }
}
