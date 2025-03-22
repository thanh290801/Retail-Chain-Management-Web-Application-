import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../headerComponent/header";

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
            if (selectedBranch && selectedBranch !== "all") {
                params.append("branchId", selectedBranch);
            }
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
        <div className="bg-white p-2 rounded-lg shadow-md mt-6">
            <Header />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
                <select
                    className="p-2 border rounded"
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}>
                    <option value="">Chọn Chi Nhánh</option>
                    <option value="all">Tất cả Chi Nhánh</option>
                    {branches.map((branch) => (
                        <option key={branch.warehousesId} value={branch.warehousesId}>
                            {branch.name}
                        </option>
                    ))}
                </select>
                <input type="date" className="p-2 border rounded" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                <input type="date" className="p-2 border rounded" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                <button onClick={fetchSummary} className="px-4 py-2 bg-green-500 text-white rounded-lg font-semibold shadow-md">📊 Xem Tổng Kết</button>
            </div>

            <h2 className="text-2xl font-bold text-gray-700 mt-6">Thông tin tài chính</h2>
            <div className="flex justify-around mt-4">
                <div className="p-4 bg-blue-100 text-blue-700 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">💰 Tổng doanh thu</h3>
                    <p className="text-2xl font-bold text-green-600">
                        {summary?.totalRevenue?.toLocaleString() || "0"} VNĐ
                    </p>
                </div>

                <div className="p-4 bg-green-100 text-green-700 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">📥 Doanh thu tiền mặt</h3>
                    <p className="text-2xl font-bold">
                        {summary?.totalCash?.toLocaleString() || "0"} VNĐ
                    </p>
                </div>

                <div className="p-4 bg-yellow-100 text-yellow-700 rounded-lg shadow-md">
                    <h3 className="text-lg font-semibold">📤 Doanh thu chuyển khoản</h3>
                    <p className="text-2xl font-bold">
                        {summary?.totalBank?.toLocaleString() || "0"} VNĐ
                    </p>
                </div>
            </div>


        </div >
    );
};

export default CashBookOwner;
