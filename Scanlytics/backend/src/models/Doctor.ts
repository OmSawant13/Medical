import mongoose, { Document, Schema } from 'mongoose';

export interface IDoctor extends Document {
  userId: mongoose.Types.ObjectId;
  doctorId: string;
  specialization: string[];
  licenseNumber: string;
  experience: number;
  qualifications: string[];
  availability: {
    days: string[];
    startTime: string;
    endTime: string;
  };
  performanceMetrics: {
    totalConsultations: number;
    averageRating: number;
    totalReviews: number;
  };
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const doctorSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: String,
    unique: true,
    required: true
  },
  specialization: [String],
  licenseNumber: {
    type: String,
    required: true
  },
  experience: {
    type: Number,
    required: true
  },
  qualifications: [String],
  availability: {
    days: [String],
    startTime: String,
    endTime: String
  },
  performanceMetrics: {
    totalConsultations: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 }
  },
  isVerified: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

export default mongoose.model<IDoctor>('Doctor', doctorSchema);
