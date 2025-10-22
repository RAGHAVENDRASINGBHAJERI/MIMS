import Announcement from '../models/Announcement.js';

export const createAnnouncement = async (req, res, next) => {
  try {
    const { title, message, type, targetDepartments, isGlobal, expiresAt } = req.body;

    const announcement = await Announcement.create({
      title,
      message,
      type,
      targetDepartments: isGlobal ? [] : targetDepartments,
      isGlobal,
      createdBy: req.user._id,
      expiresAt: expiresAt ? new Date(expiresAt) : undefined
    });

    await announcement.populate('targetDepartments', 'name');
    await announcement.populate('createdBy', 'name');

    res.status(201).json({
      success: true,
      data: announcement
    });
  } catch (error) {
    next(error);
  }
};

export const getAnnouncements = async (req, res, next) => {
  try {
    const user = req.user;
    let query = {
      isActive: true,
      $or: [
        { expiresAt: { $exists: false } },
        { expiresAt: { $gt: new Date() } }
      ]
    };

    // Role-based filtering
    if (user.role === 'admin') {
      // Admin sees all announcements
    } else if (user.role === 'chief-administrative-officer') {
      // Chief officers see global announcements and those targeted to any department
      query.$and = [
        {
          $or: [
            { isGlobal: true },
            { targetDepartments: { $exists: true, $ne: [] } }
          ]
        }
      ];
    } else if (user.role === 'department-officer') {
      // Department officers only see global announcements and those targeted to their department
      query.$and = [
        {
          $or: [
            { isGlobal: true },
            { targetDepartments: user.department }
          ]
        }
      ];
    } else {
      // Other users only see global announcements
      query.isGlobal = true;
    }

    const announcements = await Announcement.find(query)
      .populate('targetDepartments', 'name')
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: announcements
    });
  } catch (error) {
    next(error);
  }
};

export const deleteAnnouncement = async (req, res, next) => {
  try {
    const announcement = await Announcement.findByIdAndDelete(req.params.id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        error: 'Announcement not found'
      });
    }

    res.json({
      success: true,
      message: 'Announcement deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};