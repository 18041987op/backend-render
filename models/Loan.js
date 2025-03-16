import mongoose from 'mongoose';

const LoanSchema = new mongoose.Schema({
  tool: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tool',
    required: true
  },
  technician: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  purpose: {
    type: String,
    required: [true, 'Se debe especificar el propósito del préstamo']
  },
  vehicle: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['active', 'returned', 'transferred'],
    default: 'active'
  },
  borrowedAt: {
    type: Date,
    default: Date.now
  },
  expectedReturn: {
    type: Date,
    required: [true, 'Se debe especificar la fecha de devolución esperada']
  },
  actualReturn: {
    type: Date
  },
  transferHistory: [
    {
      fromTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      toTechnician: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      transferredAt: { type: Date, default: Date.now },
      initiatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      notes: { type: String }
    }
  ]
}, { timestamps: true });

const Loan = mongoose.model('Loan', LoanSchema);
export default Loan;
