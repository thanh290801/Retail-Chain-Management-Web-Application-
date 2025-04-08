import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from '../../headerComponent/header';

const WarehouseTransferHistory = () => {
  const [transfers, setTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [transferDetails, setTransferDetails] = useState([]);
  const [detailPage, setDetailPage] = useState(1);

  const [fromWarehouseFilter, setFromWarehouseFilter] = useState('');
  const [toWarehouseFilter, setToWarehouseFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  const [yearFilter, setYearFilter] = useState('');

  const pageSize = 10;
  const API_BASE_URL = 'https://localhost:5000/api';

  useEffect(() => {
    fetchTransfers();
    fetchWarehouses();
  }, []);

  const fetchTransfers = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/warehouse-transfers/all`);
      // ✅ Sắp xếp giảm dần theo ngày
      setTransfers(res.data.sort((a, b) => new Date(b.transferDate) - new Date(a.transferDate)));
    } catch (err) {
      console.error('Lỗi khi lấy lịch sử điều chuyển:', err);
    }
  };

  const fetchWarehouses = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/warehouses`);
      setWarehouses(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách kho:', err);
    }
  };

  const fetchTransferDetails = async (transferId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/warehouse-transfers/detail/${transferId}`);
      setSelectedTransfer(res.data);
      setTransferDetails(res.data.products);
      setDetailPage(1);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết đơn:', err);
    }
  };

  const filteredTransfers = transfers.filter((item) => {
    const date = new Date(item.transferDate);
    return (
      (fromWarehouseFilter === '' || item.fromWarehouse?.warehouseId === parseInt(fromWarehouseFilter)) &&
      (toWarehouseFilter === '' || item.toWarehouse?.warehouseId === parseInt(toWarehouseFilter)) &&
      (statusFilter === '' || item.status === statusFilter) &&
      (monthFilter === '' || date.getMonth() + 1 === parseInt(monthFilter)) &&
      (yearFilter === '' || date.getFullYear() === parseInt(yearFilter))
    );
  });

  const paginatedTransfers = filteredTransfers.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const paginatedDetails = transferDetails.slice((detailPage - 1) * pageSize, detailPage * pageSize);

  return (
    <div>
      <Header />
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-4">Lịch sử Điều Chuyển Kho</h2>

        {/* Bộ lọc */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <select value={fromWarehouseFilter} onChange={(e) => setFromWarehouseFilter(e.target.value)} className="p-2 border rounded">
            <option value="">Kho gửi</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
            ))}
          </select>
          <select value={toWarehouseFilter} onChange={(e) => setToWarehouseFilter(e.target.value)} className="p-2 border rounded">
            <option value="">Kho nhận</option>
            {warehouses.map((w) => (
              <option key={w.warehouseId} value={w.warehouseId}>{w.name}</option>
            ))}
          </select>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="p-2 border rounded">
            <option value="">Trạng thái</option>
            <option value="Chưa chuyển">Chưa chuyển</option>
            <option value="Đã chuyển hàng">Đã chuyển hàng</option>
            <option value="Hoàn tất">Hoàn tất</option>
          </select>
          <div className="flex gap-2">
            <select value={monthFilter} onChange={(e) => setMonthFilter(e.target.value)} className="p-2 border rounded w-full">
              <option value="">Tháng</option>
              {[...Array(12)].map((_, i) => (
                <option key={i + 1} value={i + 1}>{i + 1}</option>
              ))}
            </select>
            <select value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className="p-2 border rounded w-full">
              <option value="">Năm</option>
              {[2023, 2024, 2025].map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Danh sách đơn */}
        <table className="min-w-full border mb-4">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-4 py-2 border">ID Đơn</th>
              <th className="px-4 py-2 border">Kho Nguồn</th>
              <th className="px-4 py-2 border">Kho Nhận</th>
              <th className="px-4 py-2 border">Ngày</th>
              <th className="px-4 py-2 border">Trạng thái</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTransfers.map((item) => (
              <tr
                key={item.transferId}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => fetchTransferDetails(item.transferId)}
              >
                <td className="border px-4 py-2 text-center">{item.transferId}</td>
                <td className="border px-4 py-2 text-center">{item.fromWarehouse?.name}</td>
                <td className="border px-4 py-2 text-center">{item.toWarehouse?.name}</td>
                <td className="border px-4 py-2 text-center">{new Date(item.transferDate).toLocaleDateString()}</td>
                <td className="border px-4 py-2 text-center">{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Phân trang danh sách đơn */}
        <div className="flex justify-center gap-2 mb-6">
          {Array.from({ length: Math.ceil(filteredTransfers.length / pageSize) }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? 'bg-blue-500 text-white' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>

        {/* Chi tiết đơn */}
        {selectedTransfer && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold mb-2">Chi tiết đơn #{selectedTransfer.transferId}</h3>
            <table className="min-w-full border">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-4 py-2 border">Mã SP</th>
                  <th className="px-4 py-2 border">Tên sản phẩm</th>
                  <th className="px-4 py-2 border">Số lượng</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDetails.map((item) => (
                  <tr key={item.productId}>
                    <td className="border px-4 py-2 text-center">{item.productId}</td>
                    <td className="border px-4 py-2">{item.productName}</td>
                    <td className="border px-4 py-2 text-center">{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Phân trang chi tiết */}
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(transferDetails.length / pageSize) }, (_, i) => (
                <button
                  key={i}
                  onClick={() => setDetailPage(i + 1)}
                  className={`px-3 py-1 border rounded ${detailPage === i + 1 ? 'bg-blue-500 text-white' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WarehouseTransferHistory;
