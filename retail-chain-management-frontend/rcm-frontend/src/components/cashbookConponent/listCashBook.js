import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CashBook = () => {
    const navigate = useNavigate();
    const [cashbook, setCashbook] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {

        const fetchCashbook = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    navigate("/login");
                    return;
                }

                const response = await axios.get("https://localhost:5000/api/CashHandover/cashbook", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                // Kiểm tra API trả về đúng dữ liệu hay không
                if (response.data && response.data.transactions) {
                    setCashbook(response.data.transactions); // ✅ Lấy đúng `transactions`
                } else {
                    setCashbook([]); // Nếu không có dữ liệu, gán mảng rỗng để tránh lỗi
                }
            } catch (err) {
                setCashbook([]); // Đảm bảo `cashbook` không bị undefined nếu lỗi
                setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu sổ quỹ.");
            } finally {
                setLoading(false);
            }
        };

        fetchCashbook();
    }, []);

    if (loading) return <p className="text-center text-gray-600">Đang tải dữ liệu...</p>;
    if (error) return <p className="text-center text-red-500">Lỗi: {error}</p>;

    return (
        <div className="container mx-auto p-4">
            <h2 className="text-lg font-bold mb-4">Sổ Quỹ Tiền Mặt Hôm Nay</h2>

            <div className="min-h-screen bg-gray-100 p-6">
                <h2 className="text-2xl font-bold text-gray-700 text-center">Sổ Quỹ Tiền Mặt Hôm Nay</h2>
                <table className="w-full bg-white rounded-lg shadow-md mt-4">
                    <thead className="bg-blue-600 text-white">
                        <tr>
                            <th className="p-2">Ngày</th>
                            <th className="p-2">Mã giao dịch</th>
                            <th className="p-2">Loại Giao Dịch</th>
                            <th className="p-2">Số Tiền</th>
                            <th className="p-2">Người Thực Hiện</th>
                            <th className="p-2">Nội dung</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cashbook && cashbook.length > 0 ? (
                            cashbook.map((transactions, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{new Date(transactions.transactionDate).toLocaleString()}</td>
                                    <td className="p-2">{transactions.transactionCode}</td>
                                    <td className="p-2">{transactions.transactionType}</td>
                                    <td className="p-2 text-right text-green-600 font-bold">{transactions.amount.toLocaleString()} VNĐ</td>
                                    <td className="p-2">{transactions.performedBy}</td>
                                    <td className="p-2">{transactions.description}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center p-4 text-gray-500">Không có giao dịch nào hôm nay.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default CashBook;
