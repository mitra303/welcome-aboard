import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

const birthdayRegex = /^\d{4}-\d{2}-\d{2}$/;

export const announcementSchema = z.object({
  employeeName: z.string().min(1, 'Employee name is required'),
  designation: z.string().min(1, 'Designation is required'),
  department: z.string().min(1, 'Department is required'),
  reportingManager: z.string().min(1, 'Reporting manager is required'),
  officeLocation: z.string().min(1, 'Office location is required'),
  qualification: z.string().min(1, 'Highest qualification is required'),
  university: z.string().min(1, 'Field of study is required'),
  bio: z.string().optional().default(''),
  birthday: z.string().regex(birthdayRegex, 'Birthday must be a valid date (YYYY-MM-DD)'),
  officialEmail: z.string().email('Enter a valid official email'),
  gender: z.enum(['male', 'female']).default('male'),
  imageUrl: z.string().optional(),
});

export type AnnouncementInput = z.infer<typeof announcementSchema>;

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
export const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
