import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  recipient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['info', 'warning', 'error'],
    default: 'info'
  },
  read: {
    type: Boolean,
    default: false
  },
  relatedTo: {
    model: { type: String },
    id: { type: mongoose.Schema.Types.ObjectId }
  }
}, { timestamps: true });

const Notification = mongoose.model('Notification', NotificationSchema);
export default Notification;
