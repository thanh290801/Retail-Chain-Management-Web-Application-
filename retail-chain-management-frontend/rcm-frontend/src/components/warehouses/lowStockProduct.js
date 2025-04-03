import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const LowStockProducts = () => {
    const [products, setProducts] = useState([]);
    const [branchId, setBranchId] = useState(null);
    const [warehouses, setWarehouses] = useState([]);
    const [suppliers, setSuppliers] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState("all");
    const [selectedSupplier, setSelectedSupplier] = useState("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decoded = jwtDecode(token);
                console.log("✅ JWT decoded:", decoded); // ✅ LOG TOKEN
                setBranchId(decoded.BranchId ?? "0");
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    useEffect(() => {
        fetch("https://localhost:5000/api/warehouse")
            .then((res) => res.json())
            .then(setWarehouses)
            .catch((err) => console.error("Lỗi load kho:", err));

        fetch("https://localhost:5000/api/supplier")
            .then((res) => res.json())
            .then(setSuppliers)
            .catch((err) => console.error("Lỗi load NCC:", err));
    }, []);

    useEffect(() => {
        if (!branchId) return;

        let apiUrl = `https://localhost:5000/api/products/low-stock`;

        if (branchId === "0") {
            if (selectedWarehouse !== "all") {
                apiUrl += `?warehouseId=${selectedWarehouse}`;
            }
        } else {
            apiUrl += `?warehouseId=${branchId}`;
        }

        if (selectedSupplier !== "all") {
            apiUrl += apiUrl.includes("?") ? `&supplierId=${selectedSupplier}` : `?supplierId=${selectedSupplier}`;
        }

        setProducts([]); // ✅ Xoá danh sách cũ để tránh bị trùng

        fetch(apiUrl)
            .then((res) => {
                if (!res.ok) throw new Error("Lỗi load sản phẩm");
                return res.json();
            })
            .then((data) => {
                setProducts(data);
                setCurrentPage(1);
            })
            .catch((err) => console.error("Fetch error:", err));
    }, [branchId, selectedWarehouse, selectedSupplier]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productsId.toString().includes(searchTerm)
    );

    const currentItems = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const getWarehouseName = (id) => {
        const found = warehouses.find(w => w.warehousesId === id);
        return found ? found.name : "N/A";
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📉 Sản phẩm sắp hết hàng</h2>

            <div className="mb-4 flex flex-wrap gap-4">
                {branchId === "0" && (
                    <select
                        className="p-2 border rounded"
                        value={selectedWarehouse}
                        onChange={(e) => setSelectedWarehouse(e.target.value)}
                    >
                        <option value="all">Tất cả kho</option>
                        {warehouses.map(w => (
                            <option key={w.warehousesId} value={w.warehousesId}>
                                {w.name}
                            </option>
                        ))}
                    </select>
                )}

                <select
                    className="p-2 border rounded"
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                >
                    <option value="all">Tất cả nhà cung cấp</option>
                    {suppliers.map(s => (
                        <option key={s.suppliersId} value={s.suppliersId}>
                            {s.name}
                        </option>
                    ))}
                </select>

                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="p-2 border rounded w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã sản phẩm</th>
                        <th className="p-2">Tên sản phẩm</th>
                        <th className="p-2">Kho</th>
                        <th className="p-2">Số lượng tồn</th>
                        <th className="p-2">Tồn kho tối thiểu</th>
                        <th className="p-2">Đơn vị</th>
                    </tr>
                </thead>
                <tbody>
                    {currentItems.length > 0 ? (
                        currentItems.map((p) => (
                            <tr key={p.productsId} className="bg-red-100">
                                <td className="p-2">{p.productsId}</td>
                                <td className="p-2">{p.name}</td>
                                <td className="p-2">{getWarehouseName(p.warehouseId)}</td>
                                <td className="p-2 text-red-600 font-semibold">{p.quantity}</td>
                                <td className="p-2">{p.minQuantity}</td>
                                <td className="p-2">{p.unit}</td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="6" className="text-center p-4">
                                Không có sản phẩm nào sắp hết hàng.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                    <button
                        className="px-3 py-1 border rounded"
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(currentPage - 1)}
                    >
                        ◀
                    </button>
                    {[...Array(totalPages)].map((_, idx) => (
                        <button
                            key={idx}
                            className={`px-3 py-1 border rounded ${currentPage === idx + 1 ? "bg-blue-500 text-white" : ""}`}
                            onClick={() => setCurrentPage(idx + 1)}
                        >
                            {idx + 1}
                        </button>
                    ))}
                    <button
                        className="px-3 py-1 border rounded"
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(currentPage + 1)}
                    >
                        ▶
                    </button>
                </div>
            )}
        </div>
    );
};

export default LowStockProducts;
