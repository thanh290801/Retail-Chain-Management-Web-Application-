import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const WarehouseTransferHistory = () => {
  const [transfers, setTransfers] = useState([]);
  const [filteredTransfers, setFilteredTransfers] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const navigate = useNavigate();

  // Filter states
  const [fromWarehouseFilter, setFromWarehouseFilter] = useState("");
  const [toWarehouseFilter, setToWarehouseFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");
  const [yearFilter, setYearFilter] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [transferRes, warehouseRes] = await Promise.all([
          axios.get("https://localhost:5000/api/warehouse-transfers"),
          axios.get("https://localhost:5000/api/warehouses")
        ]);

        setTransfers(transferRes.data);
        setWarehouses(warehouseRes.data);
        setFilteredTransfers(transferRes.data);
      } catch (error) {
        console.error("Lỗi khi lấy dữ liệu:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    let result = [...transfers];

    if (fromWarehouseFilter) {
      result = result.filter(t => t.fromWarehouseId === parseInt(fromWarehouseFilter));
    }
    if (toWarehouseFilter) {
      result = result.filter(t => t.toWarehouseId === parseInt(toWarehouseFilter));
    }

    if (monthFilter || yearFilter) {
      result = result.filter(t => {
        const date = new Date(t.transferDate);
        const monthMatches = monthFilter ? date.getMonth() + 1 === parseInt(monthFilter) : true;
        const yearMatches = yearFilter ? date.getFullYear() === parseInt(yearFilter) : true;
        return monthMatches && yearMatches;
      });
    }

    setFilteredTransfers(result);
    setCurrentPage(1);
  }, [fromWarehouseFilter, toWarehouseFilter, monthFilter, yearFilter, transfers]);

  const getWarehouseName = (id) => {
    const found = warehouses.find(w => w.warehousesId === id);
    return found ? found.name : `Kho ID: ${id}`;
  };

  // Tạo danh sách năm có trong dữ liệu
  const getYearOptions = () => {
    const years = new Set();
    transfers.forEach(t => {
      const year = new Date(t.transferDate).getFullYear();
      years.add(year);
    });
    return Array.from(years).sort();
  };

  const totalPages = Math.ceil(filteredTransfers.length / itemsPerPage);
  const currentTransfers = filteredTransfers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleRowClick = (id) => {
    navigate(`/warehouse-transfer/${id}`);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold mb-4">Lịch sử điều chuyển kho</h2>

      {/* Bộ lọc */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div>
          <label className="block text-sm">Kho nguồn</label>
          <select
            className="border px-2 py-1 rounded"
            value={fromWarehouseFilter}
            onChange={(e) => setFromWarehouseFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {warehouses.map(w => (
              <option key={w.warehousesId} value={w.warehousesId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Kho nhận</label>
          <select
            className="border px-2 py-1 rounded"
            value={toWarehouseFilter}
            onChange={(e) => setToWarehouseFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {warehouses.map(w => (
              <option key={w.warehousesId} value={w.warehousesId}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Tháng</label>
          <select
            className="border px-2 py-1 rounded"
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {[...Array(12)].map((_, i) => (
              <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm">Năm</label>
          <select
            className="border px-2 py-1 rounded"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">Tất cả</option>
            {getYearOptions().map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Bảng danh sách */}
      <table className="min-w-full bg-white shadow-md rounded">
        <thead>
          <tr className="bg-gray-100">
            <th className="py-2 px-4 text-left">#</th>
            <th className="py-2 px-4 text-left">Kho nguồn</th>
            <th className="py-2 px-4 text-left">Kho nhận</th>
            <th className="py-2 px-4 text-left">Ngày tạo</th>
          </tr>
        </thead>
        <tbody>
          {currentTransfers.map((transfer, index) => (
            <tr
              key={transfer.transferId}
              className="border-t hover:bg-gray-50 cursor-pointer"
              onClick={() => handleRowClick(transfer.transferId)}
            >
              <td className="py-2 px-4">{(currentPage - 1) * itemsPerPage + index + 1}</td>
              <td className="py-2 px-4">{getWarehouseName(transfer.fromWarehouseId)}</td>
              <td className="py-2 px-4">{getWarehouseName(transfer.toWarehouseId)}</td>
              <td className="py-2 px-4">{new Date(transfer.transferDate).toLocaleDateString()}</td>
              
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
        <span>Trang {currentPage} / {totalPages || 1}</span>
        <button
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
          onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
          disabled={currentPage === totalPages || totalPages === 0}
        >
          Sau
        </button>
      </div>
    </div>
  );
};

export default WarehouseTransferHistory;
