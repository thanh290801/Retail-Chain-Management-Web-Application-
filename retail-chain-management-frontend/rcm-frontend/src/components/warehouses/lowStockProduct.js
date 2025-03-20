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

    useEffect(() => {
        // Lấy token từ localStorage và decode để lấy BranchID
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                console.log("Decoded Token:", decodedToken);
                setBranchId(decodedToken.BranchID ?? "0");
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    useEffect(() => {
        // Fetch danh sách kho
        fetch("https://localhost:5000/api/warehouses")
            .then((response) => response.json())
            .then((data) => setWarehouses(data))
            .catch((error) => console.error("Error fetching warehouses:", error));

        // Fetch danh sách nhà cung cấp
        fetch("https://localhost:5000/api/suppliers/get-all")
            .then((response) => response.json())
            .then((data) => setSuppliers(data))
            .catch((error) => console.error("Error fetching suppliers:", error));
    }, []);

    useEffect(() => {
        // Fetch danh sách sản phẩm sắp hết hàng
        let apiUrl = `https://localhost:5000/api/products/low-stock`;

        // Xử lý warehouseId
        if (branchId > 0) {
            apiUrl += `?warehouseId=${branchId}`;
        } else if (selectedWarehouse !== "all") {
            apiUrl += `?warehouseId=${selectedWarehouse}`;
        }

        // Xử lý supplierId
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
            .then((data) => setProducts(data))
            .catch((error) => console.error("Error fetching low stock products:", error));
    }, [branchId, selectedWarehouse, selectedSupplier]);

    // Lọc sản phẩm theo tên hoặc mã sản phẩm
    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.productsId.toString().includes(searchTerm)
    );

    // Lấy tên kho từ danh sách kho
    const getWarehouseName = (warehouseId) => {
        const warehouse = warehouses.find(w => w.warehousesId === warehouseId);
        return warehouse ? warehouse.name : "N/A";
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📉 Sản phẩm sắp hết hàng</h2>

            {/* Bộ lọc */}
            <div className="mb-4 flex space-x-4">
                {/* Dropdown chọn kho (chỉ hiển thị nếu BranchID = 0) */}
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

                {/* Dropdown chọn nhà cung cấp */}
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

                {/* Ô tìm kiếm sản phẩm */}
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="p-2 border rounded w-1/3"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />

                {/* Nút tạo đơn đặt hàng */}
<button
    className={`px-4 py-2 rounded ${
        selectedWarehouse !== "all" && selectedSupplier !== "all"
            ? "bg-green-500 text-white"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
    }`}
    onClick={() => {
        if (selectedWarehouse !== "all" && selectedSupplier !== "all") {
            const selectedProducts = filteredProducts.map(p => ({
                productId: p.productsId,
                quantity: p.minQuantity - p.quantity,
                supplierId: selectedSupplier
            }));
            localStorage.setItem("orderDraft", JSON.stringify(selectedProducts));
            window.location.href = "/create-order";
        }
    }}
    disabled={selectedWarehouse === "all" || selectedSupplier === "all"}
>
    Tạo đơn đặt hàng
</button>

            </div>

            {/* Bảng hiển thị danh sách sản phẩm */}
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã sản phẩm</th>
                        <th className="p-2">Tên sản phẩm</th>
                        <th className="p-2">Kho</th>
                        <th className="p-2">Số lượng tồn</th>
                        <th className="p-2">Tồn kho tối thiểu</th>
                        <th className="p-2">Đơn vị</th> {/* ✅ Thêm cột hiển thị đơn vị */}
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.length > 0 ? (
                        filteredProducts.map((product) => (
                            <tr key={product.productsId} className="bg-red-100">
                                <td className="p-2">{product.productsId}</td>
                                <td className="p-2">{product.name}</td>
                                <td className="p-2">{getWarehouseName(product.warehouseId)}</td>
                                <td className="p-2 text-red-600 font-semibold">{product.quantity}</td>
                                <td className="p-2">{product.minQuantity}</td>
                                <td className="p-2">{product.unit}</td> {/* ✅ Hiển thị đơn vị tính */}
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
        </div>
    );
};

export default LowStockProducts;
