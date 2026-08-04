import nodemailer from 'nodemailer';

export function getTransporter() {
  return nodemailer.createTransport({
    host: process.env.MAIL_HOST || 'smtp.office365.com',
    port: Number(process.env.MAIL_PORT) || 587,
    secure: false,
    requireTLS: true,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });
}

export async function sendMail(opts: {
  to: string[];
  subject: string;
  html: string;
  attachments?: { filename: string; path: string; cid?: string }[];
}) {
  const transporter = getTransporter();
  const alwaysTo = process.env.MAIL_TO_ALWAYS
    ? process.env.MAIL_TO_ALWAYS.split(',').map((e) => e.trim()).filter(Boolean)
    : [];
  const toList = Array.from(new Set([...opts.to, ...alwaysTo]));
  return transporter.sendMail({
    from: `"MITRA" <${process.env.MAIL_USER}>`,
    to: toList.join(', '),
    subject: opts.subject,
    html: opts.html,
    attachments: opts.attachments,
  });
}
