import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import CashBook from "./listCashBook";
const CashBookStaff = () => {
    const navigate = useNavigate();
    const [FundData, setFinancialData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const api_url = process.env.REACT_APP_API_URL

    // Mặc định: Hiển thị giao dịch trong tháng hiện tại


    useEffect(() => {
        fetchFinancialSummary();
    }, []);// Tự động gọi API khi filter thay đổi
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




    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-lg shadow-md text-white">
                <h2 className="text-2xl font-bold">📘 Sổ Quỹ Nhân Viên</h2>
                <div className="flex space-x-4">
                    <button
                        onClick={() => navigate("/transactionForm")}
                        className="px-4 py-2 bg-yellow-400 text-white rounded-lg font-semibold shadow-md">
                        + Tạo Phiếu Bàn Giao Tiền Mặt
                    </button>
                    <button
                        onClick={() => navigate("/staffHome")}
                        className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold shadow-md">
                        Quay lại
                    </button>
                </div>
            </div>



            {/* Thông tin tài chính */}
            {loading ? (
                <p>Đang tải...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
                    <h2 className="text-xl font-bold text-gray-700">Quỹ tiền mặt hôm nay</h2>
                    <div className="flex justify-around mt-4">
                        {/* Dùng grid để căn chỉnh 4 thẻ tài chính */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
                            {/* 💰 Tồn quỹ đầu ngày */}
                            <div className="p-6 bg-green-200 text-green-800 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">💰 Tồn quỹ tiền mặt đầu ngày</h3>
                                <p className="text-3xl font-bold">
                                    {FundData?.openingBalance?.toLocaleString() || "0"} VNĐ
                                </p>
                            </div>



                            {/* 📊 Tổng thu */}
                            <div className="p-6 bg-green-200 text-green-800 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">📊 Tổng thu tiền mặt</h3>
                                <p className="text-3xl font-bold">
                                    {FundData?.totalthu?.toLocaleString() || "0"} VNĐ
                                </p>
                            </div>

                            {/* 📊 Tổng chi */}
                            <div className="p-6 bg-red-200 text-green-800 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">📊 Tổng chi tiền mặt</h3>
                                <p className="text-3xl font-bold">
                                    {FundData?.totalchi?.toLocaleString() || "0"} VNĐ
                                </p>
                            </div>
                            {/* 💰 Tồn quỹ hiện tại */}
                            <div className="p-6 bg-blue-200 text-green-800 rounded-lg shadow-md">
                                <h3 className="text-lg font-semibold">💰 Tồn quỹ tiền mặt</h3>
                                <p className="text-3xl font-bold">
                                    {FundData?.currentBalance?.toLocaleString() || "0"} VNĐ
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            <CashBook />


        </div>
    );
};

export default CashBookStaff;
