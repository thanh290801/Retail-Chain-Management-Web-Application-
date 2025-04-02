import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button } from 'react-bootstrap';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PromotionMain = () => {
  const [promotions, setPromotions] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [storeSearch, setStoreSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedPromo, setSelectedPromo] = useState(null);
  const [status, setStatus] = useState('');
  const [inactiveStores, setInactiveStores] = useState(false);
  const itemsPerPage = 10;
  const api_url = process.env.REACT_APP_API_URL;

  useEffect(() => {
    fetchPromotions();
    fetchStores();
  }, [currentPage, searchTerm, productSearch, storeSearch, startDate, endDate, status, inactiveStores]);

  const fetchPromotions = async () => {
    try {
      const response = await axios.post(`${api_url}/Promotion/list`);
      setPromotions(response.data);
    } catch (error) {
      toast.error('Kiểm tra lại kết nối server:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStores = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${api_url}/CashBookOwner/branches`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setStores(response.data);
    } catch (error) {
      toast.error('Kiểm tra lại kết nối server:', error);
    }
  };

  const isPromotionActive = (startDate, endDate) => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    const end = new Date(endDate).getTime();
    return start <= now && now <= end;
  };

  const isPromotionNotYetActive = (startDate) => {
    const now = new Date().getTime();
    const start = new Date(startDate).getTime();
    return now < start;
  };

  const handleUpdateStatus = async (promotionId, action) => {
    try {
      await axios.post(`${api_url}/promotion/update-status`, {
        promotionId,
        action,
      });
      toast.success(action === 'cancel' ? 'Huỷ khuyến mãi thành công' : 'Đã kết thúc sớm khuyến mãi');
      fetchPromotions();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Thao tác thất bại');
    }
  };

  const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  };  

  const filteredPromotions = promotions.filter((promo) => {
    const store = stores.find((store) => store.warehousesId === promo.warehousesId);
    const isStoreInactive = store ? !store.isActive : false;
    const promoIsActive = isPromotionActive(promo?.startDate, promo?.endDate);
    const promoIsNotYetActive = isPromotionNotYetActive(promo?.startDate);
  
    return (
      removeAccents(promo?.promotionName || '').includes(removeAccents(searchTerm)) &&
      removeAccents(promo?.productName || '').includes(removeAccents(productSearch)) &&
      (storeSearch === '' || promo?.warehousesId?.toString() === storeSearch) &&
      (!startDate || new Date(promo?.startDate) >= new Date(startDate)) &&
      (!endDate || new Date(promo?.endDate) <= new Date(endDate)) &&
      (
        status === '' ||
        (status === 'active' && promoIsActive) ||
        (status === 'inactive' && !promoIsActive && !promoIsNotYetActive) ||
        (status === 'not_yet_active' && promoIsNotYetActive)
      ) &&
      (!inactiveStores || isStoreInactive)
    );
  });
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPromotions = filteredPromotions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPromotions.length / itemsPerPage);

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const handleViewDetails = (promo) => {
    setSelectedPromo(promo);
  };

  const closeModal = () => {
    setSelectedPromo(null);
  };

  if (loading) return <p>Loading promotions...</p>;

  return (
    <div className="p-6">
      <ToastContainer />
      <h1 className="text-2xl font-bold mb-4">Danh Sách Khuyến Mãi</h1>

      <div className="mb-4 flex gap-4">
        <input type="text" placeholder="Tìm kiếm theo tên" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="border p-2" />
        <input type="text" placeholder="Tìm kiếm theo sản phẩm" value={productSearch} onChange={(e) => setProductSearch(e.target.value)} className="border p-2" />
        <select value={storeSearch} onChange={(e) => setStoreSearch(e.target.value)} className="border p-2">
          <option value="">Tất cả cửa hàng</option>
          {stores.map((store) => (
            <option key={store.warehousesId} value={store.warehousesId}>{store.name}</option>
          ))}
        </select>
        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="border p-2" />
        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="border p-2" />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border p-2">
          <option value="">Tất cả</option>
          <option value="active">Đang hiệu lực</option>
          <option value="inactive">Hết hiệu lực</option>
          <option value="not_yet_active">Chưa hiệu lực</option>
        </select>
      </div>

      <table className="w-full border-collapse border border-gray-300">
        <thead>
          <tr>
            <th className="border p-2">Tên Khuyến Mãi</th>
            <th className="border p-2">Sản phẩm</th>
            <th className="border p-2">Cửa hàng</th>
            <th className="border p-2">Bắt Đầu</th>
            <th className="border p-2">Ngày Kết Thúc</th>
            <th className="border p-2">Giảm Giá (%)</th>
            <th className="border p-2">Trạng Thái</th>
            <th className="border p-2">Thao Tác</th>
          </tr>
        </thead>
        <tbody>
          {currentPromotions.map((promo) => {
            const isActive = isPromotionActive(promo.startDate, promo.endDate);
            const isNotYet = isPromotionNotYetActive(promo.startDate);
            const statusColor = isNotYet ? 'text-yellow-500 font-semibold' : isActive ? 'text-green-600 font-semibold' : 'text-red-500 font-semibold';
            const statusText = isNotYet ? 'Chưa hiệu lực' : isActive ? 'Đang hiệu lực' : 'Hết hiệu lực';
            return (
              <tr key={promo.promotionsId}>
                <td className="border p-2">{promo.promotionName}</td>
                <td className="border p-2">{promo.productName}</td>
                <td className="border p-2">{promo.warehouseName}</td>
                <td className="border p-2">{new Date(promo.startDate).toLocaleString('vi-VN')}</td>
                <td className="border p-2">{new Date(promo.endDate).toLocaleString('vi-VN')}</td>
                <td className="border p-2">{promo.discountPercent}%</td>
                <td className={`border p-2 ${statusColor}`}>{statusText}</td>
                <td className="border p-2 space-x-2">
                  <Button variant="info" size="sm" onClick={() => handleViewDetails(promo)}>Xem</Button>
                  {isActive && <Button variant="warning" size="sm" onClick={() => handleUpdateStatus(promo.promotionsId, 'end_now')}>Kết thúc sớm</Button>}
                  {isNotYet && <Button variant="danger" size="sm" onClick={() => handleUpdateStatus(promo.promotionsId, 'cancel')}>Huỷ</Button>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          {[...Array(totalPages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => handlePageChange(index + 1)}
              className={`px-4 py-2 mx-1 ${currentPage === index + 1 ? 'bg-blue-500 text-white' : 'bg-gray-300'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      {selectedPromo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-8 rounded-lg max-w-lg w-full max-w-5xl">
            <h2 className="text-xl font-bold mb-4">Chi Tiết Khuyến Mãi</h2>
            <p><b>Tên:</b> {selectedPromo.promotionName}</p>
            <p><b>Sản Phẩm:</b> {selectedPromo.productName}</p>
            <p><b>Danh Mục:</b> {selectedPromo.productCategory}</p>
            <p><b>Cửa Hàng:</b> {selectedPromo.warehouseName}</p>
            <p><b>Hiệu lực:</b> {new Date(selectedPromo.startDate).toLocaleString('vi-VN')} <b>Đến:</b> {new Date(selectedPromo.endDate).toLocaleString('vi-VN')}</p>
            <p><b>Mô Tả:</b> {selectedPromo.promotionDescription || 'Không có mô tả'}</p>
            <p><b>Trạng Thái Khuyến Mãi:</b> {isPromotionActive(selectedPromo.startDate, selectedPromo.endDate) ? 'Đang hiệu lực' : 'Hết hiệu lực'}</p>
            <table className="w-full border-collapse border border-gray-300">
              <thead>
                <tr>
                  <th className="border border-gray-300 p-2">Sản phẩm</th>
                  <th className="border border-gray-300 p-2">Giá gốc</th>
                  <th className="border border-gray-300 p-2">Giảm(%)</th>
                  <th className="border border-gray-300 p-2">Giá mới</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="border border-gray-300 p-2">{selectedPromo.productName}</td>
                  <td className="border border-gray-300 p-2">{selectedPromo.retailPrice}</td>
                  <td className="border border-gray-300 p-2">{selectedPromo.discountPercent}</td>
                  <td className="border border-gray-300 p-2">
                    {(selectedPromo.retailPrice * (1 - selectedPromo.discountPercent / 100))}
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="flex justify-end mt-4">
              <button onClick={closeModal} className="bg-red-500 text-white px-4 py-2 rounded">
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PromotionMain;