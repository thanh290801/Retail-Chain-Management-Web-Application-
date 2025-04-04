import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import LowStockProducts from "../warehouses/lowStockProduct";
import StaffHeaderComponent from "./staffHeader";

const StaffHomeComponent = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [financialData, setFinancialData] = useState(null);
    const [error, setError] = useState(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    useEffect(() => {
        fetchFinancialSummary();
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 1000);
        return () => clearInterval(interval);
    }, []);
    const api_url = process.env.REACT_APP_API_URL


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

    if (loading) return <p className="text-center text-gray-600">Đang tải dữ liệu...</p>;
    if (error) return <p className="text-center text-red-500">Lỗi: {error}</p>;


    return (
        <div>
            <StaffHeaderComponent/>
            <div className="min-h-screen bg-gray-100 p-6">
            {/* Thông tin tài chính */}
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-2xl font-bold text-gray-700">Thông tin tài chính</h2>
                <div className="flex justify-around mt-4">
                    <div className="p-4 bg-blue-100 text-blue-700 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">💰 Tổng doanh thu</h3>
                        <p className="text-2xl font-bold text-green-600">
                            {financialData?.totalRevenues ? financialData.totalRevenues.toLocaleString() : "0"} VNĐ
                        </p>
                    </div>

                    <div className="p-4 bg-green-100 text-green-700 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">📥 Doanh thu tiền mặt</h3>
                        <p className="text-2xl font-bold">
                            {financialData?.cashSale ? financialData.cashSale.toLocaleString() : "0"} VNĐ
                        </p>
                    </div>

                    <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg shadow-md">
                        <h3 className="text-lg font-semibold">📤 Doanh thu chuyển khoản</h3>
                        <p className="text-2xl font-bold">
                            {financialData?.bankSale ? financialData.bankSale.toLocaleString() : "0"} VNĐ
                        </p>
                    </div>

                </div>
            </div>
                    <LowStockProducts/>

        </div >
        </div>
    );
};

export default StaffHomeComponent;
