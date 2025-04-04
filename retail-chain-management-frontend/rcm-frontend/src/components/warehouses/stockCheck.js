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

    const [currentPage, setCurrentPage] = useState(1);
    const productsPerPage = 15;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setAccountId(decodedToken.AccountId);
                setAuditor(decodedToken.AccountId);
                setWarehouseId(decodedToken.BranchId);
                fetchWarehouseInfo(decodedToken.BranchId);
                fetchEmployees(decodedToken.BranchId);
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    const fetchWarehouseInfo = (branchId) => {
        fetch(`https://localhost:5000/api/warehouse/${branchId}`)
            .then(response => response.json())
            .then(data => setWarehouseName(data.name))
            .catch(error => console.error("Lỗi khi lấy tên kho:", error));
    };

    const fetchEmployees = (branchId) => {
        fetch(`https://localhost:5000/api/stock-check/employees/${branchId}`)
            .then(response => response.json())
            .then(data => setEmployees(data))
            .catch(error => console.error("Lỗi khi lấy danh sách nhân viên:", error));
    };

    const fetchProducts = () => {
        fetch(`https://localhost:5000/api/stock-check/products/${warehouseId}`)
            .then(response => response.json())
            .then(data => {
                const updatedProducts = data.map(product => ({
                    ...product,
                    recordedQuantity: product.quantity
                }));
                setProducts(updatedProducts);
            })
            .catch(error => console.error("Error fetching products:", error));
    };

    useEffect(() => {
        if (warehouseId) {
            fetchProducts();
        }
    }, [warehouseId]);

    const handleQuantityChange = (productsId, quantity) => {
        setProducts(prev =>
            prev.map(p =>
                p.productsId === productsId ? { ...p, recordedQuantity: parseInt(quantity) || 0 } : p
            )
        );
    };

    const handleStockCheck = () => {
        const requestPayload = {
            warehouseId: parseInt(warehouseId),
            auditorId: parseInt(auditor),
            coAuditorId: coAuditor ? parseInt(coAuditor) : null,
            products: products.map(p => ({
                productId: p.productsId,
                recordedQuantity: parseInt(p.recordedQuantity, 10)
            }))
        };

        fetch("https://localhost:5000/api/stock-check/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestPayload)
        })
            .then(response => response.json())
            .then(data => {
                if (data.error) {
                    alert("❌ Lỗi: " + data.error);
                } else {
                    alert("✅ Phiếu kiểm kho đã được tạo!");
                    fetchProducts();
                    const adjustmentId = data.stockAdjustmentsId;
                    if (adjustmentId && !isNaN(adjustmentId)) {
                        navigate(`/stock-adjustment/${adjustmentId}`);
                    }
                }
            })
            .catch(error => console.error("❌ Lỗi khi gửi yêu cầu kiểm kho:", error));
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(filteredProducts.length / productsPerPage);

    return (
        <div>
            <StaffHeaderComponent />
            <div className="p-6 bg-white rounded-lg shadow-md">
                <h2 className="text-xl font-semibold mb-4">📋 Tạo Phiếu Kiểm Kho</h2>

                <div className="mb-4">
                    <label className="block font-medium">Kho kiểm:</label>
                    <div className="p-2 border rounded bg-gray-100">{warehouseName || "Đang tải..."}</div>
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
                            <option value="">-- Chọn người đồng kiểm --</option>
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
                    placeholder="Tìm kiếm sản phẩm..."
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
                            <th className="p-2">Mã sản phẩm</th>
                            <th className="p-2">Tên sản phẩm</th>
                            <th className="p-2">Đơn vị</th>
                            <th className="p-2">Tồn kho</th>
                            <th className="p-2">SL thực tế</th>
                        </tr>
                    </thead>
                    <tbody>
                        {currentProducts.map(product => (
                            <tr key={product.productsId}>
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{product.unit}</td>
                                <td className="p-2">{product.quantity}</td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0"
                                        className="p-1 border rounded w-20"
                                        value={product.recordedQuantity}
                                        onChange={(e) => handleQuantityChange(product.productsId, e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {/* PHÂN TRANG */}
                {totalPages > 1 && (
                    <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: totalPages }, (_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentPage(index + 1)}
                                className={`px-4 py-2 rounded ${currentPage === index + 1
                                    ? 'bg-blue-500 text-white'
                                    : 'bg-gray-200'
                                    }`}
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
