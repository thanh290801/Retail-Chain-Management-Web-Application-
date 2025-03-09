import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const StaffHomeComponent = () => {
    const navigate = useNavigate();
    const [cashOnHand, setCashOnHand] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [lowStockProducts, setLowStockProducts] = useState([]);
    const [showSalesMenu, setShowSalesMenu] = useState(false);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [employeeInfo, setEmployeeInfo] = useState(null);
    // State riêng cho từng menu
    const [menus, setMenus] = useState({
        sales: false,
        transactions: false,
        inventory: false,
        warehouse: false,
        reports: false,
    });
    useEffect(() => {
        fetchCashOnHand();
        fetchTodayRevenue();
        fetchEmployeeInfo();
        fetchLowStockProducts();

        // Cập nhật thời gian mỗi giây
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval); // Xóa interval khi component bị unmount
    }, []);

    // API lấy thông tin nhân viên hiện tại
    const fetchEmployeeInfo = async () => {
        try {
            const token = localStorage.getItem("token"); // Lấy token xác thực
            if (!token) return;

            const response = await axios.get("http://localhost:5000/api/account/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setEmployeeInfo(response.data); // Cập nhật thông tin nhân viên vào state
        } catch (error) {
            console.error("Lỗi khi lấy thông tin nhân viên:", error);
        }
    };
    const fetchCashOnHand = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/cash/cash-on-hand");
            setCashOnHand(response.data.cashOnHand);
        } catch (error) {
            console.error("Lỗi khi lấy số dư quỹ:", error);
        }
    };


    const fetchTodayRevenue = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/sales/today-revenue");
            setTodayRevenue(response.data.todayRevenue);
        } catch (error) {
            console.error("Lỗi khi lấy doanh thu:", error);
        }
    };

    const fetchLowStockProducts = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/stock/low-stock");
            setLowStockProducts(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách hàng sắp hết:", error);
        }
    };

    // Hàm định dạng ngày & giờ
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
    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Menu phía trên */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-lg shadow-md text-white relative">
                {/* Hiển thị thời gian & tên nhân viên */}
                <div className="flex items-center space-x-6 text-2xl font-bold">
                    <span>👤 {employeeInfo?.fullname || "Đang tải..."}</span>
                    <span>📅 {formatDateTime(currentTime)}</span>

                </div>

                {/* Các nút chức năng */}
                <div className="flex space-x-4">
                    <button onClick={() => navigate("/checkin")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">Check-in</button>

                    {/* Bán hàng / Trả hàng */}
                    <div className="relative">
                        <button onClick={() => toggleMenu("sales")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                            Bán hàng / Trả hàng
                        </button>
                        {menus.sales && (
                            <div className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                                <button onClick={() => navigate("/pos")} className="block w-full px-4 py-2 text-left  text-blue-600 hover:bg-gray-100">Bán hàng</button>
                                <button onClick={() => navigate("/refund")} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100">Hoàn trả</button>
                            </div>
                        )}
                    </div>

                    {/* Lịch sử giao dịch */}
                    <div className="relative">
                        <button onClick={() => toggleMenu("transactions")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                            Lịch sử giao dịch
                        </button>
                        {menus.transactions && (
                            <div className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                                <button onClick={() => navigate("/history-pos")} className="block w-full px-4 py-2 text-left  text-blue-600 hover:bg-gray-100">Lịch sử đơn hàng</button>
                                <button onClick={() => navigate("/cashBook")} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100"> Sổ quỹ </button>
                            </div>
                        )}
                    </div>

                    {/* Kho hàng */}
                    <div className="relative">
                        <button onClick={() => toggleMenu("warehouse")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                            Kho hàng
                        </button>
                        {menus.warehouse && (
                            <div className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                                <button onClick={() => navigate("/kho")} className="block w-full px-4 py-2 text-left  text-blue-600 hover:bg-gray-100">Kho hàng</button>
                                <button onClick={() => navigate("/kiem-kho")} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100">Phiếu kiểm kho</button>
                            </div>
                        )}
                    </div>

                    {/* Nhập hàng */}
                    <div className="relative">
                        <button onClick={() => toggleMenu("inventory")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                            Nhập hàng
                        </button>
                        {menus.inventory && (
                            <div className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                                <button onClick={() => navigate("/listOrder")} className="block w-full px-4 py-2 text-left  text-blue-600 hover:bg-gray-100">Danh sách đơn nhập</button>
                                <button onClick={() => navigate("/them-phieu-nhapkho")} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100">Tạo phiếu nhập kho</button>
                            </div>
                        )}
                    </div>

                    {/* Báo cáo */}
                    <div className="relative">
                        <button onClick={() => toggleMenu("reports")} className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                            Báo cáo
                        </button>
                        {menus.reports && (
                            <div className="absolute left-0 mt-2 w-40 bg-white shadow-lg rounded-lg">
                                <button onClick={() => navigate("/endDaytReport")} className="block w-full px-4 py-2 text-left  text-blue-600 hover:bg-gray-100">Báo cáo cuối ngày</button>
                                <button onClick={() => navigate("/note")} className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-100">Báo cáo khác</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Phần hiển thị số liệu chính */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-700">Thông tin tài chính</h2>
                <div className="flex justify-around mt-4">
                    <div className="p-4 bg-green-100 text-green-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-xl font-semibold">Tiền mặt trong quỹ</h3>
                        <p className="text-3xl font-bold">{cashOnHand.toLocaleString()} đ</p>
                    </div>
                    <div className="p-4 bg-blue-100 text-blue-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-xl font-semibold">Doanh thu hôm nay</h3>
                        <p className="text-3xl font-bold">{todayRevenue.toLocaleString()} đ</p>
                    </div>
                </div>
            </div>
            {/* Phần hiển thị hàng sắp hết */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-2xl font-bold text-gray-700 mb-4">Hàng sắp hết</h2>
                {lowStockProducts.length > 0 ? (
                    <ul className="space-y-2">
                        {lowStockProducts.map((product, index) => (
                            <li key={index} className="p-3 bg-red-100 text-red-700 rounded-md shadow-md">
                                {product.name} - Còn lại: <strong>{product.quantity}</strong> {product.unit}
                            </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-gray-500">Không có mặt hàng nào sắp hết.</p>
                )}
            </div>
        </div>
    );
};

export default StaffHomeComponent;
