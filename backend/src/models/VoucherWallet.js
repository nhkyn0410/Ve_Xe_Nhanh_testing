const mongoose = require('mongoose');

/**
 * Voucher wallet item saved by a customer.
 * The voucher rules remain owned by Voucher; this document only tracks that a
 * customer saved/used/removed a voucher from their wallet.
 */
const VoucherWalletSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    voucherId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Voucher',
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['saved', 'used', 'expired', 'removed'],
      default: 'saved',
      index: true,
    },
    savedAt: {
      type: Date,
      default: Date.now,
    },
    usedAt: {
      type: Date,
    },
    removedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

VoucherWalletSchema.index({ customerId: 1, voucherId: 1 }, { unique: true });
VoucherWalletSchema.index({ customerId: 1, status: 1, updatedAt: -1 });

const VoucherWallet = mongoose.model('VoucherWallet', VoucherWalletSchema);

module.exports = VoucherWallet;
