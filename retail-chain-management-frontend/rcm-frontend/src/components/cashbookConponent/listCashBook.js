import React, { useEffect, useState } from "react";
import axios from "axios";

const CashBook = () => {
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const token = localStorage.getItem("token"); // Lấy token từ localStorage
                if (!token) throw new Error("Token không tồn tại!");

                const response = await axios.get("https://localhost:5000/api/CashBookStaff/cashbook-list", {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setTransactions(response.data);
                console.log("📌 API Response:", response.data);

            } catch (error) {
                console.error("Lỗi khi lấy dữ liệu:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-lg font-bold mb-4">Sổ Quỹ Tiền Mặt Hôm Nay</h2>
            {loading ? (
                <p>Đang tải dữ liệu...</p>
            ) : (
                <table className="w-full border-collapse border border-gray-300">
                    <thead>
                        <tr className="bg-gray-200">
                            <th className="border p-2">Ngày Giao Dịch</th>
                            <th className="border p-2">Mã Giao Dịch</th>
                            <th className="border p-2">Loại</th>
                            <th className="border p-2">Nhân Viên</th>
                            <th className="border p-2">Số Tiền</th>
                            <th className="border p-2">Nguồn</th>
                            <th className="border p-2">Mô Tả</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map((tx, index) => (
                            <tr key={index} className="text-center">
                                <td className="border p-2">
                                    {tx.transactionDate ? new Date(tx.transactionDate).toLocaleDateString("vi-VN") : "N/A"}
                                </td>
                                <td className="border p-2">{tx.transactionCode}</td>
                                <td className="border p-2">{tx.transactionType}</td>
                                <td className="border p-2">{tx.fullName}</td>
                                <td className="border p-2">
                                    {tx.amount !== undefined && tx.amount !== null
                                        ? tx.amount.toLocaleString() + " VND"
                                        : "N/A"}
                                </td>
                                <td className="border p-2">{tx.sourceType}</td>
                                <td className="border p-2">{tx.description}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default CashBook;
