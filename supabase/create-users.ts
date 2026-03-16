/**
 * One-time script to create Supabase Auth accounts + profiles for all team members.
 * Run with: npx tsx supabase/create-users.ts
 *
 * Each user gets a temporary password they should change after first login
 * via Settings → Security tab.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { resolve } from 'path';

dotenv.config({ path: resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const TEMP_PASSWORD = 'ViralVision2026!';

const TEAM = [
  // Admins
  { email: 'angelguerrero1999@gmail.com', name: 'Angel',    role: 'admin'  },
  { email: 'viralvisionmk@gmail.com',     name: 'Santiago', role: 'admin'  },
  { email: 'jeninalopezz@gmail.com',       name: 'Jenina',   role: 'admin'  },
  // Editors
  { email: 'storres1524@gmail.com',        name: 'Sergio',   role: 'editor' },
  { email: 'jrbp.contato@gmail.com',       name: 'Rodrigo',  role: 'editor' },
  { email: 'alex10soccer2@gmail.com',      name: 'Alex',     role: 'editor' },
  { email: 'ariech0608@gmail.com',         name: 'Araceli',  role: 'editor' },
  // Social
  { email: 'guidostorchdesign@gmail.com',  name: 'Guido',    role: 'social' },
];

async function run() {
  console.log(`\nCreating ${TEAM.length} team accounts...\n`);

  for (const member of TEAM) {
    process.stdout.write(`  ${member.name.padEnd(10)} (${member.role.padEnd(6)})  ${member.email} ... `);

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: member.email,
      password: TEMP_PASSWORD,
      email_confirm: true,     // skip confirmation email — accounts are active immediately
      user_metadata: { name: member.name, role: member.role },
    });

    if (authError) {
      if (authError.message.includes('already been registered') || authError.message.includes('already exists')) {
        console.log('⚠  already exists — skipped');
      } else {
        console.log(`✗  ${authError.message}`);
      }
      continue;
    }

    const userId = authData.user.id;

    // 2. Upsert profile
    const { error: profileError } = await supabase.from('profiles').upsert({
      id: userId,
      email: member.email,
      name: member.name,
      role: member.role,
      is_active: true,
      avatar: null,
    }, { onConflict: 'id' });

    if (profileError) {
      console.log(`✗  profile error: ${profileError.message}`);
    } else {
      console.log('✓  created');
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  All done!

  Temporary password for all accounts:
  ${TEMP_PASSWORD}

  Share each person their email + this password.
  They can change it after login:
  Sidebar → gear icon → Security → Change password
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

run().catch(console.error);
