import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const PurchaseOrder = () => {
    const navigate = useNavigate();
    const [orderDraft, setOrderDraft] = useState([]);

    useEffect(() => {
        // Lấy danh sách sản phẩm từ localStorage (được lưu từ màn hình LowStockProducts)
        const storedOrder = localStorage.getItem("orderDraft");
        if (storedOrder) {
            setOrderDraft(JSON.parse(storedOrder));
        }
    }, []);

    const handleConfirmOrder = () => {
        if (orderDraft.length === 0) {
            alert("Không có sản phẩm nào trong đơn đặt hàng.");
            return;
        }

        // Gửi dữ liệu đơn hàng đến backend (giả sử API có sẵn)
        fetch("https://localhost:5000/api/orders/create", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: orderDraft })
        })
        .then(response => response.json())
        .then(data => {
            alert("Đơn đặt hàng đã được tạo thành công!");
            localStorage.removeItem("orderDraft"); // Xóa bản nháp đơn hàng sau khi đặt thành công
            navigate("/orders"); // Chuyển về trang danh sách đơn hàng
        })
        .catch(error => console.error("Error creating order:", error));
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📦 Tạo đơn đặt hàng</h2>

            {orderDraft.length === 0 ? (
                <p className="text-center text-gray-600">Không có sản phẩm nào trong đơn đặt hàng.</p>
            ) : (
                <table className="w-full bg-white shadow-md rounded">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2">Mã sản phẩm</th>
                            <th className="p-2">Số lượng đặt</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orderDraft.map((item, index) => (
                            <tr key={index}>
                                <td className="p-2">{item.productId}</td>
                                <td className="p-2">{item.quantity}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            <div className="mt-4 flex justify-end space-x-2">
                <button
                    className="bg-gray-500 text-white px-4 py-2 rounded"
                    onClick={() => navigate("/low-stock")}
                >
                    Quay lại
                </button>
                <button
                    className="bg-blue-500 text-white px-4 py-2 rounded"
                    onClick={handleConfirmOrder}
                    disabled={orderDraft.length === 0}
                >
                    Xác nhận đơn hàng
                </button>
            </div>
        </div>
    );
};

export default PurchaseOrder;
