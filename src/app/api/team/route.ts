import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseServer';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized. Check server environment variables.' },
        { status: 500 }
      );
    }

    // 1. Fetch profiles
    const { data: profiles, error: profileErr } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: true });

    if (profileErr) {
      return NextResponse.json({ error: profileErr.message }, { status: 500 });
    }

    // 2. Fetch auth users to get emails
    const { data: authData, error: authErr } = await supabaseAdmin.auth.admin.listUsers({
      perPage: 1000,
    });

    const emailMap = new Map<string, string>();
    if (!authErr && authData?.users) {
      authData.users.forEach(u => {
        if (u.id && u.email) {
          emailMap.set(u.id, u.email);
        }
      });
    }

    // 3. Fetch lead counts per profile
    const { data: leads, error: leadErr } = await supabaseAdmin
      .from('leads')
      .select('id, assigned_to');

    const leadCountMap = new Map<string, number>();
    if (!leadErr && leads) {
      leads.forEach(l => {
        if (l.assigned_to) {
          leadCountMap.set(l.assigned_to, (leadCountMap.get(l.assigned_to) || 0) + 1);
        }
      });
    }

    // Combine profile data with email & lead counts
    const members = (profiles || []).map(p => ({
      id: p.id,
      full_name: p.full_name || 'Team Member',
      email: emailMap.get(p.id) || '',
      role: p.role || 'executive',
      is_active: p.is_active !== false,
      created_at: p.created_at,
      lead_count: leadCountMap.get(p.id) || 0,
    }));

    return NextResponse.json({ members });
  } catch (err: any) {
    console.error('Error fetching team members:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized. Check server environment variables.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { email, password, full_name, role } = body;

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters long' }, { status: 400 });
    }

    const assignedRole = role === 'admin' ? 'admin' : 'executive';
    const cleanName = (full_name || email.split('@')[0] || 'Executive').trim();

    // 1. Create auth user with pre-confirmed email
    const { data: userData, error: createErr } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      email_confirm: true,
      user_metadata: {
        full_name: cleanName,
        role: assignedRole,
      },
    });

    if (createErr) {
      return NextResponse.json({ error: createErr.message }, { status: 400 });
    }

    if (!userData.user) {
      return NextResponse.json({ error: 'Failed to create user' }, { status: 500 });
    }

    const newUserId = userData.user.id;

    // 2. Ensure profile exists and has correct role and active status
    const { error: profileErr } = await supabaseAdmin.from('profiles').upsert(
      {
        id: newUserId,
        full_name: cleanName,
        role: assignedRole,
        is_active: true,
      },
      { onConflict: 'id' }
    );

    if (profileErr) {
      console.error('Error creating profile for child user:', profileErr);
    }

    return NextResponse.json({
      success: true,
      user: {
        id: newUserId,
        email: email.trim().toLowerCase(),
        full_name: cleanName,
        role: assignedRole,
        is_active: true,
        lead_count: 0,
      },
    });
  } catch (err: any) {
    console.error('Error creating child user:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { userId, action, isActive, newPassword, newRole, fullName } = body;

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    if (action === 'toggle_active') {
      const activeState = Boolean(isActive);
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ is_active: activeState })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, is_active: activeState });
    }

    if (action === 'change_password') {
      if (!newPassword || newPassword.length < 6) {
        return NextResponse.json(
          { error: 'Password must be at least 6 characters' },
          { status: 400 }
        );
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    if (action === 'change_role') {
      const roleVal = newRole === 'admin' ? 'admin' : 'executive';
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ role: roleVal })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, role: roleVal });
    }

    if (action === 'update_profile') {
      const { error } = await supabaseAdmin
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', userId);

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, full_name: fullName });
    }

    return NextResponse.json({ error: 'Invalid action specified' }, { status: 400 });
  } catch (err: any) {
    console.error('Error updating user:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client not initialized' },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const reassignTo = searchParams.get('reassignTo');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // 1. Reassign leads if requested, or set to null/reassign
    if (reassignTo) {
      await supabaseAdmin
        .from('leads')
        .update({ assigned_to: reassignTo })
        .eq('assigned_to', userId);
    } else {
      await supabaseAdmin
        .from('leads')
        .update({ assigned_to: null })
        .eq('assigned_to', userId);
    }

    // 2. Delete profile
    await supabaseAdmin.from('profiles').delete().eq('id', userId);

    // 3. Delete auth user
    const { error: authErr } = await supabaseAdmin.auth.admin.deleteUser(userId);
    if (authErr) {
      return NextResponse.json({ error: authErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error deleting user:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}
