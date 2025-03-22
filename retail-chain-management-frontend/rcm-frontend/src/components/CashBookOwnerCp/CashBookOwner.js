import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";
const CashBookOwner = () => {
    const navigate = useNavigate();
    const [cashbook, setCashbook] = useState([]);
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchBranches(); // Lấy danh sách chi nhánh khi load trang
    }, []);

    const fetchBranches = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const response = await axios.get("https://localhost:5000/api/CashBookOwner/branches", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setBranches(response.data);
        } catch (err) {
            setError("Không thể lấy danh sách chi nhánh.");
        }
    };

    const fetchCashbook = async () => {
        if (!selectedBranch) {
            setError("Vui lòng chọn chi nhánh.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const params = new URLSearchParams();
            params.append("branchId", selectedBranch);
            if (fromDate) params.append("fromDate", fromDate);
            if (toDate) params.append("toDate", toDate);

            const response = await axios.get(`https://localhost:5000/api/CashBookOwner/cashbook?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setCashbook(response.data.transactions);
        } catch (err) {
            setError(err.response?.data?.message || "Lỗi khi lấy dữ liệu sổ quỹ.");
        } finally {
            setLoading(false);
        }
    };

    const fetchSummary = async () => {
        if (!selectedBranch) {
            setError("Vui lòng chọn chi nhánh.");
            return;
        }

        try {
            const token = localStorage.getItem("token");
            if (!token) {
                navigate("/login");
                return;
            }

            const params = new URLSearchParams();
            params.append("branchId", selectedBranch);
            if (fromDate) params.append("fromDate", fromDate);
            if (toDate) params.append("toDate", toDate);

            const response = await axios.get(`https://localhost:5000/api/CashBookOwner/summary?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            setSummary(response.data);
        } catch (err) {
            setError("Lỗi khi lấy tổng thu/chi/tồn quỹ.");
        }
    };

    return (
        <div className="min-h-screen bg-gray-100 p-6">
            <Header />
            <div className="bg-white p-2 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-bold">🔍 Lọc Giao Dịch</h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                    <select
                        className="p-2 border rounded"
                        value={selectedBranch}
                        onChange={(e) => setSelectedBranch(e.target.value)}>
                        <option value="">Chọn Chi Nhánh</option>
                        {branches.map((branch) => (
                            <option key={branch.warehousesId} value={branch.warehousesId}>
                                {branch.name}
                            </option>
                        ))}
                    </select>
                    <input type="date" className="p-2 border rounded" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                    <input type="date" className="p-2 border rounded" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                    <button onClick={fetchCashbook} className="px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold shadow-md">🔎 Chi tiết các toàn bộ giao dịch</button>
                    <button onClick={fetchSummary} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md">📊 Xem Tổng Kết</button>
                </div>
            </div>
            {summary && (
                <div className="bg-white p-4 rounded-lg shadow-md mt-6">
                    <h3 className="text-lg font-bold">📊 Tổng Kết Quỹ</h3>
                    <p><strong>Tổng Thu tiền mặt:</strong> {summary.totalIncome.toLocaleString()} VNĐ</p>
                    <p><strong>Tổng Thu chuyển khoản:</strong> {summary.totalBank.toLocaleString()} VNĐ</p>
                    <p><strong>Tổng Chi tiền mặt:</strong> {summary.totalExpense.toLocaleString()} VNĐ</p>
                    <p><strong>Tồn Quỹ:</strong> {summary.currentBalance.toLocaleString()} VNĐ</p>
                </div>
            )}
            <div className="bg-white p-4 rounded-lg shadow-md mt-6">
                <h3 className="text-lg font-bold">📜 Giao Dịch Tiền Mặt</h3>
                {loading ? <p>Đang tải...</p> : error ? <p className="text-red-500">{error}</p> : (
                    <table className="w-full bg-white rounded-lg shadow-md mt-4">
                        <thead className="bg-blue-600 text-white">
                            <tr>
                                <th className="p-2">Ngày</th>
                                <th className="p-2">Mã Giao Dịch</th>
                                <th className="p-2">Loại</th>
                                <th className="p-2">Số Tiền</th>
                                <th className="p-2">Thực Hiện Bởi</th>
                                <th className="p-2">Mô Tả</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cashbook.map((t, index) => (
                                <tr key={index} className="border-b">
                                    <td className="p-2">{new Date(t.transactionDate).toLocaleString()}</td>
                                    <td className="p-2">{t.transactionCode}</td>
                                    <td className="p-2">{t.transactionType}</td>
                                    <td className="p-2 text-right text-green-600 font-bold">{t.amount.toLocaleString()} VNĐ</td>
                                    <td className="p-2">{t.performedBy}</td>
                                    <td className="p-2">{t.description}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};

export default CashBookOwner;
