const mongoose = require('mongoose');

const txnSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    amount: { type: Number, required: true, min: 0 },
    category: { type: String, trim: true, default: 'General' },
    date: { type: Date, required: true },
    description: { type: String, trim: true, default: '' },
    source: { type: String, enum: ['manual', 'ocr', 'pdf'], default: 'manual' },
    receiptFile: { type: String, default: '' }
  },
  { timestamps: true }
);

txnSchema.index({ user: 1, date: -1 });
txnSchema.index({ user: 1, category: 1 });

module.exports = mongoose.model('Transaction', txnSchema);
