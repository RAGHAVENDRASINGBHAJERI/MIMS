import mongoose from 'mongoose';

const assetSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true
  },
  type: {
    type: String,
    enum: ['capital', 'revenue'],
    default: 'capital'
  },
  itemName: {
    type: String,
    required: [true, 'Item name is required'],
    trim: true
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  pricePerItem: {
    type: Number,
    required: [true, 'Price per item is required'],
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    required: true
  },
  vendorName: {
    type: String,
    required: [true, 'Vendor name is required'],
    trim: true
  },
  vendorAddress: {
    type: String,
    required: [true, 'Vendor address is required'],
    trim: true
  },
  contactNumber: {
    type: String,
    required: [true, 'Contact number is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    trim: true,
    lowercase: true
  },
  billNo: {
    type: String,
    required: [true, 'Bill number is required'],
    trim: true
  },
  billDate: {
    type: Date,
    required: [true, 'Bill date is required']
  },
  billFileId: {
    type: mongoose.Schema.Types.ObjectId,
    required: [true, 'Bill file is required']
  }
}, {
  timestamps: true
});

// Calculate total amount before saving
assetSchema.pre('save', function(next) {
  this.totalAmount = this.quantity * this.pricePerItem;
  next();
});

export default mongoose.model('Asset', assetSchema);
