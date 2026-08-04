import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import Announcement from '@/models/Announcement';
import EmailHistory from '@/models/EmailHistory';
import { getSession } from '@/lib/auth';
import { sendMail } from '@/lib/mail';
import { getWelcomeCardHtml, getNameTitle } from '@/lib/template';
import { z } from 'zod';

const sendSchema = z.object({
  recipients: z.array(z.object({ name: z.string(), email: z.string().email() })).default([]),
});

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();
  const announcement = await Announcement.findById(params.id);
  if (!announcement) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  if (announcement.status === 'sent') {
    return NextResponse.json({ error: 'This announcement has already been sent' }, { status: 400 });
  }

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || '';
  const imageSrc = announcement.imageUrl
    ? `${appUrl}${announcement.imageUrl}`
    : `${appUrl}/avatar-placeholder.svg`;

  const html = getWelcomeCardHtml(
    {
      employeeName: announcement.employeeName,
      designation: announcement.designation,
      department: announcement.department,
      reportingManager: announcement.reportingManager,
      officeLocation: announcement.officeLocation,
      qualification: announcement.qualification,
      university: announcement.university,
      bio: announcement.bio,
      birthday: announcement.birthday,
      officialEmail: announcement.officialEmail,
      gender: announcement.gender,
    },
    imageSrc,
    appUrl
  );

  const title = getNameTitle(announcement.gender);
  const subject = `A Warm Welcome to the Mitra Family – ${title} ${announcement.employeeName}`;
  const recipientEmails = parsed.data.recipients.map((r) => r.email);

  try {
    await sendMail({ to: recipientEmails, subject, html });

    announcement.status = 'sent';
    announcement.recipients = parsed.data.recipients;
    announcement.sentAt = new Date();
    await announcement.save();

    await EmailHistory.create({
      announcement: announcement._id,
      recipients: parsed.data.recipients,
      subject,
      status: 'success',
      sentBy: session.userId,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    await EmailHistory.create({
      announcement: announcement._id,
      recipients: parsed.data.recipients,
      subject,
      status: 'failed',
      error: err instanceof Error ? err.message : 'Unknown error',
      sentBy: session.userId,
    });
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
    //  return NextResponse.json(
    //     {
    //       error: err instanceof Error ? err.message : "Unknown error",
    //     },
    //     { status: 500 }
    //   );
  }
}
