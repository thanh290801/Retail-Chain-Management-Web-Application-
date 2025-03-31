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
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);

  const token = localStorage.getItem("token");

  useEffect(() => {
    axios.get(`https://localhost:5000/api/PurchaseOrders/${id}/details`)
      .then(res => {
        setOrder(res.data);
        setItems(res.data.items);
        setEditing(res.data.status === "Chưa nhận hàng");
      })
      .catch(err => {
        console.error("Lỗi khi tải chi tiết:", err);
        alert("Không tìm thấy đơn hàng.");
        navigate("/OrderList");
      });

    axios.get(`https://localhost:5000/api/orders/${id}/batches`)
      .then(res => {
        setBatches(res.data);
      })
      .catch(err => console.error("Lỗi khi tải danh sách batch:", err));
  }, [id]);

  const handleBatchSelect = (batchId) => {
    setSelectedBatches((prev) =>
      prev.includes(batchId) ? prev.filter((id) => id !== batchId) : [...prev, batchId]
    );
  };

  const handleConfirmPayments = () => {
    if (selectedBatches.length === 0) {
      alert("Vui lòng chọn ít nhất một batch để thanh toán.");
      return;
    }

    if (!window.confirm("Bạn có chắc chắn muốn xác nhận thanh toán cho các batch đã chọn?")) {
      return;
    }
    console.log("Token:", token);

    axios.post(`https://localhost:5000/api/orders/${id}/confirm-payments`, 
        { batchIds: selectedBatches },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      )
      .then(() => {
        setBatches((prevBatches) =>
          prevBatches.map((batch) =>
            selectedBatches.includes(batch.batchId) ? { ...batch, status: 'Đã thanh toán' } : batch
          )
        );
        setSelectedBatches([]);
        alert("Xác nhận thanh toán thành công!");
      })
      .catch((err) => console.error("Lỗi khi xác nhận thanh toán:", err));
  };

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

  const handleSaveChanges = () => {
    axios.put(`https://localhost:5000/api/PurchaseOrders/${id}/items`, items)
      .then(() => {
        alert("Cập nhật đơn hàng thành công!");
        navigate("/ownerorderlist");
      })
      .catch(err => console.error("Lỗi khi cập nhật đơn hàng:", err));
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
            {editing && <th className="p-2">Hành động</th>}
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
        <button className="bg-blue-500 text-white p-2 rounded mt-4" onClick={handleSaveChanges}>
          Lưu thay đổi
        </button>
      )}

<h3 className="text-lg font-semibold mb-2">📦 Danh sách các Batch</h3>
      <table className="w-full border text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Chọn</th>
            <th className="p-2">Batch ID</th>
            <th className="p-2">Ngày nhận</th>
            <th className="p-2">Tổng giá</th>
            <th className="p-2">Trạng thái</th>
          </tr>
        </thead>
        <tbody>
          {batches.map((batch) => (
            <tr key={batch.batchId} className={`border-t ${batch.status === 'Chưa thanh toán' ? 'bg-red-100' : 'bg-green-100'}`}>
              <td className="p-2">
                {batch.status === 'Chưa thanh toán' && (
                  <input
                    type="checkbox"
                    checked={selectedBatches.includes(batch.batchId)}
                    onChange={() => handleBatchSelect(batch.batchId)}
                  />
                )}
              </td>
              <td className="p-2">{batch.batchId}</td>
              <td className="p-2">{batch.receivedDate ? new Date(batch.receivedDate).toLocaleDateString() : "Chưa có"}</td>
              <td className="p-2">{batch.totalPrice.toLocaleString()} VNĐ</td>
              <td className="p-2">{batch.status}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {selectedBatches.length > 0 && (
        <button className="bg-blue-500 text-white p-2 rounded mt-4" onClick={handleConfirmPayments}>
          Xác nhận thanh toán các batch đã chọn
        </button>
      )}
    </div>
  );
};

export default PurchaseOrderDetail;
