import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';


const PromotionCreate = ({ onClose, onPromotionCreated, selectedProducts = [], warehouseId, warehouseName }) => {
    const [formData, setFormData] = useState({
        promotionName: '',
        warehouseId: warehouseId,
        startDate: '',
        endDate: '',
        discountPercent: '',
        description: ''
    });

    const [productDiscounts, setProductDiscounts] = useState(selectedProducts.map(product => ({
        productId: product.productsId,
        discountPercent: 0,
        discountAmount: 0,
        description: '',
        discountedPrice: product.retailPrice
    })));

    const api_url = process.env.REACT_APP_API_URL;

    useEffect(() => {
        console.log('Selected Products:', selectedProducts);
        console.log('Warehouse ID:', warehouseId);
    }, [selectedProducts, warehouseId]);

    const handleChange = (e) => {
        const { name, value } = e.target;
      
        if (name === 'endDate') {
          const endDate = new Date(value);
      
          // Set giờ thành 23:59
          endDate.setHours(23, 59, 0, 0);
      
          // Chuyển sang local time
          const localDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
          setFormData({ ...formData, [name]: localDate.toISOString().slice(0, 16) });
        } else {
          setFormData({ ...formData, [name]: value });
        }
      };      

    const handleDiscountChange = (index, field, value) => {
        const updatedProducts = [...productDiscounts];
        const parsedValue = parseFloat(value);

        // Kiểm tra nếu không hợp lệ thì set về 0
        if (isNaN(parsedValue)) {
            updatedProducts[index][field] = 0;
        } else {
            if (field === 'discountPercent') {
                // Đảm bảo discountPercent không vượt quá 100%
                updatedProducts[index][field] = Math.min(100, Math.max(0, parsedValue));
                updatedProducts[index].discountAmount = 0;
            } else if (field === 'discountAmount') {
                // Đảm bảo discountAmount không vượt quá giá bán lẻ
                const maxDiscount = selectedProducts[index].retailPrice;
                updatedProducts[index][field] = Math.min(maxDiscount, Math.max(0, parsedValue));
                updatedProducts[index].discountPercent = 0;
            }
        }

        // Tính giá sau giảm
        const discountValue = field === 'discountPercent'
            ? (updatedProducts[index].discountPercent / 100) * selectedProducts[index].retailPrice
            : updatedProducts[index].discountAmount;

        updatedProducts[index].discountedPrice = selectedProducts[index].retailPrice - discountValue;
        setProductDiscounts(updatedProducts);
    };

    const getLocalDateTime = () => {
        const now = new Date();
        now.setMinutes(now.getMinutes() - now.getTimezoneOffset()); // Chuyển về local time
        return now.toISOString().slice(0, 16); // Định dạng YYYY-MM-DDTHH:MM
    };

    const getNextHourStart = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0, 0, 0);
      
        // Format thành yyyy-MM-ddTHH:mm
        const offset = now.getTimezoneOffset() * 60000; // Mili giây
        const localTime = new Date(now - offset).toISOString().slice(0, 16);
        return localTime;
      };
      
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (productDiscounts.length === 0) {
            alert("Vui lòng chọn ít nhất một sản phẩm để tạo khuyến mãi.");
            return;
        }

        const dataToSend = {
            promotionName: formData.promotionName,
            warehouseId: formData.warehouseId,
            startDate: formData.startDate,
            endDate: formData.endDate,
            products: productDiscounts,
        };

        console.log('Submitting Data:', dataToSend);

        try {
            const response = await axios.post(`${api_url}/promotion/create`, dataToSend);
            toast.success(response.data.message || 'Khuyến mãi đã được tạo thành công!');
            onPromotionCreated();
            onClose();
        } catch (error) {
            console.error('Lỗi khi tạo khuyến mãi:', error);
            toast.error(error.response?.data?.message || 'Tạo khuyến mãi thất bại!');
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl md:max-w-7xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Tạo Khuyến Mãi Mới</h2>
                <ToastContainer />
                {/* Thông tin nhà kho */}
                <p className="mb-4 text-gray-600">Nhà kho: <span className="font-semibold">{warehouseName}</span></p>
                {/* Nội dung modal */}
                <form onSubmit={handleSubmit}>
                    {/* Grid Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Tên Khuyến Mãi */}
                        <div>
                            <label className="block mb-2">Tên Khuyến Mãi:</label>
                            <input
                                type="text"
                                name="promotionName"
                                value={formData.promotionName}
                                onChange={handleChange}
                                className="border w-full p-2"
                                required
                            />
                        </div>

                        {/* Ngày Bắt Đầu và Kết Thúc */}
                        <div className="flex gap-4">
                            <div>
                                <label className="block mb-2">Ngày Bắt Đầu:</label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate || getNextHourStart()} // Bắt đầu từ giờ chẵn
                                    onChange={handleChange}
                                    className="border w-full p-2"
                                    required
                                    min={getNextHourStart()} // Ngăn chọn ngày quá khứ
                                />
                            </div>

                            <div>
                                <label className="block mb-2">Ngày Kết Thúc:</label>
                                <input
                                    type="datetime-local"
                                    name="endDate"
                                    value={formData.endDate}
                                    onChange={handleChange}
                                    className="border w-full p-2"
                                    required
                                    min={formData.startDate || new Date().toISOString().slice(0, 16)}
                                />
                            </div>

                        </div>
                    </div>

                    {/* Bảng sản phẩm */}
                    <h3 className="text-lg font-semibold mt-6 mb-4">Sản Phẩm Được Chọn</h3>
                    {selectedProducts.length === 0 ? (
                        <p className="text-red-500">Không có sản phẩm nào được chọn.</p>
                    ) : (
                        <div className="overflow-y-auto max-h-60 border border-gray-300 rounded-lg">
                            <table className="w-full border-collapse table-fixed">
                                <thead>
                                    <tr>
                                        <th className="border border-gray-300 p-2 w-[30%]">Sản Phẩm</th>
                                        <th className="border border-gray-300 p-2 w-[15%]">Giá Bán Lẻ</th>
                                        <th className="border border-gray-300 p-2 w-[5%]">Giảm Giá (%)</th>
                                        <th className="border border-gray-300 p-2 w-[7%]">Giảm Giá (VNĐ)</th>
                                        <th className="border border-gray-300 p-2 w-[15%]">Giá Sau Giảm</th>
                                        <th className="border border-gray-300 p-2 w-[25%]">Mô Tả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {selectedProducts.map((product, index) => (
                                        <tr key={product.productsId}>
                                            <td className="border border-gray-300 p-2">{product.name}</td>
                                            <td className="border border-gray-300 p-2">{product.retailPrice?.toLocaleString()} VND</td>
                                            <td className="border border-gray-300 p-2">
                                                <input
                                                    type='number'
                                                    className="w-full border p-1"
                                                    value={productDiscounts[index].discountPercent}
                                                    onChange={(e) => handleDiscountChange(index, 'discountPercent', e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()} // Ngăn cuộn chuột thay đổi giá trị
                                                    min="0"
                                                    max="100"
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2">
                                                <input
                                                    type='number'
                                                    className="w-full border p-1"
                                                    value={productDiscounts[index].discountAmount}
                                                    onChange={(e) => handleDiscountChange(index, 'discountAmount', e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()} // Ngăn cuộn chuột thay đổi giá trị
                                                    min="0"
                                                    max={product.retailPrice}
                                                />
                                            </td>
                                            <td className="border border-gray-300 p-2">{productDiscounts[index].discountedPrice?.toLocaleString()} VND</td>
                                            <td className="border border-gray-300 p-2">
                                                <input
                                                    type='text'
                                                    className="w-full border p-1"
                                                    value={productDiscounts[index].description}
                                                    onChange={(e) => handleDiscountChange(index, 'description', e.target.value)}
                                                />
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {/* Nút tạo và hủy */}
                    <div className="flex justify-end mt-4">
                        <button type="button" onClick={onClose} className="bg-gray-400 text-white px-4 py-2 mr-2 rounded">Hủy</button>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Tạo Khuyến Mãi</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default PromotionCreate;
