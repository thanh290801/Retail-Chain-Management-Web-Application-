import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../../headerComponent/header";
import InventoryCheckDetail from "./InventoryCheckDetail";

const InventoryCheckHistory = () => {
    const [history, setHistory] = useState([]);
    const [filtered, setFiltered] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const [selectedAuditor, setSelectedAuditor] = useState("all");
    const [searchDate, setSearchDate] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false);
    const [modalDetails, setModalDetails] = useState([]);
    const [selectedAuditId, setSelectedAuditId] = useState(null);

    const itemsPerPage = 10;
    const navigate = useNavigate();

    useEffect(() => {
        fetch("https://localhost:5000/api/stock-audits/history")
            .then(res => res.json())
            .then(data => {
                setHistory(data || []);
                setFiltered(data || []);
            });

        fetch("https://localhost:5000/api/employee")
            .then(res => res.json())
            .then(data => setEmployees(data || []));

        fetch("https://localhost:5000/api/warehouse")
            .then(res => res.json())
            .then(data => setWarehouses(data || []));

        fetch("https://localhost:5000/api/products")
            .then(res => res.json())
            .then(data => setProducts(data || []));
    }, []);

    const getWarehouseName = (id) => {
        return warehouses.find(w => w.warehousesId === id)?.name || "N/A";
    };

    const getEmployeeName = (id) => {
        return employees.find(e => e.employeeId === id)?.fullName || "N/A";
    };

    const getProductName = (id) => {
        return products.find(p => p.productsId === id)?.name || "N/A";
    };

    const getUnit = (id) => {
        return products.find(p => p.productsId === id)?.unit || "N/A";
    };

    const openModal = (auditId) => {
        setSelectedAuditId(auditId);
        setShowModal(true);

        fetch(`https://localhost:5000/api/stock-audits/details/${auditId}`)
            .then(res => res.json())
            .then(data => setModalDetails(data || []))
            .catch(err => {
                console.error("Lỗi lấy chi tiết:", err);
                setModalDetails([]);
            });
    };

    const closeModal = () => {
        setShowModal(false);
        setModalDetails([]);
    };

    useEffect(() => {
        let filteredData = [...history];
        if (selectedWarehouse !== "all") {
            filteredData = filteredData.filter(h => h.warehouseId === parseInt(selectedWarehouse));
        }
        if (selectedAuditor !== "all") {
            filteredData = filteredData.filter(h => h.auditorId === parseInt(selectedAuditor));
        }
        if (searchDate) {
            filteredData = filteredData.filter(h => h.auditDate?.startsWith(searchDate));
        }
        setFiltered(filteredData);
        setCurrentPage(1);
    }, [selectedWarehouse, selectedAuditor, searchDate, history]);

    const pageData = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filtered.length / itemsPerPage);

    const auditorsInWarehouse = selectedWarehouse === "all"
        ? employees
        : employees.filter(e => e.branchId === parseInt(selectedWarehouse));

    return (
        <div>
            <Header />
            <div className="p-6 bg-white rounded shadow">
                <h2 className="text-xl font-semibold mb-4">📜 Lịch sử kiểm kho</h2>

                {/* Filters */}
                <div className="mb-4 flex flex-wrap gap-4">
                    <select className="border p-2 rounded" value={selectedWarehouse}
                        onChange={(e) => {
                            setSelectedWarehouse(e.target.value);
                            setSelectedAuditor("all");
                        }}>
                        <option value="all">Tất cả kho</option>
                        {warehouses.map(w => (
                            <option key={w.warehousesId} value={w.warehousesId}>{w.name}</option>
                        ))}
                    </select>

                    <select className="border p-2 rounded" value={selectedAuditor}
                        onChange={(e) => setSelectedAuditor(e.target.value)}>
                        <option value="all">Tất cả nhân viên kiểm</option>
                        {auditorsInWarehouse.map(emp => (
                            <option key={emp.employeeId} value={emp.employeeId}>{emp.fullName}</option>
                        ))}
                    </select>

                    <input type="date" className="border p-2 rounded" value={searchDate}
                        onChange={(e) => setSearchDate(e.target.value)} />
                </div>

                {/* Table */}
                <table className="w-full text-sm bg-white border rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border">#</th>
                            <th className="p-2 border">Kho</th>
                            <th className="p-2 border">Người kiểm</th>
                            <th className="p-2 border">Người đồng kiểm</th>
                            <th className="p-2 border">Ngày kiểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {pageData.length > 0 ? (
                            pageData.map((entry, index) => (
                                <tr key={entry.stockAuditRecordsId}
                                    onClick={() => openModal(entry.stockAuditRecordsId)}
                                    className="cursor-pointer hover:bg-gray-100">
                                    <td className="p-2 border">{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                    <td className="p-2 border">{getWarehouseName(entry.warehouseId)}</td>
                                    <td className="p-2 border">{getEmployeeName(entry.auditorId)}</td>
                                    <td className="p-2 border">{getEmployeeName(entry.coAuditorId)}</td>
                                    <td className="p-2 border">{entry.auditDate.slice(0, 10)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center p-2 border">Không có dữ liệu kiểm kho.</td>
                            </tr>
                        )}
                    </tbody>
                </table>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center gap-2">
                        <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>◀</button>
                        {[...Array(totalPages)].map((_, idx) => (
                            <button key={idx}
                                className={`px-2 ${idx + 1 === currentPage ? "bg-blue-500 text-white" : ""}`}
                                onClick={() => setCurrentPage(idx + 1)}>
                                {idx + 1}
                            </button>
                        ))}
                        <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>▶</button>
                    </div>
                )}

                {/* Modal */}
                {showModal && (
    <InventoryCheckDetail
        auditId={selectedAuditId}
        onClose={() => {
            setShowModal(false);
            setSelectedAuditId(null);
        }}
    />
)}

            </div>
        </div>
    );
};

export default InventoryCheckHistory;
