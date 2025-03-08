import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CashBookComponent = () => {
    const navigate = useNavigate();
    const [cashOnHand, setCashOnHand] = useState(0);
    const [totalIncome, setTotalIncome] = useState(0); // Tổng thu
    const [totalExpense, setTotalExpense] = useState(0); // Tổng chi
    const [transactions, setTransactions] = useState([]);
    const [search, setSearch] = useState("");
    const [filterType, setFilterType] = useState("all"); // 'all' | 'Thu' | 'Chi'

    useEffect(() => {
        fetchCashOnHand();
        fetchTodayTransactions();
    }, []);

    // Lấy số dư tiền mặt trong quỹ
    const fetchCashOnHand = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/cash/cash-on-hand");
            setCashOnHand(response.data.cashOnHand);
        } catch (error) {
            console.error("Lỗi khi lấy số dư quỹ:", error);
        }
    };

    // Lấy danh sách giao dịch trong ngày hôm nay
    const fetchTodayTransactions = async () => {
        try {
            const response = await axios.get("http://localhost:5000/api/cash/today-transactions");
            setTransactions(response.data);

            // Tính tổng thu và tổng chi
            let income = 0, expense = 0;
            response.data.forEach((t) => {
                if (t.transactionType === "Thu") {
                    income += t.amount;
                } else if (t.transactionType === "Chi") {
                    expense += t.amount;
                }
            });

            setTotalIncome(income);
            setTotalExpense(expense);
        } catch (error) {
            console.error("Lỗi khi lấy danh sách giao dịch:", error);
        }
    };

    // Tìm kiếm theo mã giao dịch
    const handleSearch = (e) => {
        setSearch(e.target.value);
    };

    // Lọc giao dịch theo mã và loại giao dịch
    const filteredTransactions = transactions.filter((t) =>
        t.transactionCode.toLowerCase().includes(search.toLowerCase()) &&
        (filterType === "all" || t.transactionType === filterType)
    );

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            {/* Header */}
            <div className="flex justify-between items-center bg-blue-600 p-4 rounded-lg shadow-md text-white">
                <h2 className="text-2xl font-bold">📘 Sổ Quỹ</h2>
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
            <div className="mt-6 bg-white p-6 rounded-lg shadow-md text-center">
                <h2 className="text-xl font-bold text-gray-700">Tổng Quan Tài Chính Hôm Nay</h2>
                <div className="flex justify-around mt-4">
                    <div className="p-4 bg-green-100 text-green-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold">💰 Tiền mặt trong quỹ</h3>
                        <p className="text-2xl font-bold">{cashOnHand.toLocaleString()} đ</p>
                    </div>
                    <div className="p-4 bg-blue-100 text-blue-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold">📥 Tổng thu hôm nay</h3>
                        <p className="text-2xl font-bold">{totalIncome.toLocaleString()} đ</p>
                    </div>
                    <div className="p-4 bg-red-100 text-red-700 rounded-lg shadow-md w-1/3">
                        <h3 className="text-lg font-semibold">📤 Tổng chi hôm nay</h3>
                        <p className="text-2xl font-bold">{totalExpense.toLocaleString()} đ</p>
                    </div>
                </div>
            </div>

            {/* Bộ lọc tìm kiếm & loại giao dịch */}
            <div className="mt-4 flex justify-between items-center">
                <input
                    type="text"
                    placeholder="🔍 Tìm theo mã giao dịch..."
                    className="p-2 border rounded-md w-1/3"
                    value={search}
                    onChange={handleSearch}
                />
                <select
                    className="p-2 border rounded-md"
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value)}
                >
                    <option value="all">Tất cả</option>
                    <option value="Thu">Thu</option>
                    <option value="Chi">Chi</option>
                </select>
            </div>

            {/* Danh sách giao dịch */}
            <div className="mt-4 bg-white p-6 rounded-lg shadow-md">
                <h2 className="text-xl font-bold text-gray-700 mb-4">Lịch sử giao dịch hôm nay</h2>
                {filteredTransactions.length > 0 ? (
                    <table className="w-full border-collapse border border-gray-300">
                        <thead>
                            <tr className="bg-gray-200">
                                <th className="border p-2">Mã GD</th>
                                <th className="border p-2">Loại</th>
                                <th className="border p-2">Số tiền</th>
                                <th className="border p-2">Mô tả</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredTransactions.map((t, index) => (
                                <tr key={index} className="text-center">
                                    <td className="border p-2">{t.transactionCode}</td>
                                    <td className={`border p-2 font-bold ${t.transactionType === "Thu" ? "text-green-600" : "text-red-600"}`}>
                                        {t.transactionType}
                                    </td>
                                    <td className="border p-2">{t.amount.toLocaleString()} đ</td>
                                    <td className="border p-2">{t.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-gray-500 text-center">Không có giao dịch nào hôm nay.</p>
                )}
            </div>
        </div>
    );
};

export default CashBookComponent;
