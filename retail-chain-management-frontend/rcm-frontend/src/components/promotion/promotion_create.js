import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { registerLocale } from 'react-datepicker';
import vi from 'date-fns/locale/vi';

registerLocale('vi', vi);

const PromotionCreate = ({ onClose, onPromotionCreated, selectedProducts = [], warehouseId, warehouseName }) => {
    const [formData, setFormData] = useState({
        promotionName: '',
        warehouseId: warehouseId,
        startDate: null,
        endDate: null,
        discountPercent: '',
        description: ''
    });

    const [fetchedWarehouseName, setFetchedWarehouseName] = useState("");

    useEffect(() => {
        if (warehouseId) {
            axios.post(`${api_url}/warehouses/get-by-id`, warehouseId, {
                headers: {
                    'Content-Type': 'application/json'
                }
            })
                .then(res => {
                    setFetchedWarehouseName(res.data.name);
                })
                .catch(err => console.error(err));
        }
    }, [warehouseId]);

    const [localSelectedProducts, setLocalSelectedProducts] = useState([...selectedProducts]);

    const [productDiscounts, setProductDiscounts] = useState(selectedProducts.map(product => ({
        productId: product.productsId,
        discountPercent: 0,
        discountAmount: 0,
        description: '',
        discountedPrice: product.retailPrice
    })));

    const api_url = process.env.REACT_APP_API_URL;

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
    };

    const handleDiscountChange = (index, field, value) => {
        const updatedProducts = [...productDiscounts];

        if (field === 'description') {
            updatedProducts[index][field] = value;
        } else {
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

            const discountValue =
                field === 'discountPercent'
                    ? (updatedProducts[index].discountPercent / 100) * localSelectedProducts[index].retailPrice
                    : updatedProducts[index].discountAmount;

            updatedProducts[index].discountedPrice = localSelectedProducts[index].retailPrice - discountValue;
        }

        setProductDiscounts(updatedProducts);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.promotionName.trim()) {
            toast.warning("Tên khuyến mãi không được để trống.");
            return;
        }

        if (!formData.startDate || !formData.endDate) {
            toast.warning("Vui lòng chọn ngày bắt đầu và kết thúc.");
            return;
        }

        if (productDiscounts.length === 0) {
            toast.warning("Vui lòng chọn ít nhất một sản phẩm để tạo khuyến mãi.");
            return;
        }

        // Kiểm tra từng sản phẩm phải có giảm giá (1 trong 2 ô)
        for (let i = 0; i < productDiscounts.length; i++) {
            const { discountPercent, discountAmount } = productDiscounts[i];
            if ((discountPercent === 0 || discountPercent === '') && (discountAmount === 0 || discountAmount === '')) {
                toast.warning(`Sản phẩm "${localSelectedProducts[i].name}" phải có giảm giá phần trăm hoặc số tiền.`);
                return;
            }
        }

        const dataToSend = {
            promotionName: formData.promotionName.trim(),
            warehouseId: formData.warehouseId,
            startDate: new Date(formData.startDate).toISOString(),
            endDate: new Date(formData.endDate).toISOString(),
            products: productDiscounts,
        };

        try {
            const response = await axios.post(`${api_url}/promotion/create`, dataToSend);
            toast.success(response.data.message || 'Khuyến mãi đã được tạo thành công!');
            onPromotionCreated();
            onClose();
        } catch (error) {
            // toast.error('Lỗi khi tạo khuyến mãi:', error);
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
                <p className="mb-4 text-gray-600">Nhà kho: <span className="font-semibold">{fetchedWarehouseName}</span></p>
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
                                placeholder='Nhập tên chương trình khuyến mãi'
                            // required
                            />
                        </div>
                        <div className="flex gap-4">
                            <div>
                                <label className="block mb-2">Ngày Bắt Đầu:</label>
                                <DatePicker
                                    selected={formData.startDate}
                                    onChange={(date) => {
                                        const now = new Date();
                                        const selectedDate = new Date(date);

                                        // Nếu ngày được chọn là hôm nay và giờ < hiện tại ⇒ đẩy giờ lên hiện tại
                                        if (selectedDate.toDateString() === now.toDateString() && selectedDate < now) {
                                            selectedDate.setHours(now.getHours(), now.getMinutes(), 0, 0);
                                        }

                                        setFormData({ ...formData, startDate: selectedDate });
                                    }}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="dd/MM/yyyy HH:mm"
                                    locale="vi"
                                    className="border w-full p-2"
                                    placeholderText="Chọn ngày bắt đầu"
                                    minDate={new Date()}
                                    minTime={
                                        formData.startDate &&
                                            new Date(formData.startDate).toDateString() === new Date().toDateString()
                                            ? new Date()
                                            : new Date(0, 0, 0, 0, 0)
                                    }
                                    maxTime={new Date(0, 0, 0, 23, 59)}
                                />
                            </div>
                            <div>
                                <label className="block mb-2">Ngày Kết Thúc:</label>
                                <DatePicker
                                    selected={formData.endDate}
                                    onChange={(date) => {
                                        const selected = new Date(date);
                                        selected.setHours(23, 59, 0, 0); // Đặt giờ kết thúc là 23:59
                                        setFormData({ ...formData, endDate: selected });
                                    }}
                                    showTimeSelect
                                    timeFormat="HH:mm"
                                    timeIntervals={15}
                                    dateFormat="dd/MM/yyyy HH:mm"
                                    locale="vi"
                                    className="border w-full p-2"
                                    placeholderText="Chọn ngày kết thúc"
                                    minDate={formData.startDate || new Date()}
                                    minTime={
                                        formData.endDate &&
                                            new Date(formData.endDate).toDateString() === new Date().toDateString()
                                            ? new Date()
                                            : new Date(0, 0, 0, 0, 0)
                                    }
                                    maxTime={new Date(0, 0, 0, 23, 59)}
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
                                                <textarea
                                                    className="w-full border p-1 resize-none"
                                                    rows={2}
                                                    value={productDiscounts[index]?.description || ''}
                                                    onChange={(e) =>
                                                        handleDiscountChange(index, 'description', e.target.value)
                                                    }
                                                    placeholder="Nhập mô tả (không bắt buộc)"
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
