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


    const fallbackAvatar =
        "data:image/jpeg;base64,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";

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
                        <span className="ml-9"> {financialData?.warehouseName}</span>
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
