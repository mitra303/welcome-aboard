import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { forgotPasswordSchema } from '@/lib/validation';
import { sendMail } from '@/lib/mail';

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();
  const user = await User.findOne({ email: parsed.data.email.toLowerCase() });

  // Always respond success to avoid leaking which emails are registered.
  if (!user) {
    return NextResponse.json({ ok: true });
  }

  const token = crypto.randomBytes(32).toString('hex');
  user.resetToken = token;
  user.resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000);
  await user.save();

  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`;

  try {
    await sendMail({
      to: [user.email],
      subject: 'Reset your Welcome Aboard password',
      html: `<p>Hello ${user.name},</p><p>Click the link below to reset your password. This link expires in 1 hour.</p><p><a href="${resetUrl}">${resetUrl}</a></p>`,
    });
  } catch (err) {
    console.error('Failed to send reset email', err);
  }

  return NextResponse.json({ ok: true });
}
