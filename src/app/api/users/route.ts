import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import User from '@/models/User';
import { hashPassword } from '@/lib/auth';
import { getSession } from '@/lib/auth';
import { z } from 'zod';

const createUserSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  role: z.enum(['admin', 'user']).default('user'),
  department: z.string().optional(),
  designation: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
});

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const department = searchParams.get('department');
  const status = searchParams.get('status');
  const sortBy = searchParams.get('sortBy') || 'name';
  const sortDir = searchParams.get('sortDir') === 'desc' ? -1 : 1;
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '10', 10));

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
      { designation: { $regex: q, $options: 'i' } },
    ];
  }
  if (department && department !== 'all') filter.department = department;
  if (status && status !== 'all') filter.status = status;

  const [items, total, departments] = await Promise.all([
    User.find(filter)
      .select('-password -resetToken -resetTokenExpiry')
      .sort({ [sortBy]: sortDir })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    User.countDocuments(filter),
    User.distinct('department'),
  ]);

  return NextResponse.json({ items, total, page, limit, departments: departments.filter(Boolean) });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session || session.role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createUserSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();
  const existing = await User.findOne({ email: parsed.data.email.toLowerCase() });
  if (existing) {
    return NextResponse.json({ error: 'Email already in use' }, { status: 409 });
  }

  const hashed = await hashPassword(parsed.data.password);
  const user = await User.create({
    name: parsed.data.name,
    email: parsed.data.email.toLowerCase(),
    password: hashed,
    role: parsed.data.role,
    department: parsed.data.department || '',
    designation: parsed.data.designation || '',
    status: parsed.data.status,
  });

  return NextResponse.json({
    item: {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      designation: user.designation,
      status: user.status,
    },
  }, { status: 201 });
}
