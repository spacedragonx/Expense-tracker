import { Request, Response } from "express";
import asyncHandler from "express-async-handler";
import Notification from "../models/Notification";

// @route  GET /api/notifications
export const getNotifications = asyncHandler(async (req: Request, res: Response) => {
  const notifications = await Notification.find({ user: req.user!._id }).sort({ createdAt: -1 }).limit(50);
  const unreadCount = await Notification.countDocuments({ user: req.user!._id, isRead: false });
  res.json({ success: true, data: notifications, unreadCount });
});

// @route  PUT /api/notifications/:id/read
export const markAsRead = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.user!._id },
    { isRead: true },
    { new: true }
  );
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, data: notification });
});

// @route  PUT /api/notifications/read-all
export const markAllAsRead = asyncHandler(async (req: Request, res: Response) => {
  await Notification.updateMany({ user: req.user!._id, isRead: false }, { isRead: true });
  res.json({ success: true, message: "All notifications marked as read" });
});

// @route  DELETE /api/notifications/:id
export const deleteNotification = asyncHandler(async (req: Request, res: Response) => {
  const notification = await Notification.findOneAndDelete({ _id: req.params.id, user: req.user!._id });
  if (!notification) {
    res.status(404);
    throw new Error("Notification not found");
  }
  res.json({ success: true, message: "Notification deleted" });
});
