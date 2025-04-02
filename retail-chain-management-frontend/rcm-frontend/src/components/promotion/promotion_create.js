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

    const [localSelectedProducts, setLocalSelectedProducts] = useState([...selectedProducts]);

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
            endDate.setHours(23, 59, 0, 0);
            const localDate = new Date(endDate.getTime() - endDate.getTimezoneOffset() * 60000);
            setFormData({ ...formData, [name]: localDate.toISOString().slice(0, 16) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleDiscountChange = (index, field, value) => {
        const updatedProducts = [...productDiscounts];
        const parsedValue = parseFloat(value);

        if (isNaN(parsedValue)) {
            updatedProducts[index][field] = 0;
        } else {
            if (field === 'discountPercent') {
                updatedProducts[index][field] = Math.min(100, Math.max(0, parsedValue));
                updatedProducts[index].discountAmount = 0;
            } else if (field === 'discountAmount') {
                const maxDiscount = localSelectedProducts[index].retailPrice;
                updatedProducts[index][field] = Math.min(maxDiscount, Math.max(0, parsedValue));
                updatedProducts[index].discountPercent = 0;
            }
        }

        const discountValue = field === 'discountPercent'
            ? (updatedProducts[index].discountPercent / 100) * localSelectedProducts[index].retailPrice
            : updatedProducts[index].discountAmount;

        updatedProducts[index].discountedPrice = localSelectedProducts[index].retailPrice - discountValue;
        setProductDiscounts(updatedProducts);
    };

    const getNextHourStart = () => {
        const now = new Date();
        now.setHours(now.getHours() + 1);
        now.setMinutes(0, 0, 0);
        const offset = now.getTimezoneOffset() * 60000;
        const localTime = new Date(now - offset).toISOString().slice(0, 16);
        return localTime;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (productDiscounts.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một sản phẩm để tạo khuyến mãi.");
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

    const handleRemoveProduct = (indexToRemove) => {
        const updatedProducts = localSelectedProducts.filter((_, i) => i !== indexToRemove);
        const updatedDiscounts = productDiscounts.filter((_, i) => i !== indexToRemove);
        setLocalSelectedProducts(updatedProducts);
        setProductDiscounts(updatedDiscounts);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl md:max-w-7xl max-h-[80vh] overflow-y-auto">
                <h2 className="text-xl font-bold mb-4">Tạo Khuyến Mãi Mới</h2>
                <ToastContainer />
                <p className="mb-4 text-gray-600">Nhà kho: <span className="font-semibold">{warehouseName}</span></p>
                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                        <div className="flex gap-4">
                            <div>
                                <label className="block mb-2">Ngày Bắt Đầu:</label>
                                <input
                                    type="datetime-local"
                                    name="startDate"
                                    value={formData.startDate || getNextHourStart()}
                                    onChange={handleChange}
                                    className="border w-full p-2"
                                    required
                                    min={getNextHourStart()}
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

                    <h3 className="text-lg font-semibold mt-6 mb-4">Sản Phẩm Được Chọn</h3>
                    {localSelectedProducts.length === 0 ? (
                        <p className="text-red-500">Không có sản phẩm nào được chọn.</p>
                    ) : (
                        <div className="overflow-y-auto max-h-60 border border-gray-300 rounded-lg">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr>
                                        <th className="border p-2 w-[5%]"></th>
                                        <th className="border p-2 w-[35%]">Sản Phẩm</th>
                                        <th className="border p-2 w-[12%]">Giá Bán Lẻ</th>
                                        <th className="border p-2 w-[7%]">Giảm (%)</th>
                                        <th className="border p-2 w-[10%]">Giảm (VNĐ)</th>
                                        <th className="border p-2 w-[11%]">Giá Sau Giảm</th>
                                        <th className="border p-2 w-[20%]">Mô Tả</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {localSelectedProducts.map((product, index) => (
                                        <tr key={product.productsId}>
                                            <td className="border p-2 text-center">
                                                <button
                                                    onClick={() => handleRemoveProduct(index)}
                                                    type="button"
                                                    title="Xóa sản phẩm"
                                                    className="text-red-600 border border-red-600 rounded w-8 h-8 flex items-center justify-center hover:bg-red-300"
                                                >
                                                    &minus;
                                                </button>
                                            </td>
                                            <td className="border p-2">{product.name}</td>
                                            <td className="border p-2">{product.retailPrice?.toLocaleString()} VND</td>
                                            <td className="border p-2">
                                                <input
                                                    type='number'
                                                    className="w-full border p-1"
                                                    value={productDiscounts[index].discountPercent}
                                                    onChange={(e) => handleDiscountChange(index, 'discountPercent', e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    min="0"
                                                    max="100"
                                                />
                                            </td>
                                            <td className="border p-2">
                                                <input
                                                    type='number'
                                                    className="w-full border p-1"
                                                    value={productDiscounts[index].discountAmount}
                                                    onChange={(e) => handleDiscountChange(index, 'discountAmount', e.target.value)}
                                                    onWheel={(e) => e.currentTarget.blur()}
                                                    min="0"
                                                    max={product.retailPrice}
                                                />
                                            </td>
                                            <td className="border p-2">{productDiscounts[index].discountedPrice?.toLocaleString()} VND</td>
                                            <td className="border p-2">
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