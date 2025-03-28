import React, { useEffect, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const StockCheck = () => {
    const navigate = useNavigate();
    const [warehouseId, setWarehouseId] = useState(null);
    const [warehouseName, setWarehouseName] = useState(""); // Tên kho
    const [employees, setEmployees] = useState([]);
    const [auditor, setAuditor] = useState("");
    const [coAuditor, setCoAuditor] = useState("");
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [isButtonDisabled, setIsButtonDisabled] = useState(true);
    const [accountId, setAccountId] = useState(null);

    // Lấy thông tin từ token
    useEffect(() => {
        const token = localStorage.getItem("token");
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setAccountId(decodedToken.AccountId);
                setAuditor(decodedToken.AccountId); // Người kiểm kho là người đăng nhập
                setWarehouseId(decodedToken.BranchId); // Lấy kho từ token
                fetchWarehouseInfo(decodedToken.BranchId); // Lấy tên kho
                fetchEmployees(decodedToken.BranchId); // Lấy danh sách nhân viên
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, []);

    // Lấy thông tin kho từ API
    const fetchWarehouseInfo = (branchId) => {
        fetch(`https://localhost:5000/api/warehouse/${branchId}`)
            .then(response => response.json())
            .then(data => setWarehouseName(data.name))
            .catch(error => console.error("Lỗi khi lấy tên kho:", error));
    };

    // Lấy danh sách nhân viên cùng chi nhánh
    const fetchEmployees = (branchId) => {
        fetch(`https://localhost:5000/api/stock-check/employees/${branchId}`)
            .then(response => response.json())
            .then(data => setEmployees(data))
            .catch(error => console.error("Lỗi khi lấy danh sách nhân viên:", error));
    };

    // Lấy danh sách sản phẩm trong kho
    const fetchProducts = () => {
        fetch(`https://localhost:5000/api/stock-check/products/${warehouseId}`)
            .then(response => response.json())
            .then(data => {
                const updatedProducts = data.map(product => ({
                    ...product,
                    recordedQuantity: product.quantity // Gán mặc định bằng số lượng tồn kho
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

    useEffect(() => {
        setIsButtonDisabled(!warehouseId || !auditor || products.length === 0);
    }, [warehouseId, auditor, products]);

    // Cập nhật số lượng thực tế
    const handleQuantityChange = (productsId, quantity) => {
        setProducts(prevProducts =>
            prevProducts.map(p =>
                p.productsId === productsId ? { ...p, recordedQuantity: parseInt(quantity) || 0 } : p
            )
        );
    };
    

    const handleStockCheck = () => {
        if (isButtonDisabled || !accountId) return;
    
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
            console.log("Phản hồi API:", data); // Kiểm tra phản hồi API
            
            if (data.error) {
                alert("❌ Lỗi khi tạo phiếu kiểm kho: " + data.error);
            } else {
                alert("✅ Phiếu kiểm kho đã được tạo!");
                fetchProducts();
    
                // 🔥 Đảm bảo lấy đúng `stockAdjustmentsId`
                const adjustmentId = data.stockAdjustmentsId;
    
                if (adjustmentId && !isNaN(adjustmentId)) {
                    navigate(`/stock-adjustment/${adjustmentId}`); // Điều hướng với ID hợp lệ
                } else {
                    console.error("❌ Không tìm thấy stockAdjustmentsId trong phản hồi API.");
                }
            }
        })
        .catch(error => console.error("❌ Lỗi khi gửi yêu cầu kiểm kho:", error));
    };
    

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📋 Tạo Phiếu Kiểm Kho</h2>

            {/* Hiển thị tên kho */}
            <div className="mb-4">
                <label className="block font-medium">Kho kiểm:</label>
                <div className="p-2 border rounded bg-gray-100">{warehouseName || "Đang tải..."}</div>
            </div>

            {/* Chọn nhân viên kiểm kho */}
            <div className="mb-4 flex space-x-4">
                <div className="w-1/2">
                    <label className="block font-medium">Người kiểm kho:</label>
                    <select className="p-2 border rounded w-full" value={auditor} disabled>
                        {employees.map(emp => <option key={emp.employeeId} value={emp.employeeId}>{emp.fullName}</option>)}
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
            .filter(emp => emp.employeeId !== parseInt(auditor)) // Ẩn người kiểm kho
            .map(emp => (
                <option key={emp.employeeId} value={emp.employeeId}>
                    {emp.fullName}
                </option>
            ))}
    </select>
</div>
            </div>

            {/* Thanh tìm kiếm sản phẩm */}
            <div className="mt-6">
                <input
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    className="p-2 border rounded w-full mb-4"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            {/* Danh sách sản phẩm */}
            <table className="w-full bg-white shadow-md rounded mt-4">
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
                    {products
                        .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(product => (
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

            {/* Nút tạo phiếu kiểm kho */}
            <button className={`mt-4 px-4 py-2 rounded w-full ${isButtonDisabled ? "bg-gray-400" : "bg-blue-500 text-white"}`} disabled={isButtonDisabled} onClick={handleStockCheck}>
                ✅ Tạo Phiếu Kiểm Kho
            </button>
        </div>
    );
};

export default StockCheck;
