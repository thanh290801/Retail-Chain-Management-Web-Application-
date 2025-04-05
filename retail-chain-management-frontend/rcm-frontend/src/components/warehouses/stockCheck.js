import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";
import StaffHeaderComponent from "../staffHomeConponent/staffHeader";

const StockCheck = () => {
    const navigate = useNavigate();
    const [warehouseId, setWarehouseId] = useState(null);
    const [warehouseName, setWarehouseName] = useState("");
    const [employees, setEmployees] = useState([]);
    const [auditor, setAuditor] = useState("");
    const [coAuditor, setCoAuditor] = useState("");
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [accountId, setAccountId] = useState(null);
    const [auditDate, setAuditDate] = useState(new Date().toISOString().slice(0, 16));
    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 15;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setAccountId(decoded.AccountId);
                setAuditor(decoded.AccountId);
                setWarehouseId(decoded.BranchId);
                fetchWarehouseInfo(decoded.BranchId);
                fetchEmployees(decoded.BranchId);
            } catch (err) {
                console.error("Decode lỗi:", err);
            }
        }
    }, []);

    const fetchWarehouseInfo = (branchId) => {
        fetch(`https://localhost:5000/api/warehouse/${branchId}`)
            .then(res => res.json())
            .then(data => setWarehouseName(data.name))
            .catch(err => console.error("Lỗi lấy kho:", err));
    };

    const fetchEmployees = (branchId) => {
        fetch(`https://localhost:5000/api/stock-check/employees/${branchId}`)
            .then(res => res.json())
            .then(data => setEmployees(data))
            .catch(err => console.error("Lỗi lấy nhân viên:", err));
    };

    const fetchProducts = () => {
        fetch(`https://localhost:5000/api/stock-check/products/${warehouseId}`)
            .then(res => res.json())
            .then(data => {
                const updated = data.map(p => ({
                    ...p,
                    stockQuantity: p.quantity,
                    recordedQuantity: p.quantity,
                    reason: "Không có sai lệch",
                    checked: false // ✅ mặc định chưa đánh dấu
                }));
                setProducts(updated);
            })
            .catch(err => console.error("Lỗi lấy sản phẩm:", err));
    };

    useEffect(() => {
        if (warehouseId) fetchProducts();
    }, [warehouseId]);

    const handleQuantityChange = (id, value) => {
        setProducts(prev =>
            prev.map(p => {
                if (p.productsId === id) {
                    const qty = parseInt(value) || 0;
                    const reason = qty !== p.stockQuantity ? "Sai lệch do kiểm kê" : "Không có sai lệch";
                    return { ...p, recordedQuantity: qty, reason };
                }
                return p;
            })
        );
    };

    const handleReasonChange = (id, value) => {
        setProducts(prev =>
            prev.map(p => p.productsId === id ? { ...p, reason: value || "Sai lệch do kiểm kê" } : p)
        );
    };

    const toggleChecked = (id) => {
        setProducts(prev =>
            prev.map(p => p.productsId === id ? { ...p, checked: !p.checked } : p)
        );
    };

    const handleStockCheck = () => {
        const payload = {
            warehouseId: parseInt(warehouseId),
            auditorId: parseInt(auditor),
            coAuditorId: coAuditor ? parseInt(coAuditor) : null,
            auditDate: auditDate,
            products: products.map(p => ({
                productId: p.productsId,
                recordedQuantity: parseInt(p.recordedQuantity, 10),
                stockQuantity: p.stockQuantity,
                reason: p.reason
            }))
        };

        fetch("https://localhost:5000/api/stock-check/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
            .then(res => res.json())
            .then(data => {
                if (data.error) alert("❌ Lỗi: " + data.error);
                else {
                    alert("✅ Đã tạo phiếu kiểm kho!");
                    fetchProducts();
                    navigate("/productstock");
                }
            })
            .catch(err => console.error("❌ Lỗi gửi kiểm kho:", err));
    };

    const filtered = products.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const totalPages = Math.ceil(filtered.length / productsPerPage);
    const current = filtered.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

    return (
        <div>
            <StaffHeaderComponent />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">📋 Tạo Phiếu Kiểm Kho</h2>

                <div className="mb-4">
                    <label className="block font-medium">🧭 Kho kiểm:</label>
                    <div className="p-2 border rounded bg-gray-100">{warehouseName || "Đang tải..."}</div>
                </div>

                <div className="mb-4">
                    <label className="block font-medium">🕒 Ngày giờ kiểm kho:</label>
                    <input type="datetime-local" className="p-2 border rounded w-full" value={auditDate} onChange={e => setAuditDate(e.target.value)} />
                </div>

                <div className="mb-4 flex space-x-4">
                    <div className="w-1/2">
                        <label className="block font-medium">Người kiểm kho:</label>
                        <select className="p-2 border rounded w-full" value={auditor} disabled>
                            {employees.map(emp => (
                                <option key={emp.employeeId} value={emp.employeeId}>{emp.fullName}</option>
                            ))}
                        </select>
                    </div>
                    <div className="w-1/2">
                        <label className="block font-medium">Người đồng kiểm:</label>
                        <select
                            className="p-2 border rounded w-full"
                            value={coAuditor}
                            onChange={(e) => setCoAuditor(e.target.value)}
                        >
                            <option value="">-- Chọn --</option>
                            {employees
                                .filter(emp => emp.employeeId !== parseInt(auditor))
                                .map(emp => (
                                    <option key={emp.employeeId} value={emp.employeeId}>
                                        {emp.fullName}
                                    </option>
                                ))}
                        </select>
                    </div>
                </div>

                <input
                    type="text"
                    placeholder="🔍 Tìm kiếm sản phẩm..."
                    className="p-2 border rounded w-full mb-4"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                    }}
                />

                <table className="w-full bg-white shadow-md rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">Mã SP</th>
                            <th className="p-2">Tên</th>
                            <th className="p-2">Đơn vị</th>
                            <th className="p-2">Tồn kho</th>
                            <th className="p-2">SL thực tế</th>
                            <th className="p-2">Lý do</th>
                            <th className="p-2">Đánh dấu đã kiểm</th>
                        </tr>
                    </thead>
                    <tbody>
                        {current.map(p => (
                            <tr key={p.productsId} className={p.checked ? "bg-green-100" : ""}>
                                <td className="p-2">{p.productsId}</td>
                                <td className="p-2">{p.name}</td>
                                <td className="p-2">{p.unit}</td>
                                <td className="p-2">{p.stockQuantity}</td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0"
                                        disabled={p.checked}
                                        className="p-1 border rounded w-20 bg-white"
                                        value={p.recordedQuantity}
                                        onChange={(e) => handleQuantityChange(p.productsId, e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    {p.stockQuantity !== p.recordedQuantity ? (
                                        <input
                                            type="text"
                                            disabled={p.checked}
                                            className="p-1 border rounded w-full bg-white"
                                            value={p.reason}
                                            onChange={(e) => handleReasonChange(p.productsId, e.target.value)}
                                        />
                                    ) : (
                                        <span className="italic text-gray-500">Không có sai lệch</span>
                                    )}
                                </td>
                                <td className="p-2 text-center">
                                    <button
                                        onClick={() => toggleChecked(p.productsId)}
                                        className={`text-sm px-2 py-1 rounded ${p.checked ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}
                                    >
                                        {p.checked ? "❌ Hủy" : "✅ Đã kiểm"}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`px-4 py-2 rounded ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                            >
                                {index + 1}
                            </button>
                        ))}
                    </div>
                )}

                <button
                    className={`mt-6 w-full py-2 rounded ${products.length === 0 ? 'bg-gray-400' : 'bg-blue-500 text-white'}`}
                    onClick={handleStockCheck}
                    disabled={products.length === 0}
                >
                    ✅ Tạo Phiếu Kiểm Kho
                </button>
            </div>
        </div>
    );
};

export default StockCheck;
