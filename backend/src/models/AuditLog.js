import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    enum: ['CREATE', 'UPDATE', 'DELETE']
  },
  entityType: {
    type: String,
    required: true,
    enum: ['ASSET', 'USER', 'DEPARTMENT', 'ASSET_ITEM']
  },
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  officerName: {
    type: String
  },
  oldData: {
    type: mongoose.Schema.Types.Mixed
  },
  newData: {
    type: mongoose.Schema.Types.Mixed
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

export default mongoose.model('AuditLog', auditLogSchema);