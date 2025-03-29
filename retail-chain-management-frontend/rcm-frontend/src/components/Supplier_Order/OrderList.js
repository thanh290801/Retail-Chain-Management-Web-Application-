import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";

const OwnerOrderList = () => {
    const [orders, setOrders] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [dateFrom, setDateFrom] = useState("");
    const [dateTo, setDateTo] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const navigate = useNavigate();

    useEffect(() => {
        axios.get("https://localhost:5000/api/PurchaseOrders")
            .then(res => setOrders(res.data))
            .catch(err => console.error("Lỗi khi lấy danh sách đơn hàng:", err));
    }, []);

    const filteredOrders = orders.filter(order => {
        const matchesSearch = order.supplierName?.toLowerCase().includes(searchTerm.toLowerCase())
            || order.purchaseOrdersId.toString().includes(searchTerm);

        const matchesStatus = !statusFilter || order.status === statusFilter;

        const orderDate = new Date(order.orderDate);
        const fromDate = dateFrom ? new Date(dateFrom) : null;
        const toDate = dateTo ? new Date(dateTo) : null;
        const matchesDate = (!fromDate || orderDate >= fromDate) && (!toDate || orderDate <= toDate);

        return matchesSearch && matchesStatus && matchesDate;
    });

    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const currentOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

    const handlePageChange = (page) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    useEffect(() => {
        setCurrentPage(1); // reset về trang đầu khi filter thay đổi
    }, [searchTerm, statusFilter, dateFrom, dateTo]);

    return (
        <div>
            <Header/>
            <div className="p-6 max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold mb-4 text-gray-800">📋 Danh sách đơn hàng</h2>

            {/* Bộ lọc */}
            <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                <input
                    type="text"
                    placeholder="🔍 Tìm theo mã đơn hoặc nhà cung cấp..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full shadow-sm"
                />

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full shadow-sm"
                >
                    <option value="">-- Lọc theo trạng thái --</option>
                    <option value="Chưa nhận hàng">Chưa nhận hàng</option>
                    <option value="Đã nhận hàng">Đã nhận hàng</option>
                    <option value="Nhận một phần">Nhận một phần</option>
                </select>

                <input
                    type="date"
                    value={dateFrom}
                    onChange={(e) => setDateFrom(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full shadow-sm"
                />

                <input
                    type="date"
                    value={dateTo}
                    onChange={(e) => setDateTo(e.target.value)}
                    className="border border-gray-300 rounded px-4 py-2 w-full shadow-sm"
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full border text-sm">
                    <thead className="bg-gray-100 text-left">
                        <tr>
                            <th className="p-2">Mã đơn</th>
                            <th className="p-2">Ngày đặt</th>
                            <th className="p-2">Nhà cung cấp</th>
                            <th className="p-2">Ghi chú</th>
                            <th className="p-2">Tổng tiền</th>
                            <th className="p-2">Trạng thái</th>
                            <th className="p-2 text-center">Xem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentOrders.length > 0 ? (
                            currentOrders.map(order => (
                                <tr key={order.purchaseOrdersId} className="border-t">
                                    <td className="p-2">{order.purchaseOrdersId}</td>
                                    <td className="p-2">{new Date(order.orderDate).toLocaleString()}</td>
                                    <td className="p-2">{order.supplierName}</td>
                                    <td className="p-2">{order.notes || "-"}</td>
                                    <td className="p-2">{order.totalCost.toLocaleString()} VNĐ</td>
                                    <td className="p-2">{order.status}</td>
                                    <td className="p-2 text-center">
                                        <button
                                            onClick={() => navigate(`/purchaseorderdetail/${order.purchaseOrdersId}`)}
                                            className="text-blue-600 hover:underline"
                                        >
                                            Xem
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="7" className="text-center py-4 text-gray-500">Không tìm thấy đơn hàng nào.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Phân trang */}
            {totalPages > 1 && (
                <div className="flex justify-center mt-6 gap-1 flex-wrap">
                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
                    >
                        ⬅️ Trước
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i + 1}
                            onClick={() => handlePageChange(i + 1)}
                            className={`px-3 py-1 rounded border text-sm ${currentPage === i + 1
                                ? "bg-blue-600 text-white"
                                : "bg-white text-gray-700"}`}
                        >
                            {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages}
                        className="px-3 py-1 rounded border text-sm bg-white disabled:opacity-50"
                    >
                        Tiếp ➡️
                    </button>
                </div>
            )}
            <td><button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/CreatePurchaseOrder")}>
                ⬅️ Tạo đơn hàng
            </button></td>
        </div>
        </div>
    );
};

export default OwnerOrderList;
