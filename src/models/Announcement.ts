import { Schema, models, model } from 'mongoose';

export interface IAnnouncement {
  _id: string;
  employeeName: string;
  designation: string;
  department: string;
  reportingManager: string;
  officeLocation: string;
  qualification: string;
  university: string;
  bio?: string;
  birthday: string;
  officialEmail: string;
  mobileNumber?: string;
  gender: 'male' | 'female';
  imageUrl?: string;
  status: 'draft' | 'sent';
  createdBy: Schema.Types.ObjectId;
  recipients: { name: string; email: string }[];
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema<IAnnouncement>(
  {
    employeeName: { type: String, required: true },
    designation: { type: String, required: true },
    department: { type: String, required: true },
    reportingManager: { type: String, required: true },
    officeLocation: { type: String, required: true },
    qualification: { type: String, required: true },
    university: { type: String, required: true },
    bio: { type: String },
    birthday: { type: String, required: true },
    officialEmail: { type: String, required: true },
    mobileNumber: { type: String },
    gender: { type: String, enum: ['male', 'female'], default: 'male' },
    imageUrl: { type: String },
    status: { type: String, enum: ['draft', 'sent'], default: 'draft' },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    recipients: [{ name: String, email: String }],
    sentAt: { type: Date },
  },
  { timestamps: true }
);

export default models.Announcement || model<IAnnouncement>('Announcement', AnnouncementSchema);
