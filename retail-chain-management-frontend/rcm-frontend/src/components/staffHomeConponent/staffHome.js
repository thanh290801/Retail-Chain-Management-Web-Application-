import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import FinancialHistory from "../cashbookConponent/historyTrans"; // Component lịch sử giao dịch

const StaffHomeComponent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [cashData, setCashData] = useState(null);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [menus, setMenus] = useState({

        sales: false,
        transactions: false,
        inventory: false,
        warehouse: false,
        reports: false,
    });

    useEffect(() => {
        fetchCashBalance();
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);



    const fetchCashBalance = async () => {
        try {
            const token = localStorage.getItem("token");

            const response = await axios.get("https://localhost:5000/api/Financial/branch-cash-balance", {
                headers: { Authorization: `Bearer ${token}` },


            });

            setCashData(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu");
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
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header Menu */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-lg shadow-md text-white">
                <div className="flex items-center space-x-6 text-2xl font-bold">
                    <span>👤 {cashData?.employeeName || "Đang tải..."}</span>
                    <span>Chi nhánh: {cashData?.branchId}</span>
                    <span>📅 {formatDateTime(currentTime)}</span>
                </div>

                {/* Chức năng Menu */}
                <div className="flex space-x-4">
                    <button onClick={() => navigate("/checkin")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">Check-in</button>

                    {/* Menu Dropdown */}
                    {[
                        { label: "Bán hàng / Trả hàng", menuKey: "sales", links: [{ label: "Bán hàng", path: "/pos" }, { label: "Hoàn trả", path: "/refund" }] },
                        { label: "Lịch sử giao dịch", menuKey: "transactions", links: [{ label: "Lịch sử đơn hàng", path: "/history-pos" }, { label: "Sổ quỹ", path: "/cashBook" }] },
                        { label: "Kho hàng", menuKey: "warehouse", links: [{ label: "Kho hàng", path: "/kho" }, { label: "Phiếu kiểm kho", path: "/kiem-kho" }] },
                        { label: "Nhập hàng", menuKey: "inventory", links: [{ label: "Danh sách đơn nhập", path: "/listOrder" }, { label: "Tạo phiếu nhập kho", path: "/them-phieu-nhapkho" }] },
                        { label: "Báo cáo", menuKey: "reports", links: [{ label: "Báo cáo cuối ngày", path: "/endDayReport" }, { label: "Báo cáo khác", path: "/note" }] },
                    ].map((menu) => (
                        <div key={menu.menuKey} className="relative">
                            <button onClick={() => toggleMenu(menu.menuKey)} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                                {menu.label}
                            </button>
                            {menus[menu.menuKey] && (
                                <div className="absolute left-0 mt-2 w-48 bg-white shadow-lg rounded-lg">
                                    {menu.links.map((link, index) => (
                                        <button
                                            key={index}
                                            onClick={() => navigate(link.path)}
                                            className="block w-full px-4 py-2 text-left text-blue-600 hover:bg-gray-100"
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

            {/* Thông tin tài chính */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-700">Thông tin tài chính</h2>
                <div className="flex justify-around mt-4">
                    <div className="p-4 bg-blue-100 text-blue-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-xl font-bold text-gray-700">📊 Doanh thu hôm nay</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {((cashData?.cashSales || 0) + (cashData?.bankSales || 0)).toLocaleString()} VNĐ
                        </p>
                    </div>
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold">📥 Doanh thu tiền mặt</h3>
                        <p className="text-2xl font-bold">
                            {cashData?.cashSales?.toLocaleString()} VNĐ
                        </p>
                    </div>
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold">📤 Doanh thu chuyển khoản</h3>
                        <p className="text-2xl font-bold">
                            {cashData?.bankSales?.toLocaleString() || 0} đ</p>
                    </div>

                </div>
            </div>

            {/* Lịch sử giao dịch */}
            lịch sử đơn hàng hôm nay
        </div >
    );
};

export default StaffHomeComponent;
