// Admin notification system (localStorage-based)

export interface AdminNotification {
  id: string;
  type: "high_score" | "purchase" | "new_user" | "achievement";
  message: string;
  detail?: string;
  date: string;
  read: boolean;
}

const NOTIF_KEY = "skyfire-admin-notifications";

export const getAdminNotifications = (): AdminNotification[] => {
  return JSON.parse(localStorage.getItem(NOTIF_KEY) || "[]");
};

export const addAdminNotification = (notif: Omit<AdminNotification, "id" | "date" | "read">) => {
  const all = getAdminNotifications();
  all.unshift({
    ...notif,
    id: `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    date: new Date().toISOString(),
    read: false,
  });
  // Keep max 100
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all.slice(0, 100)));
};

export const markNotificationsRead = () => {
  const all = getAdminNotifications();
  all.forEach((n) => (n.read = true));
  localStorage.setItem(NOTIF_KEY, JSON.stringify(all));
};

export const getUnreadCount = (): number => {
  return getAdminNotifications().filter((n) => !n.read).length;
};

export const clearNotifications = () => {
  localStorage.setItem(NOTIF_KEY, JSON.stringify([]));
};
