import React, { useEffect, useState } from "react";
import axios from "axios";

const FinancialHistory = ({ filters }) => {
    const [data, setData] = useState({ transactions: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [search, setSearch] = useState("");

    useEffect(() => {
        fetchFinancialData();
    }, [filters, search]); // Cập nhật khi bộ lọc hoặc ô tìm kiếm thay đổi

    const fetchFinancialData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                setError("Bạn cần đăng nhập để xem dữ liệu.");
                return;
            }

            const response = await axios.get("https://localhost:5000/api/CashBookStaff/cashbook-staff-history", {
                headers: { Authorization: `Bearer ${token}` },
                params: { ...filters, search },
            });

            console.log("📌 API Response:", response.data);
            setData(response.data);
        } catch (err) {
            console.error("🚨 Lỗi khi tải dữ liệu:", err);
            setError(err.response?.data?.message || "Lỗi khi tải dữ liệu");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="container mx-auto p-6">
            <h2 className="text-2xl font-semibold mb-4">Lịch Sử Thu Chi</h2>

            <input
                type="text"
                placeholder="Tìm theo mã giao dịch..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="border p-2 rounded mb-4 w-full"
            />

            {loading ? (
                <p>Đang tải...</p>
            ) : error ? (
                <p className="text-red-500">{error}</p>
            ) : (
                <table className="w-full border-collapse border-2 border-gray-600 shadow-md">
                    <thead className="bg-gray-800 text-white">
                        <tr>
                            <th className="p-3 border-2 border-gray-600 text-left">Mã giao dịch</th>
                            <th className="p-3 border-2 border-gray-600 text-left">Ngày giao dịch</th>
                            <th className="p-3 border-2 border-gray-600 text-left">Loại</th>
                            <th className="p-3 border-2 border-gray-600 text-center">Số tiền (VNĐ)</th>
                            <th className="p-3 border-2 border-gray-600 text-center">Nguồn</th>
                        </tr>
                    </thead>

                    <tbody className="bg-gray-50">
                        {data.transactions.map((txn) => (
                            <tr key={txn.transactionId} className="border-2 border-gray-600 hover:bg-gray-200">
                                <td className="p-3 border-2 border-gray-600">{txn.transactionCode}</td>
                                <td className="p-3 border-2 border-gray-600">{new Date(txn.transactionDate).toLocaleDateString()}</td>
                                <td className={`p-3 border-2 border-gray-600 ${txn.transactionType === "Thu" ? "text-green-600" : "text-red-600"}`}>
                                    {txn.transactionType}
                                </td>
                                <td className="p-3 border-2 border-gray-600 text-center">{txn.amount.toLocaleString()} đ</td>
                                <td className="p-3 border-2 border-gray-600 text-center">{txn.sourceType}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>


            )}
        </div>
    );
};

export default FinancialHistory;
