import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash } from "react-icons/fa";

const PurchaseOrderDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState(null);
    const [editing, setEditing] = useState(false);
    const [items, setItems] = useState([]);

    const currentUserRole = localStorage.getItem("role"); // 'Owner' or 'Staff'

    useEffect(() => {
        axios.get(`https://localhost:5000/api/PurchaseOrders/${id}/details`)
            .then(res => {
                setOrder(res.data);
                setItems(res.data.items);
                setEditing(res.data.status === "Chưa nhận hàng" && currentUserRole === "Owner");
            })
            .catch(err => {
                console.error("Lỗi khi tải chi tiết:", err);
                alert("Không tìm thấy đơn hàng.");
                navigate("/OrderList");
            });
    }, [id]);

    const handleQuantityChange = (index, value) => {
        const updated = [...items];
        updated[index].quantityOrdered = Math.max(1, parseInt(value) || 1);
        setItems(updated);
    };

    const handleRemove = (productId) => {
        if (window.confirm("Xóa sản phẩm này khỏi đơn hàng?")) {
            setItems(prev => prev.filter(item => item.productId !== productId));
        }
    };

    const handleSave = () => {
        const payload = items.map(i => ({
            productId: i.productId,
            quantityOrdered: i.quantityOrdered
        }));

        axios.put(`https://localhost:5000/api/PurchaseOrders/${id}/items`, payload)
            .then(() => {
                alert("Đã lưu thành công!");
                navigate("/OrderList");
            })
            .catch(err => {
                console.error("Lỗi khi lưu:", err);
                alert("Lỗi khi lưu thay đổi.");
            });
    };

    if (!order) return <div className="p-6">Loading...</div>;

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <h2 className="text-2xl font-bold mb-4">📄 Chi tiết đơn hàng #{order.purchaseOrdersId}</h2>

            <div className="grid grid-cols-2 gap-4 text-sm mb-6">
                <div>
                    <p>🕒 <strong>Ngày đặt:</strong> {new Date(order.orderDate).toLocaleString()}</p>
                    <p>📋 <strong>Trạng thái:</strong> {order.status}</p>
                    <p>📝 <strong>Ghi chú:</strong> {order.notes || "(không có)"}</p>
                    <p>💰 <strong>Tổng tiền:</strong> {order.totalCost.toLocaleString()} VNĐ</p>
                </div>
                <div>
                    <p>🏬 <strong>Chi nhánh nhập:</strong> {order.branch?.name}</p>
                    <p>🏢 <strong>Nhà cung cấp:</strong> {order.supplier?.name}</p>
                    <p>🙍 <strong>Người đại diện:</strong> {order.supplier?.contactPerson}</p>
                    <p>📞 <strong>SĐT:</strong> {order.supplier?.phone}</p>
                    <p>📧 <strong>Email:</strong> {order.supplier?.email}</p>
                </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">📦 Danh sách sản phẩm</h3>
            <table className="w-full border text-sm">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Sản phẩm</th>
                        <th className="p-2">Số lượng</th>
                        <th className="p-2">Giá nhập</th>
                        <th className="p-2">Thành tiền</th>
                        {editing && <th className="p-2">Xóa</th>}
                    </tr>
                </thead>
                <tbody>
                    {items.map((item, index) => (
                        <tr key={item.productId} className="border-t">
                            <td className="p-2">{item.productName}</td>
                            <td className="p-2">
                                {editing ? (
                                    <input
                                        type="number"
                                        className="border px-2 w-20"
                                        value={item.quantityOrdered}
                                        onChange={(e) => handleQuantityChange(index, e.target.value)}
                                    />
                                ) : (
                                    item.quantityOrdered
                                )}
                            </td>
                            <td className="p-2">{item.purchasePrice.toLocaleString()} VNĐ</td>
                            <td className="p-2">{(item.quantityOrdered * item.purchasePrice).toLocaleString()} VNĐ</td>
                            {editing && (
                                <td className="p-2">
                                    <button className="text-red-600" onClick={() => handleRemove(item.productId)}>
                                        <FaTrash />
                                    </button>
                                </td>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>

            {editing && (
                <button
                    onClick={handleSave}
                    className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                    💾 Lưu thay đổi
                </button>
            )}
        </div>
    );
};

export default PurchaseOrderDetail;