import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Announcement from '@/models/Announcement';
import { announcementSchema } from '@/lib/validation';
import { getSession } from '@/lib/auth';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();
  const status = searchParams.get('status');
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10));
  const limit = Math.min(50, parseInt(searchParams.get('limit') || '10', 10));

  const filter: Record<string, unknown> = {};
  if (status && status !== 'all') filter.status = status;
  if (q) {
    filter.$or = [
      { employeeName: { $regex: q, $options: 'i' } },
      { department: { $regex: q, $options: 'i' } },
      { designation: { $regex: q, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    Announcement.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Announcement.countDocuments(filter),
  ]);

  return NextResponse.json({ items, total, page, limit });
}

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  const existing = await Announcement.findOne({
    officialEmail: parsed.data.officialEmail.toLowerCase(),
    status: { $ne: 'draft' },
  });
  if (existing) {
    return NextResponse.json(
      { error: 'An announcement has already been sent for this employee email.' },
      { status: 409 }
    );
  }

  const announcement = await Announcement.create({
    ...parsed.data,
    officialEmail: parsed.data.officialEmail.toLowerCase(),
    createdBy: session.userId,
    status: 'draft',
  });

  return NextResponse.json({ item: announcement }, { status: 201 });
}
