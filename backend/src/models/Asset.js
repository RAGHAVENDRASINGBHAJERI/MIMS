import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  particulars: { type: String, trim: true },
  quantity: { type: Number, min: [0, 'Quantity cannot be negative'] },
  rate: { type: Number, min: [0, 'Rate cannot be negative'] },
  cgst: { type: Number, default: 0, min: [0, 'CGST cannot be negative'] },
  sgst: { type: Number, default: 0, min: [0, 'SGST cannot be negative'] },
  amount: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 }
}, { _id: false });

const assetSchema = new mongoose.Schema({
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: [true, 'Department is required']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    trim: true,
    enum: {
      values: ['capital', 'revenue', 'consumable'],
      message: 'Category must be capital, revenue, or consumable'
    }
  },
  type: {
    type: String,
    enum: ['capital', 'revenue', 'consumable'],
    default: 'capital'
  },
  // Legacy single-item fields (kept for backward compatibility)
  itemName: {
    type: String,
    trim: true
  },
  quantity: {
    type: Number,
    min: [0, 'Quantity cannot be negative']
  },
  pricePerItem: {
    type: Number,
    min: [0, 'Price cannot be negative']
  },
  totalAmount: {
    type: Number,
    default: 0
  },
  // Multi-item support
  items: {
    type: [itemSchema],
    default: []
  },
  // Support vendor field while keeping legacy vendorName compatibility
  vendor: {
    type: String,
    trim: true
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
  },
  collegeISRNo: {
    type: String,
    trim: true
  },
  itISRNo: {
    type: String,
    trim: true
  },
  igst: {
    type: Number,
    default: 0,
    min: [0, 'IGST cannot be negative']
  },
  cgst: {
    type: Number,
    default: 0,
    min: [0, 'CGST cannot be negative']
  },
  sgst: {
    type: Number,
    default: 0,
    min: [0, 'SGST cannot be negative']
  },
  grandTotal: {
    type: Number,
    default: 0
  },
  remark: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Calculate totals before saving
assetSchema.pre('save', function(next) {
  // Keep vendor and vendorName in sync
  if (!this.vendor && this.vendorName) {
    this.vendor = this.vendorName;
  }
  if (!this.vendorName && this.vendor) {
    this.vendorName = this.vendor;
  }

  if (Array.isArray(this.items) && this.items.length > 0) {
    // Ensure each item has derived totals
    this.items = this.items.map((item) => {
      const amount = (Number(item.quantity) || 0) * (Number(item.rate) || 0);
      const tax = amount * ((Number(item.cgst) || 0) + (Number(item.sgst) || 0)) / 100;
      return {
        ...item.toObject ? item.toObject() : item,
        amount,
        grandTotal: amount + tax
      };
    });
    this.totalAmount = this.items.reduce((sum, it) => sum + (Number(it.amount) || 0), 0);
    if (!this.grandTotal) {
      this.grandTotal = this.items.reduce((sum, it) => sum + (Number(it.grandTotal) || 0), 0);
    }
  } else if (this.quantity != null && this.pricePerItem != null) {
    this.totalAmount = (Number(this.quantity) || 0) * (Number(this.pricePerItem) || 0);
  }
  next();
});

export default mongoose.model('Asset', assetSchema);
