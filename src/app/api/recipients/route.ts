import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Recipient from '@/models/Recipient';
import { z } from 'zod';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const q = searchParams.get('q')?.trim();

  const alwaysEmails = (process.env.MAIL_TO_ALWAYS || '')
    .split(',').map((e) => e.trim().toLowerCase()).filter(Boolean);

  const filter: Record<string, unknown> = {};
  if (alwaysEmails.length) filter.email = { $nin: alwaysEmails };
  if (q) {
    filter.$or = [{ name: { $regex: q, $options: 'i' } }, { email: { $regex: q, $options: 'i' } }];
  }

  const items = await Recipient.find(filter).sort({ name: 1 }).lean();
  return NextResponse.json({ items });
}

const importSchema = z.object({
  recipients: z.array(z.object({ name: z.string().min(1), email: z.string().email() })).min(1),
});

export async function POST(req: NextRequest) {
  const body = await req.json();
  const parsed = importSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  await connectDB();

  const results = await Promise.allSettled(
    parsed.data.recipients.map((r) =>
      Recipient.findOneAndUpdate(
        { email: r.email.toLowerCase() },
        { name: r.name, email: r.email.toLowerCase() },
        { upsert: true, new: true }
      )
    )
  );

  const imported = results.filter((r) => r.status === 'fulfilled').length;
  return NextResponse.json({ imported, total: parsed.data.recipients.length });
}
