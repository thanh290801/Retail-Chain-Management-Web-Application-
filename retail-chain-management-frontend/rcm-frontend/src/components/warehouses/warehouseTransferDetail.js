import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const WarehouseTransferDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [transfer, setTransfer] = useState(null);
  const [productsInfo, setProductsInfo] = useState([]);
  const [warehouses, setWarehouses] = useState([]);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transferRes, productRes, warehouseRes] = await Promise.all([
          axios.get(`https://localhost:5000/api/warehouse-transfers/${id}`),
          axios.get(`https://localhost:5000/api/products`),
          axios.get(`https://localhost:5000/api/warehouse`)
        ]);

        setTransfer(transferRes.data);
        setProductsInfo(productRes.data);
        setWarehouses(warehouseRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, [id]);

  const getUnitByProductId = (productId) => {
    const found = productsInfo.find(p => p.productId === productId);
    return found ? found.unit : "Không rõ";
  };

  const getWarehouseName = (warehouseId) => {
    const found = warehouses.find(w => w.warehousesId === warehouseId);
    return found ? found.name : `Kho #${warehouseId}`;
  };

  if (!transfer) return <div className="p-6">Đang tải...</div>;

  // Pagination logic
  const totalPages = Math.ceil(transfer.products.length / itemsPerPage);
  const currentProducts = transfer.products.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="p-6">
      {/* Nút quay lại */}
      <button
        onClick={() => navigate("/warehouse-transfers")}
        className="mb-4 px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-sm"
      >
        ← Trở về danh sách điều chuyển kho
      </button>

      <h2 className="text-xl font-semibold mb-4">
        Chi tiết đơn chuyển kho #{transfer.transferId}
      </h2>

      <div className="space-y-2 mb-6">
        <div><strong>Kho nguồn:</strong> {getWarehouseName(transfer.fromWarehouseId)}</div>
        <div><strong>Kho nhận:</strong> {getWarehouseName(transfer.toWarehouseId)}</div>
        <div><strong>Ngày tạo:</strong> {new Date(transfer.transferDate).toLocaleString()}</div>
        {transfer.notes && (
          <div><strong>Ghi chú:</strong> {transfer.notes}</div>
        )}
      </div>

      <h3 className="text-lg font-medium mb-2">Danh sách sản phẩm</h3>
      <table className="min-w-full bg-white shadow-md rounded">
        <thead className="bg-gray-100">
          <tr>
            <th className="py-2 px-4 text-left">Mã SP</th>
            <th className="py-2 px-4 text-left">Tên sản phẩm</th>
            <th className="py-2 px-4 text-left">Số lượng</th>
            <th className="py-2 px-4 text-left">Đơn vị</th>
          </tr>
        </thead>
        <tbody>
          {currentProducts.map((product) => (
            <tr key={product.productId} className="border-t hover:bg-gray-50">
              <td className="py-2 px-4">{product.productId}</td>
              <td className="py-2 px-4">{product.productName}</td>
              <td className="py-2 px-4">{product.quantity}</td>
              <td className="py-2 px-4">{getUnitByProductId(product.productId)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pagination controls */}
      <div className="flex justify-between items-center mt-4">
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
          disabled={currentPage === 1}
        >
          Trước
        </button>
        <span>Trang {currentPage} / {totalPages}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default WarehouseTransferDetail;
