import Notification from '../models/Notification.js';
import Announcement from '../models/Announcement.js';

// Get user notifications and announcements
export const getUserNotifications = async (req, res, next) => {
  try {
    // Get regular notifications
    const notifications = await Notification.find({ recipient: req.user._id })
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(25);

    // Get active announcements for user's department or global announcements
    const currentDate = new Date();
    const announcementQuery = {
      isActive: true,
      $and: [
        {
          $or: [
            { isGlobal: true },
            { targetDepartments: req.user.department }
          ]
        },
        {
          $or: [
            { expiresAt: { $exists: false } },
            { expiresAt: null },
            { expiresAt: { $gt: currentDate } }
          ]
        }
      ]
    };

    const announcements = await Announcement.find(announcementQuery)
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })
      .limit(25);

    // Transform announcements to match notification format
    const transformedAnnouncements = announcements.map(announcement => ({
      _id: announcement._id,
      type: 'announcement',
      title: announcement.title,
      message: announcement.message,
      billNo: announcement.type,
      isRead: false, // Announcements are always shown as unread
      createdAt: announcement.createdAt,
      createdBy: announcement.createdBy,
      announcementType: announcement.type
    }));

    // Combine and sort by creation date
    const allNotifications = [...notifications, ...transformedAnnouncements]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 50);
    
    res.json({ success: true, data: allNotifications });
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