import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { IoArrowBackOutline } from "react-icons/io5";

const EndShiftReport = () => {
    const navigate = useNavigate();

    // Lưu ngày giờ lập phiếu (thời gian hiện tại khi mở trang)
    const [createdAt, setCreatedAt] = useState("");

    // Lưu thông tin nhân viên đang đăng nhập
    const [employeeInfo, setEmployeeInfo] = useState(null);

    // Lưu số tiền mặt còn trong quỹ
    const [cashOnHand, setCashOnHand] = useState(0);

    // Lưu tổng doanh thu trong ngày
    const [todayRevenue, setTodayRevenue] = useState(0);

    // Lưu số tiền mặt mà chủ cửa hàng đã bỏ vào đầu ca
    const [cashStart, setCashStart] = useState(0);

    // Lưu số tiền đã chi trong ca làm việc (hoàn trả, chi phí khác)
    const [cashSpent, setCashSpent] = useState(0);

    // Biến kiểm soát trạng thái báo cáo có hoàn tất chưa
    const [isReportCompleted, setIsReportCompleted] = useState(false);
    const [employees, setEmployees] = useState([]); // Danh sách nhân viên
    const [handoverReceiver, setHandoverReceiver] = useState(""); // Người nhận bàn giao


    useEffect(() => {
        // Khi trang load, gọi API để lấy dữ liệu cần thiết
        fetchCashOnHand();
        fetchEmployees();
        fetchTodayRevenue();
        fetchEmployeeInfo();
        fetchCashStart();
        fetchCashSpent();

        // Lấy thời gian hiện tại khi mở trang
        setCreatedAt(new Date().toLocaleString("vi-VN"));
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

    const fetchEmployees = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/account/all");
            setEmployees(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách nhân viên:", error);
        }
    };
    // API lấy số tiền mặt hiện tại trong quỹ
    const fetchCashOnHand = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/finance/cash");
            setCashOnHand(response.data.cashOnHand); // Cập nhật số tiền mặt còn lại vào state
        } catch (error) {
            console.error("Lỗi khi lấy số tiền mặt:", error);
        }
    };

    // API lấy tổng doanh thu trong ngày
    const fetchTodayRevenue = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/sales/today-revenue");
            setTodayRevenue(response.data.todayRevenue); // Cập nhật tổng doanh thu vào state
        } catch (error) {
            console.error("Lỗi khi lấy doanh thu:", error);
        }
    };

    // API lấy số tiền mặt đầu ca (chủ cửa hàng nạp vào đầu ngày)
    const fetchCashStart = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/finance/cash-start");
            setCashStart(response.data.cashStart); // Cập nhật số tiền đầu ca vào state
        } catch (error) {
            console.error("Lỗi khi lấy số tiền mặt đầu ca:", error);
        }
    };

    // API lấy số tiền đã chi ra trong ca làm việc
    const fetchCashSpent = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/finance/cash-spent");
            setCashSpent(response.data.cashSpent); // Cập nhật số tiền chi ra vào state
        } catch (error) {
            console.error("Lỗi khi lấy tiền chi trong ca:", error);
        }
    };

    // Khi nhân viên nhấn "Hoàn tất báo cáo"
    const handleEndShift = async () => {
        try {
            await axios.post("http://localhost:5000/api/finance/end-shift");
            setCashOnHand(0); // Reset tiền mặt trong quỹ về 0
            setIsReportCompleted(true); // Đánh dấu báo cáo đã hoàn tất
            alert("Báo cáo cuối ca đã hoàn tất. Vui lòng đăng xuất ca làm việc.");
        } catch (error) {
            console.error("Lỗi khi kết thúc ca:", error);
        }
    };

    // Khi nhân viên nhấn "Đăng xuất ca làm việc"
    const handleLogoutShift = async () => {
        const confirmLogout = window.confirm("Bạn có chắc chắn muốn đăng xuất ca làm việc?");
        if (confirmLogout) {
            localStorage.removeItem("token"); // Xóa token đăng nhập
            localStorage.removeItem("user"); // Xóa thông tin người dùng
            window.location.href = "/login"; // Chuyển hướng về trang đăng nhập
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
            {/* Nút quay lại trang chính */}
            <button onClick={() => navigate("/staffHome")} className="back-button">
                <IoArrowBackOutline className="mr-2 text-xl" />
                Quay lại
            </button>

            <h2 className="text-2xl font-bold text-center text-blue-600 mb-4">Báo cáo kết ca</h2>

            {employeeInfo && (
                <div className="mb-4">
                    <p><strong>Nhân viên tạo phiếu:</strong> {employeeInfo.fullname}</p>
                    <p><strong>Chức vụ:</strong> {employeeInfo.role}</p>
                    <p><strong>Ngày lập phiếu:</strong> {createdAt}</p>
                    <label className="block font-bold mt-3">Người tiếp nhận bàn giao:</label>
                    <select
                        className="w-full p-2 border rounded mt-2"
                        value={handoverReceiver}
                        onChange={(e) => setHandoverReceiver(e.target.value)}
                    >
                        <option value="">-- Chọn người tiếp nhận --</option>
                        {employees
                            .filter(emp => emp.fullname !== employeeInfo.fullname) // Loại bỏ nhân viên đang đăng nhập
                            .map(emp => (
                                <option key={emp.id} value={emp.fullname}>
                                    {emp.fullname}
                                </option>
                            ))}
                    </select>
                    <p><strong>(1+2) Tổng doanh thu:</strong> {todayRevenue.toLocaleString()} đ</p>
                    <p><strong>(1) Thanh toán tiền mặt:</strong> {cashOnHand.toLocaleString()} đ</p>
                    <p><strong>(2) Thanh toán chuyển khoản:</strong> {(todayRevenue - cashOnHand).toLocaleString()} đ</p>
                    <p><strong>(3) Tiền quỹ tiền mặt đầu ca:</strong> {cashStart.toLocaleString()} đ</p>
                    <p><strong>(4) Tổng chi trong ca:</strong> {cashSpent.toLocaleString()} đ</p>
                    <p><strong>(1+3-4) Tổng quỹ tiền mặt cuối ca:</strong> {(cashStart + cashOnHand - cashSpent).toLocaleString()} đ</p>
                </div>
            )}

            {/* Nút "Hoàn tất báo cáo" */}
            {!isReportCompleted && (
                <button
                    onClick={handleEndShift}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold shadow-md"
                >
                    Hoàn tất báo cáo
                </button>
            )}

            {/* Nút "Đăng xuất ca làm việc" chỉ hiển thị sau khi báo cáo hoàn tất */}
            {isReportCompleted && (
                <button
                    onClick={handleLogoutShift}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-semibold shadow-md mt-4"
                >
                    Đăng xuất ca làm việc
                </button>
            )}
        </div>
    );
};

export default EndShiftReport;
