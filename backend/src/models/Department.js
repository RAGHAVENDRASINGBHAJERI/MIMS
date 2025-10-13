import mongoose from 'mongoose';

const departmentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    unique: true
  },
  type: {
    type: String,
    required: [true, 'Department type is required'],
    enum: {
      values: ['Major', 'Academic', 'Service'],
      message: 'Department type must be Major, Academic, or Service'
    }
  }
}, {
  timestamps: true
});

departmentSchema.index({ type: 1 });

export default mongoose.model('Department', departmentSchema);
