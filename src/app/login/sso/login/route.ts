import { NextRequest, NextResponse } from 'next/server'; // NextResponse used in redirect()
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword, signSession, setSessionCookie } from '@/lib/auth';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://14.99.235.114:8035';
const DEFAULT_SSO_PASSWORD = 'Employee@1234';

function redirect(path: string) {
  return NextResponse.redirect(`${APP_URL}${path}`);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');

  if (!token) {
    return redirect('/login?error=missing_token');
  }

  const mainAppUrl = process.env.SSO_MAIN_APP_URL || 'http://14.99.235.114:8016';

  let userData: {
    user: {
      email: string;
      full_name: string;
      department?: { name: string };
      role?: { name: string };
      is_active: boolean;
    };
    password?: string;
  };

  try {
    const res = await fetch(`${mainAppUrl}/accounts/auth-subapp/?app_name=Onboarding-Portal`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      return redirect('/login?error=sso_unauthorized');
    }

    userData = await res.json();
  } catch {
    return redirect('/login?error=sso_unreachable');
  }

  const email = userData.user.email?.toLowerCase();
  const name = userData.user.full_name || email;
  const department = userData.user.department?.name || '';
  const isActive = userData.user.is_active !== false;

  if (!email) {
    return redirect('/login?error=sso_no_email');
  }

  await connectDB();

  let user = await User.findOne({ email });

  if (!user) {
    const hashed = await hashPassword(DEFAULT_SSO_PASSWORD);
    user = await User.create({
      name,
      email,
      password: hashed,
      role: 'user',
      department,
      status: isActive ? 'active' : 'inactive',
    });
  } else if (user.status !== 'active') {
    return redirect('/login?error=account_inactive');
  }

  const sessionToken = signSession({
    userId: user._id.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  });
  await setSessionCookie(sessionToken);

  return redirect('/dashboard');
}
