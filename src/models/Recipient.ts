import { Schema, models, model } from 'mongoose';

export interface IRecipient {
  _id: string;
  name: string;
  email: string;
  department?: string;
  createdAt: Date;
}

const RecipientSchema = new Schema<IRecipient>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    department: { type: String },
  },
  { timestamps: true }
);

export default models.Recipient || model<IRecipient>('Recipient', RecipientSchema);
