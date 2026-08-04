import { config } from 'dotenv';
import path from 'path';
config({ path: path.resolve(__dirname, '../.env.local') });

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../src/models/User';

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) throw new Error('MONGO_URI is not set');

  await mongoose.connect(uri);

  const email = process.env.SEED_ADMIN_EMAIL || 'admin@mitraindustries.com';
  const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe123!';

  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`Admin user already exists: ${email}`);
  } else {
    await User.create({
      name: 'Admin',
      email,
      password: await bcrypt.hash(password, 10),
      role: 'admin',
      status: 'active',
    });
    console.log(`Created admin user: ${email} / ${password}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
