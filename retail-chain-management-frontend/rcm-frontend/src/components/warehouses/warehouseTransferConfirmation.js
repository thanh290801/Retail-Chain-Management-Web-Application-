import React, { useEffect, useState } from 'react';
import axios from 'axios';
import StaffHeaderComponent from '../staffHomeConponent/staffHeader';

const ITEMS_PER_PAGE = 10;
const PRODUCTS_PER_PAGE = 5;

const WarehouseTransferConfirmation = () => {
  const [transfers, setTransfers] = useState([]);
  const [employeeWarehouseId, setEmployeeWarehouseId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedTransferId, setSelectedTransferId] = useState(null);
  const [productList, setProductList] = useState([]);
  const [productPage, setProductPage] = useState(1);

  useEffect(() => {
    const tokenString = localStorage.getItem('token');
    if (tokenString) {
      try {
        const payload = JSON.parse(atob(tokenString.split('.')[1]));
        if (payload?.BranchId) {
          setEmployeeWarehouseId(Number(payload.BranchId));
        }
      } catch (err) {
        console.error('Lỗi decode token:', err);
      }
    }
  }, []);

  useEffect(() => {
    if (employeeWarehouseId !== null) fetchTransfers();
  }, [employeeWarehouseId]);

  const fetchTransfers = async () => {
    try {
      const res = await axios.get(`https://localhost:5000/api/warehouse-transfers/for-warehouse/${employeeWarehouseId}`);
      setTransfers(res.data);
    } catch (err) {
      console.error('Lỗi khi lấy danh sách điều chuyển:', err);
    }
  };

  const handleConfirmTransfer = async (transferId) => {
    try {
      await axios.post(`https://localhost:5000/api/warehouse-transfers/confirm-transfer`, {
        transferId,
        employeeWarehouseId,
      });
      alert('✅ Xác nhận chuyển hàng thành công');
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data || 'Lỗi xác nhận chuyển');
    }
  };

  const handleConfirmReceive = async (transferId) => {
    try {
      await axios.post(`https://localhost:5000/api/warehouse-transfers/confirm-receive`, {
        transferId,
        employeeWarehouseId,
      });
      alert('✅ Xác nhận nhận hàng thành công');
      fetchTransfers();
    } catch (err) {
      alert(err.response?.data || 'Lỗi xác nhận nhận');
    }
  };

  const handleRowClick = async (transferId) => {
    setSelectedTransferId(transferId);
    setProductPage(1); // reset về trang 1
    try {
      const res = await axios.get(`https://localhost:5000/api/warehouse-transfers/detail/${transferId}`);
      setProductList(res.data.products || []);
    } catch (err) {
      console.error('Lỗi khi lấy chi tiết sản phẩm:', err);
    }
  };

  const paginatedTransfers = transfers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);
  const paginatedProducts = productList.slice((productPage - 1) * PRODUCTS_PER_PAGE, productPage * PRODUCTS_PER_PAGE);

  return (
    <div>
      <StaffHeaderComponent/>
      <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4">Xác Nhận Điều Chuyển Kho</h2>

      {/* Bảng danh sách điều chuyển */}
      <table className="min-w-full bg-white border">
        <thead>
          <tr className="bg-gray-100">
            <th className="px-4 py-2 border">ID Đơn</th>
            <th className="px-4 py-2 border">Kho Nguồn</th>
            <th className="px-4 py-2 border">Kho Nhận</th>
            <th className="px-4 py-2 border">Trạng Thái</th>
            <th className="px-4 py-2 border">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {paginatedTransfers.map((transfer) => {
            const isSender = transfer.fromWarehouse?.warehouseId === Number(employeeWarehouseId);
            const isReceiver = transfer.toWarehouse?.warehouseId === Number(employeeWarehouseId);

            return (
              <tr
                key={transfer.transferId}
                className="hover:bg-gray-100 cursor-pointer"
                onClick={() => handleRowClick(transfer.transferId)}
              >
                <td className="px-4 py-2 border text-center">{transfer.transferId}</td>
                <td className="px-4 py-2 border text-center">{transfer.fromWarehouse?.name}</td>
                <td className="px-4 py-2 border text-center">{transfer.toWarehouse?.name}</td>
                <td className="px-4 py-2 border text-center">{transfer.status}</td>
                <td className="px-4 py-2 border text-center">
                  {isSender && transfer.status === 'Chưa chuyển' && (
                    <button
                      className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-3 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmTransfer(transfer.transferId);
                      }}
                    >
                      Xác nhận chuyển
                    </button>
                  )}
                  {isReceiver && transfer.status === 'Đã chuyển hàng' && (
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleConfirmReceive(transfer.transferId);
                      }}
                    >
                      Xác nhận nhận
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Phân trang danh sách điều chuyển */}
      <div className="flex justify-center mt-4 gap-2">
        {Array.from({ length: Math.ceil(transfers.length / ITEMS_PER_PAGE) }, (_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={`px-3 py-1 rounded border ${currentPage === i + 1 ? 'bg-blue-500 text-white' : 'bg-gray-100'}`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* Danh sách sản phẩm của đơn được chọn */}
      {selectedTransferId && (
        <div className="mt-8">
          <h3 className="text-xl font-semibold mb-2">Danh sách sản phẩm của đơn #{selectedTransferId}</h3>
          <table className="min-w-full bg-white border">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2 border">Mã SP</th>
                <th className="px-4 py-2 border">Tên sản phẩm</th>
                <th className="px-4 py-2 border">Số lượng</th>
              </tr>
            </thead>
            <tbody>
              {paginatedProducts.map((product) => (
                <tr key={product.productId}>
                  <td className="px-4 py-2 border text-center">{product.productId}</td>
                  <td className="px-4 py-2 border">{product.productName}</td>
                  <td className="px-4 py-2 border text-center">{product.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Phân trang danh sách sản phẩm */}
          <div className="flex justify-center mt-4 gap-2">
            {Array.from({ length: Math.ceil(productList.length / PRODUCTS_PER_PAGE) }, (_, i) => (
              <button
                key={i}
                onClick={() => setProductPage(i + 1)}
                className={`px-3 py-1 rounded border ${productPage === i + 1 ? 'bg-green-500 text-white' : 'bg-gray-100'}`}
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

export default WarehouseTransferConfirmation;
