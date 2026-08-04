import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Announcement from '@/models/Announcement';
import { announcementSchema } from '@/lib/validation';

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const item = await Announcement.findById(params.id).lean();
  if (!item) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ item });
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const existing = await Announcement.findById(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'sent') {
    return NextResponse.json({ error: 'Sent announcements cannot be edited' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = announcementSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  Object.assign(existing, parsed.data, { officialEmail: parsed.data.officialEmail.toLowerCase() });
  await existing.save();

  return NextResponse.json({ item: existing });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  await connectDB();
  const existing = await Announcement.findById(params.id);
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (existing.status === 'sent') {
    return NextResponse.json({ error: 'Sent announcements cannot be deleted' }, { status: 400 });
  }
  await existing.deleteOne();
  return NextResponse.json({ ok: true });
}
