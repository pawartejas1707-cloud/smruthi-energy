import mongoose, { Schema, Document } from 'mongoose';

export type UserRole = 'plant_admin' | 'electrical_admin' | 'viewer' | 'reading_operator';

export interface IUser extends Document {
  email: string;
  password?: string;
  fullName: string;
  role: UserRole;
  department: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String },
    fullName: { type: String, required: true },
    role: {
      type: String,
      enum: ['plant_admin', 'electrical_admin', 'viewer', 'reading_operator'],
      default: 'electrical_admin',
    },
    department: { type: String, default: 'Electrical Department' },
  },
  { timestamps: true }
);

export const UserModel = mongoose.model<IUser>('User', UserSchema);
