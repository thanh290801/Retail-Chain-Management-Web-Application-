import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import NotificationDropdown from "../NotificationDropdown";

const StaffHeaderComponent = () => {
    const navigate = useNavigate();
    const [financialData, setFinancialData] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [avatarUrl, setAvatarUrl] = useState(null);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [warehouseDropdown, setWarehouseDropdown] = useState(false);
    const api_url = process.env.REACT_APP_API_URL;

    const fallbackAvatar = "https://cellphones.com.vn/sforum/wp-content/uploads/2023/10/avatar-trang-4.jpg"; // avatar mặc định đầy đủ nếu cần

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    const fetchData = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const decoded = jwtDecode(token);
            const accountId = decoded.AccountId;

            const avatarRes = await axios.get(`${api_url}/accounts/avatar/${accountId}`);
            setAvatarUrl(avatarRes.data?.avatarUrl || fallbackAvatar);

            const res = await axios.get(`${api_url}/finance/summaryStaff`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setFinancialData(res.data);
        } catch (err) {
            console.error("Lỗi khi load dữ liệu:", err);
            navigate("/login");
        }
    };

    const formatDateTime = (date) => {
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()} - ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    return (
        <div className="bg-gray-100">
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-b-lg shadow-md text-white">
                {/* Bên trái */}
                <div className="flex items-center space-x-6 text-2xl font-bold">
                    <div className="flex flex-col text-md leading-tight">
                        <span className="flex items-center gap-1">
                            <span className="text-purple-800">👤</span> {financialData?.fullName || "Đang tải..."}
                        </span>
                        <span className="ml-9">Chi nhánh: {financialData?.branchId}</span>
                    </div>
                    <div className="text-md text-white-300 flex items-center gap-1 ml-48">
                        📅 {formatDateTime(currentTime)}
                    </div>
                </div>

                {/* Bên phải */}
                <div className="flex items-center gap-3 text-white font-medium">
                    <button
                        onClick={() => navigate("/checkin")}
                        className="bg-yellow-500 hover:bg-yellow-600 px-3 py-1 rounded"
                    >
                        📝 Chấm công
                    </button>
                    <button
                        onClick={() => navigate("/pos")}
                        className="bg-green-500 hover:bg-green-600 px-3 py-1 rounded"
                    >
                        🛒 Bán hàng
                    </button>
                    <button
                        onClick={() => navigate("/cashBook")}
                        className="bg-indigo-500 hover:bg-indigo-600 px-3 py-1 rounded"
                    >
                        💰 Sổ quỹ
                    </button>

                    {/* Dropdown Kho hàng */}
                    <div className="relative">
                        <button
                            onClick={() => setWarehouseDropdown(!warehouseDropdown)}
                            className="bg-orange-500 hover:bg-orange-600 px-3 py-1 rounded"
                        >
                            🏪 Kho hàng ▾
                        </button>
                        {warehouseDropdown && (
                            <div className="absolute right-0 mt-2 w-56 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                                <button onClick={() => navigate("/productstock")} className="block w-full text-left px-4 py-2 hover:bg-orange-100">📦 Tồn kho</button>
                                <button onClick={() => navigate("/warehouse-transfers-confirm")} className="block w-full text-left px-4 py-2 hover:bg-orange-100">🔄 Điều chuyển kho</button>
                                <button onClick={() => navigate("/orderlist")} className="block w-full text-left px-4 py-2 hover:bg-orange-100">📥 Đơn nhập kho</button>
                                <button onClick={() => navigate("/stockcheck")} className="block w-full text-left px-4 py-2 hover:bg-orange-100">🧾 Phiếu kiểm kho</button>
                            </div>
                        )}
                    </div>

                    <NotificationDropdown />

                    {/* Avatar */}
                    <div className="relative">
                        <button
                            onClick={() => setAccountDropdown(!accountDropdown)}
                            className="flex items-center"
                        >
                            <img
                                src={avatarUrl || fallbackAvatar}
                                alt="avatar"
                                className="w-9 h-9 rounded-full border-2 border-white shadow"
                            />
                        </button>
                        {accountDropdown && (
                            <div className="absolute right-0 mt-2 w-48 bg-white text-gray-800 rounded-lg shadow-lg z-50">
                                <button
                                    onClick={() => navigate("/profile")}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100"
                                >
                                    👤 Thông tin người dùng
                                </button>
                                <hr />
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                                >
                                    🚪 Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default StaffHeaderComponent;
