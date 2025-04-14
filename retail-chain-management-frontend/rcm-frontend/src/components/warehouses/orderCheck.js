import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import StaffHeaderComponent from "../staffHomeConponent/staffHeader";

const formatCurrency = (value) => {
    return new Intl.NumberFormat("vi-VN", {
        style: "currency",
        currency: "VND"
    }).format(value);
};

const ITEMS_PER_PAGE = 15;

const OrderCheck = () => {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);

    useEffect(() => {
        if (orderId) fetchOrder();
    }, [orderId]);

    const fetchOrder = async () => {
        try {
            const res = await axios.get(`https://localhost:5000/api/PurchaseOrders/${orderId}`);
            const data = res.data;
            setOrder(data);

            const mapped = data.items.map(item => {
                const remainingQty = item.quantityOrdered - (item.quantityReceived || 0);
                return {
                    productId: item.productId,
                    productName: item.productName,
                    quantityOrdered: item.quantityOrdered,
                    quantityReceived: item.quantityReceived || 0,
                    quantityToReceive: 0,
                    purchasePrice: item.purchasePrice || 0,
                    unit: item.unit || "",
                    remainingQty
                };
            });

            setProducts(mapped);
        } catch (err) {
            console.error("❌ Lỗi tải đơn hàng:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleQuantityChange = (index, value) => {
        const input = parseInt(value) || 0;
        setProducts(prev =>
            prev.map((p, i) =>
                i === index
                    ? {
                          ...p,
                          quantityToReceive: input > p.remainingQty ? p.remainingQty : input
                      }
                    : p
            )
        );
    };

    const handleReceiveOrder = async () => {
        const validItems = products.filter(p => p.quantityToReceive > 0);
        if (!validItems.length) {
            alert("⚠️ Vui lòng nhập số lượng nhận hợp lệ.");
            return;
        }

        try {
            const payload = {
                branchId: order.branchId || order.branchID || order.warehousesId || 0,
                products: validItems.map(p => ({
                    productId: p.productId,
                    receivedQuantity: p.quantityToReceive,
                    purchasePrice: p.purchasePrice
                }))
            };

            await axios.post(
                `https://localhost:5000/api/orders/${orderId}/receive`,
                payload
            );

            alert("Nhận hàng thành công");
            navigate("/orderlist");
        } catch (err) {
            console.error("❌ Lỗi nhận hàng:", err);
            alert(err.response?.data || "Có lỗi xảy ra khi nhận hàng.");
        }
    };

    const totalAmount = products.reduce(
        (sum, p) => sum + p.quantityToReceive * p.purchasePrice,
        0
    );

    const totalPages = Math.ceil(products.length / ITEMS_PER_PAGE);
    const paginatedProducts = products.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    const hasChanges = products.some(p => p.quantityToReceive > 0);

    if (loading) return <p className="p-4">⏳ Đang tải dữ liệu đơn hàng...</p>;
    if (!order) return <p className="p-4 text-red-600">Không tìm thấy đơn hàng.</p>;

    return (
        <div>
            <StaffHeaderComponent />
            <div>
            <button
                        onClick={() => navigate("/orderlist")}
                        className="border px-4 py-2 rounded"
                    >
                        ⬅️ Quay lại danh sách đơn hàng
                    </button>
            </div>
            <div className="container mx-auto p-6">
                <h2 className="text-2xl font-bold mb-4">📥 Nhận hàng cho đơn #{orderId}</h2>

                <div className="mb-4 space-y-1">
                    <p><strong>🏬 Kho:</strong> {order.warehouseName || "Không rõ"}</p>
                    <p><strong>🏢 Nhà cung cấp:</strong> {order.supplierName || "Không rõ"}</p>
                    <p><strong>📝 Ghi chú:</strong> {order.notes || "(Không có ghi chú)"}</p>
                </div>

                <table className="w-full border text-sm">
                    <thead className="bg-gray-100">
                        <tr>
                            <th className="p-2 border">Sản phẩm</th>
                            <th className="p-2 border">Đơn vị</th>
                            <th className="p-2 border">SL đặt</th>
                            <th className="p-2 border">Đã nhận</th>
                            <th className="p-2 border">Nhận thêm</th>
                            <th className="p-2 border">Giá nhập</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedProducts.map((p, idx) => {
                            const isFullyReceived = p.remainingQty <= 0;
                            return (
                                <tr key={p.productId} className={isFullyReceived ? "bg-gray-100 text-gray-400" : ""}>
                                    <td className="border px-2">{p.productName}</td>
                                    <td className="border text-center">{p.unit}</td>
                                    <td className="border text-center">{p.quantityOrdered}</td>
                                    <td className="border text-center text-blue-600">{p.quantityReceived}</td>
                                    <td className="border text-center">
                                        <input
                                            type="number"
                                            min="0"
                                            max={p.remainingQty}
                                            disabled={isFullyReceived}
                                            value={p.quantityToReceive}
                                            onChange={e =>
                                                handleQuantityChange(
                                                    (currentPage - 1) * ITEMS_PER_PAGE + idx,
                                                    e.target.value
                                                )
                                            }
                                            className="w-20 p-1 border rounded text-center bg-white"
                                        />
                                    </td>
                                    <td className="border text-right pr-2">{formatCurrency(p.purchasePrice)}</td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {totalPages > 1 && (
                    <div className="flex justify-center mt-4 gap-2">
                        {Array.from({ length: totalPages }, (_, i) => (
                            <button
                                key={i}
                                onClick={() => setCurrentPage(i + 1)}
                                className={`px-3 py-1 rounded border ${
                                    currentPage === i + 1 ? "bg-blue-500 text-white" : "bg-gray-200"
                                }`}
                            >
                                {i + 1}
                            </button>
                        ))}
                    </div>
                )}

                <div className="mt-4 text-green-700 text-md font-semibold">
                    💰 Tổng tiền nhập lần này:{" "}
                    <span className="font-bold">{formatCurrency(totalAmount)}</span>
                </div>

                <div className="mt-6 flex gap-4">
                    <button
                        className={`${
                            hasChanges
                                ? "bg-green-600 hover:bg-green-700 text-white"
                                : "bg-gray-400 text-white cursor-not-allowed"
                        } font-bold py-2 px-4 rounded`}
                        onClick={handleReceiveOrder}
                        disabled={!hasChanges}
                    >
                        ✅ Xác nhận nhận hàng
                    </button>
                    
                </div>
            </div>
        </div>
    );
};

export default OrderCheck;