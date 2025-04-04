import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import StaffHeaderComponent from "../staffHomeConponent/staffHeader";

const StockAdjustment = () => {
    const { stockadjustmentId } = useParams();
    const navigate = useNavigate();
    const [adjustment, setAdjustment] = useState(null);
    const [adjustedProducts, setAdjustedProducts] = useState([]);

    useEffect(() => {
        fetch(`https://localhost:5000/api/stock-check/adjustments/${stockadjustmentId}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`Lỗi API: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                console.log("Phản hồi API:", data); // Kiểm tra dữ liệu API
                console.log("Sản phẩm:", data.products); // Kiểm tra sản phẩm có dữ liệu không
    
                setAdjustment(data);
                setAdjustedProducts(
                    data.products.map(p => ({
                        ...p,
                        reason: p.reason || "" // ✅ Khởi tạo lý do nếu chưa có
                    }))
                );
            })
            .catch(error => console.error("❌ Lỗi khi lấy danh sách điều chỉnh:", error));
    }, [stockadjustmentId]);
    
    // Cập nhật số lượng điều chỉnh
    const handleQuantityChange = (productId, quantity) => {
        setAdjustedProducts(prev =>
            prev.map(p =>
                p.productId === productId ? { ...p, adjustedQuantity: parseInt(quantity) || 0 } : p
            )
        );
    };

    // Cập nhật lý do điều chỉnh
    const handleReasonChange = (productId, reason) => {
        setAdjustedProducts(prev =>
            prev.map(p =>
                p.productId === productId ? { ...p, reason: reason } : p
            )
        );
    };

    // Gửi yêu cầu lưu điều chỉnh
    const handleSaveAdjustment = () => {
        if (!adjustment) return;
    
        const payload = {
            adjustmentId: adjustment.stockAdjustmentsId, // ✅ Đảm bảo gửi ID phiếu điều chỉnh đúng
            warehouseId: adjustment.warehouseId,
            auditorId: adjustment.auditorId,
            products: adjustedProducts.map(p => ({
                productId: Number(p.productId),
                previousQuantity: Number(p.previousQuantity),
                adjustedQuantity: Number(p.adjustedQuantity),
                reason: p.reason || "Sai lệch kiểm kho"
            }))
        };
    
        console.log("📦 JSON gửi lên API:", JSON.stringify(payload, null, 2));
    
        fetch("https://localhost:5000/api/stock-check/adjustments/update", {
            method: "PUT",  // ✅ Đổi từ POST -> PUT
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        })
        .then(response => {
            if (!response.ok) {
                return response.text().then(text => { throw new Error(text) });
            }
            return response.json();
        })
        .then(() => {
            alert("✅ Đã cập nhật phiếu điều chỉnh!");
            navigate("/staffHome");
        })
        .catch(error => console.error("❌ Lỗi khi cập nhật phiếu điều chỉnh:", error));
    };
    
    return (
        <div>
            <StaffHeaderComponent/>
            <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📋 Phiếu Điều Chỉnh Số Lượng</h2>
            <table className="w-full bg-white shadow-md rounded mt-4">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã Sản Phẩm</th>
                        <th className="p-2">Tên Sản Phẩm</th>
                        <th className="p-2">SL Cũ</th>
                        <th className="p-2">SL Mới</th>
                        <th className="p-2">Lý Do</th>
                    </tr>
                </thead>
                <tbody>
                    {adjustedProducts.length > 0 ? (
                        adjustedProducts.map(product => (
                            <tr key={product.productId}>
                                <td className="p-2">{product.productId}</td>
                                <td className="p-2">{product.productName}</td>
                                <td className="p-2">{product.previousQuantity}</td>
                                <td className="p-2">
                                    <input
                                        type="number"
                                        min="0"
                                        className="p-1 border rounded w-20"
                                        value={product.adjustedQuantity}
                                        onChange={(e) => handleQuantityChange(product.productId, e.target.value)}
                                    />
                                </td>
                                <td className="p-2">
                                    <input
                                        type="text"
                                        className="p-1 border rounded w-full"
                                        value={product.reason}
                                        placeholder="Nhập lý do..."
                                        onChange={(e) => handleReasonChange(product.productId, e.target.value)}
                                    />
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan="5" className="p-2 text-center">Không có dữ liệu</td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Nút lưu điều chỉnh */}
            <button
                className="mt-4 px-4 py-2 rounded w-full bg-blue-500 text-white"
                onClick={handleSaveAdjustment}
            >
                ✅ Lưu Điều Chỉnh
            </button>
        </div>
        </div>
    );
};

export default StockAdjustment;
