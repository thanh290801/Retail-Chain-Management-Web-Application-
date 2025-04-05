import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { FaTrash } from "react-icons/fa";
import Header from "../../headerComponent/header";

const PurchaseOrderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState([]);
  const [batches, setBatches] = useState([]);
  const [selectedBatches, setSelectedBatches] = useState([]);
  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [batchProducts, setBatchProducts] = useState({});
  const [receivedSummary, setReceivedSummary] = useState({});

  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const [productsPerPage, setProductsPerPage] = useState(10); // Mỗi trang 10 sản phẩm
  const [totalProducts, setTotalProducts] = useState(0); // Tổng số sản phẩm trong batch

  const token = localStorage.getItem("token");

  useEffect(() => {
    loadOrder();
    loadBatches();
  }, [id]);

  const loadOrder = () => {
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
  };

  const loadBatches = () => {
    axios.get(`https://localhost:5000/api/orders/${id}/batches`)
      .then(res => {
        setBatches(res.data);
        // Tổng hợp số lượng sản phẩm đã nhận từ các batch
        const summary = {};
        res.data.forEach(batch => {
          (batch.products || []).forEach(p => {
            summary[p.productId] = (summary[p.productId] || 0) + p.quantity;
          });
        });
        setReceivedSummary(summary);
      })
      .catch(err => console.error("Lỗi khi tải danh sách batch:", err));
  };

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
        alert("Xác nhận thanh toán thành công!");
        loadOrder();
        loadBatches();
        setSelectedBatches([]);
      })
      .catch((err) => {
        console.error("Lỗi khi xác nhận thanh toán:", err);
        alert("Xác nhận thanh toán thất bại. Vui lòng thử lại.");
      });
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

  const toggleBatchProducts = async (batchId) => {
    const isOpen = expandedBatchId === batchId;
    setExpandedBatchId(isOpen ? null : batchId);

    if (!isOpen && !batchProducts[batchId]) {
      try {
        const res = await axios.get(`https://localhost:5000/api/orders/batches/${batchId}/products`);
        setBatchProducts(prev => ({ ...prev, [batchId]: res.data }));
        setTotalProducts(res.data.length); // Cập nhật tổng số sản phẩm trong batch
      } catch (err) {
        console.error("Lỗi khi tải sản phẩm trong batch:", err);
      }
    }
  };

  const currentProducts = batchProducts[expandedBatchId]?.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const totalPages = Math.ceil(totalProducts / productsPerPage);

  if (!order) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <Header />
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
              <th className="p-2">Số lượng đặt</th>
              <th className="p-2">Số lượng đã nhận</th>
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
                <td className="p-2 text-green-600 font-semibold">
                  {item.quantityReceived || 0}
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

        <h3 className="text-lg font-semibold mt-8 mb-2">📦 Danh sách các lần nhập hàng</h3>
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
              <React.Fragment key={batch.batchId}>
                <tr
                  className={`border-t cursor-pointer ${batch.status === 'Chưa thanh toán' ? 'bg-red-100' : 'bg-green-100'}`}
                  onClick={() => toggleBatchProducts(batch.batchId)}
                >
                  <td className="p-2">
                    {batch.status === 'Chưa thanh toán' && (
                      <input
                        type="checkbox"
                        checked={selectedBatches.includes(batch.batchId)}
                        onChange={(e) => {
                          e.stopPropagation();
                          handleBatchSelect(batch.batchId);
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                    )}
                  </td>
                  <td className="p-2">{batch.batchId}</td>
                  <td className="p-2">{batch.receivedDate ? new Date(batch.receivedDate).toLocaleDateString() : "Chưa có"}</td>
                  <td className="p-2">{batch.totalPrice.toLocaleString()} VNĐ</td>
                  <td className="p-2">{batch.status}</td>
                </tr>

                {expandedBatchId === batch.batchId && batchProducts[batch.batchId] && (
                  <tr className="border-b bg-white">
                    <td colSpan="5" className="p-4">
                      <h4 className="font-semibold mb-2">🧾 Sản phẩm trong đơn nhậpnhập:</h4>
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {currentProducts?.map(p => (
                          <li key={p.productId}>
                            {p.productName} - SL: {p.quantity}
                          </li>
                        ))}
                      </ul>
                      {/* Phân trang */}
                      <div className="mt-4 flex justify-center space-x-2">
                        {Array.from({ length: totalPages }, (_, index) => (
                          <button
                            key={index + 1}
                            onClick={() => handlePageChange(index + 1)}
                            className={`px-4 py-2 ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
                          >
                            {index + 1}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>

        {selectedBatches.length > 0 && (
          <button className="bg-blue-500 text-white p-2 rounded mt-4" onClick={handleConfirmPayments}>
            Xác nhận thanh toán các đơn nhập hàng đã chọn
          </button>
        )}
      </div>
    </div>
  );
};

export default PurchaseOrderDetail;
