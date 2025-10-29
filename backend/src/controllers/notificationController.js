import Notification from '../models/Notification.js';

// Get user notifications
export const getUserNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(50);
    
    res.json({ success: true, data: notifications });
  } catch (error) {
    next(error);
  }
};

// Mark notification as read
export const markAsRead = async (req, res, next) => {
  try {
    await Notification.findByIdAndUpdate(req.params.id, { isRead: true });
    res.json({ success: true, message: 'Notification marked as read' });
  } catch (error) {
    next(error);
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res, next) => {
  try {
    await Notification.updateMany(
      { recipient: req.user._id, isRead: false },
      { isRead: true }
    );
    res.json({ success: true, message: 'All notifications marked as read' });
  } catch (error) {
    next(error);
  }
};

// Create notification helper
export const createNotification = async (recipientId, type, title, message, assetId, billNo, createdBy) => {
  try {
    await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      assetId,
      billNo,
      createdBy
    });
  } catch (error) {
    console.error('Error creating notification:', error);
  }
};