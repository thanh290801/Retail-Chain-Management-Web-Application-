// ✅ FILE 1: LowStockProducts.jsx
import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";

const LowStockProducts = () => {
    const [products, setProducts] = useState([]);
    const [branchId, setBranchId] = useState("0");
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
                const decodedToken = jwtDecode(token);
                setBranchId(decodedToken.BranchID ?? "0");
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    useEffect(() => {
        fetch("https://localhost:5000/api/warehouses")
            .then((response) => response.json())
            .then((data) => setWarehouses(data))
            .catch((error) => console.error("Error fetching warehouses:", error));

        fetch("https://localhost:5000/api/suppliers/get-all")
            .then((response) => response.json())
            .then((data) => setSuppliers(data))
            .catch((error) => console.error("Error fetching suppliers:", error));
    }, []);

    useEffect(() => {
        let apiUrl = `https://localhost:5000/api/products/low-stock`;

        if (branchId > 0) {
            apiUrl += `?warehouseId=${branchId}`;
        } else if (selectedWarehouse !== "all") {
            apiUrl += `?warehouseId=${selectedWarehouse}`;
        }

        if (selectedSupplier !== "all") {
            apiUrl += apiUrl.includes("?") ? `&supplierId=${selectedSupplier}` : `?supplierId=${selectedSupplier}`;
        }

        fetch(apiUrl)
            .then((response) => {
                if (!response.ok) {
                    throw new Error(`https error! Status: ${response.status}`);
                }
                return response.json();
            })
            .then((data) => {
                setProducts(data);
                setCurrentPage(1);
            })
            .catch((error) => console.error("Error fetching low stock products:", error));
    }, [branchId, selectedWarehouse, selectedSupplier]);

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productsId.toString().includes(searchTerm)
    );

    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    const getWarehouseName = (warehouseId) => {
        const warehouse = warehouses.find(w => w.warehousesId === warehouseId);
        return warehouse ? warehouse.name : "N/A";
    };

    const handleCreateOrder = () => {
        if (branchId === "0" && selectedWarehouse === "all") return;
    
        const productsToOrder = [];
        const unresolvedProducts = [];
    
        filteredProducts.forEach((p) => {
            const quantity = p.minQuantity - p.quantity;
            const productInfo = {
                productId: p.productsId,
                productName: p.name,
                unit: p.unit,
                quantity,
                price: p.purchasePrice
            };
    
            if (selectedSupplier !== "all") {
                productsToOrder.push({
                    ...productInfo,
                    supplierId: selectedSupplier
                });
            } else {
                if (p.supplierIds?.length === 1) {
                    productsToOrder.push({
                        ...productInfo,
                        supplierId: p.supplierIds[0]
                    });
                } else {
                    unresolvedProducts.push({
                        ...productInfo,
                        supplierOptions: p.supplierIds
                    });
                }
            }
        });
    
        const draft = {
            resolved: productsToOrder,
            unresolved: unresolvedProducts
        };
    
        localStorage.setItem("orderDraft", JSON.stringify(draft));
    
        // ✅ Nếu người dùng là chủ thì lưu thêm warehouse được chọn
        if (branchId === "0" && selectedWarehouse !== "all") {
            localStorage.setItem("selectedWarehouseId", selectedWarehouse);
        }
    
        window.location.href = "/create-order";
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
                        {warehouses.map((warehouse) => (
                            <option key={warehouse.warehousesId} value={warehouse.warehousesId}>
                                {warehouse.name}
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
                    {suppliers.map((supplier) => (
                        <option key={supplier.suppliersId} value={supplier.suppliersId}>
                            {supplier.name}
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

                <button
                    className={`px-4 py-2 rounded ${
                        (branchId === "0" && selectedWarehouse === "all")
                            ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                            : "bg-green-500 text-white"
                    }`}
                    onClick={handleCreateOrder}
                >
                    Tạo đơn đặt hàng
                </button>
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
                        currentItems.map((product) => (
                            <tr key={product.productsId} className="bg-red-100">
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{getWarehouseName(product.warehouseId)}</td>
                                <td className="p-2 text-red-600 font-semibold">{product.quantity}</td>
                                <td className="p-2">{product.minQuantity}</td>
                                <td className="p-2">{product.unit}</td>
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
                <div className="mt-4 flex justify-center items-center space-x-2">
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
                            className={`px-3 py-1 border rounded ${
                                currentPage === idx + 1 ? "bg-blue-500 text-white" : ""
                            }`}
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
