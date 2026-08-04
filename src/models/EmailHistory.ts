import { Schema, models, model } from 'mongoose';

export interface IEmailHistory {
  _id: string;
  announcement: Schema.Types.ObjectId;
  recipients: { name: string; email: string }[];
  subject: string;
  status: 'success' | 'failed';
  error?: string;
  sentBy: Schema.Types.ObjectId;
  createdAt: Date;
}

const EmailHistorySchema = new Schema<IEmailHistory>(
  {
    announcement: { type: Schema.Types.ObjectId, ref: 'Announcement', required: true },
    recipients: [{ name: String, email: String }],
    subject: { type: String, required: true },
    status: { type: String, enum: ['success', 'failed'], default: 'success' },
    error: { type: String },
    sentBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);

export default models.EmailHistory || model<IEmailHistory>('EmailHistory', EmailHistorySchema);
