import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { connectDB } from '@/lib/db';
import User from '@/models/User';

export async function GET(req: NextRequest) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const format = searchParams.get('format') === 'csv' ? 'csv' : 'xlsx';
  const q = searchParams.get('q')?.trim();
  const department = searchParams.get('department');
  const status = searchParams.get('status');

  const filter: Record<string, unknown> = {};
  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: 'i' } },
      { email: { $regex: q, $options: 'i' } },
    ];
  }
  if (department && department !== 'all') filter.department = department;
  if (status && status !== 'all') filter.status = status;

  const users = await User.find(filter)
    .select('name email department designation status')
    .sort({ name: 1 })
    .lean();

  const rows = users.map((u) => ({
    Name: u.name,
    Email: u.email,
    Department: u.department || '',
    Designation: u.designation || '',
    Status: u.status,
  }));

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Users');

  if (format === 'csv') {
    const csv = XLSX.utils.sheet_to_csv(worksheet);
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': 'attachment; filename="users.csv"',
      },
    });
  }

  const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="users.xlsx"',
    },
  });
}
