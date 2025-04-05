import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { FaBell } from "react-icons/fa";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [accountId, setAccountId] = useState(null);

  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      const decoded = jwtDecode(token);
      setAccountId(decoded.AccountId);
    }
  }, []);

  useEffect(() => {
    if (accountId) {
      fetchNotifications();
    }
  }, [accountId]);

  const fetchNotifications = async () => {
    try {
      const res = await axios.get(`${api_url}/notification/all?accountId=${accountId}`);
      setNotifications(res.data);
      setUnreadCount(res.data.filter(n => !n.isRead).length);
    } catch (err) {
      console.error("Lỗi khi lấy thông báo:", err);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await axios.post(`${api_url}/notification/mark-as-read/${notificationId}`);
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi khi đánh dấu đã đọc:", err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.post(`${api_url}/notification/mark-all-read?accountId=${accountId}`);
      fetchNotifications();
    } catch (err) {
      console.error("Lỗi khi đánh dấu tất cả đã đọc:", err);
    }
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="relative text-white">
        <FaBell className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full px-1">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg z-50 max-h-96 overflow-auto">
          <div className="flex items-center justify-between px-4 py-2 border-b">
            <span className="font-semibold text-gray-700">Thông báo</span>
            <button
              onClick={handleMarkAllAsRead}
              className="text-sm text-blue-500 hover:underline"
            >
              Đánh dấu tất cả đã đọc
            </button>
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-gray-500 text-center">Không có thông báo</div>
          ) : (
            <ul>
              {notifications.map((noti) => (
                <li
                  key={noti.notificationId}
                  onClick={() => handleMarkAsRead(noti.notificationId)}
                  className={`px-4 py-2 cursor-pointer hover:bg-gray-100 border-b ${
                    !noti.isRead ? "bg-blue-50" : "bg-white"
                  }`}
                >
                  <div className="font-medium text-gray-800">{noti.title}</div>
                  <div className="text-sm text-gray-600">{noti.message}</div>
                  <div className="text-xs text-gray-400">{new Date(noti.createdAt).toLocaleString()}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
