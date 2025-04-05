import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LowStockProducts from "../warehouses/lowStockProduct";

const StaffHeaderComponent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState(null);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [menus, setMenus] = useState({

        transactions: false,
        inventory: false,
        warehouse: false,
        reports: false,
    });
    const api_url = process.env.REACT_APP_API_URL

    useEffect(() => {
        fetchFinancialSummary();
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);


    const fetchFinancialSummary = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get(`${api_url}/finance/summaryStaff`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setFinancialData(response.data);
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/login");
            } else {
                setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu tài chính.");
            }
        } finally {
            setLoading(false);
        }
    };


    const formatDateTime = (date) => {
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0");
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, "0");
        const minutes = String(date.getMinutes()).padStart(2, "0");
        const seconds = String(date.getSeconds()).padStart(2, "0");
        return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
    };

    const toggleMenu = (menu) => {
        setMenus((prevMenus) => ({
            sales: false,
            transactions: false,
            inventory: false,
            warehouse: false,
            reports: false,
            [menu]: !prevMenus[menu],
        }));
    };

    if (loading) return <p className="text-center text-gray-600">Đang tải dữ liệu...</p>;
    if (error) return <p className="text-center text-red-500">Lỗi: {error}</p>;


    return (
        <div className="bg-gray-100 ">
            {/* Header Menu */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-b-lg shadow-md text-white">
                <div className="flex items-center space-x-6 text-2xl font-bold">
                    {/* Bên trái: Cột thông tin nhân viên */}
                    <div className="flex flex-col text-md leading-tight">
                        <span className="flex items-center gap-1">
                            <span className="text-purple-800">👤</span> {financialData?.fullName || "Đang tải..."}
                        </span>
                        <span className="ml-9">Chi nhánh: {financialData?.branchId}</span>
                    </div>

                    {/* Bên phải: Thời gian */}
                    <div className="text-md text-white-300 flex items-center gap-1 ml-48">
                        📅 {formatDateTime(currentTime)}
                    </div>
                </div>

                {/* Chức năng Menu */}
                <div className="flex space-x-4">
                    <button onClick={() => navigate("/checkin")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">Check-in</button>
                    <button onClick={() => navigate("/pos")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">Bán hàng</button>
                    <button onClick={() => navigate("/cashBook")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">Sổ quỹ tiền mặt</button>

                    {/* Menu Dropdown */}
                    {[
                        { label: "Kho hàng", menuKey: "warehouse", links: [{ label: "Kho hàng", path: "/productstock" }, { label: "Phiếu kiểm kho", path: "/stockcheck" }] },
                        { label: "Nhập hàng", menuKey: "inventory", links: [{ label: "Danh sách đơn nhập", path: "/orderlist" }, { label: "Xác nhận đơn điều chuyển", path: "/warehouse-transfers-confirm" }] },
                        { label: "Menu", menuKey: "reports", links: [{ label: "Thông tin người dùng", path: "/profile" }, { label: "Đăng xuất", path: "/note" }] },
                    ].map((menu) => (
                        <div key={menu.menuKey} className="relative">
                            <button onClick={() => toggleMenu(menu.menuKey)} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                                {menu.label}
                            </button>
                            {menus[menu.menuKey] && (
                                <div className="absolute right-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                    {menu.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => navigate(link.path)}
                                            className="block w-full px-4 py-2 text-left text-blue-600 hover: rounded-lg bg-gray-100"
                                        >
                                            {link.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default StaffHeaderComponent;
