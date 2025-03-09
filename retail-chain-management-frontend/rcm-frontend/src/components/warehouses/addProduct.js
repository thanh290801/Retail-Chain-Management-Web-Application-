import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AddProductComponent = () => {
    const [product, setProduct] = useState({
        name: '',
        barcode: null,
        unit: null,
        weight: null,
        volume: null,
        category: null
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduct(prevState => ({
            ...prevState,
            [name]: value || null
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (window.confirm('Bạn có chắc chắn muốn lưu sản phẩm này không?')) {
            try {
                const response = await fetch('http://localhost:5000/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...product, isEnabled: true })
                });
                if (response.ok) {
                    alert('Sản phẩm đã được thêm thành công!');
                    navigate('/listallproduct');
                } else {
                    alert('Có lỗi xảy ra khi thêm sản phẩm!');
                    console.log(product);
                }
            } catch (error) {
                console.error('Error adding product:', error);
                alert('Lỗi kết nối đến server!');
            }
        }
    };

    const handleCancel = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy thêm sản phẩm không?')) {
            navigate('/listallproduct');
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">➕ Thêm Sản Phẩm</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
                
                <div>
                    <label className="block font-medium">Tên sản phẩm:</label>
                    <input type="text" name="name" value={product.name} onChange={handleChange} className="w-full p-2 border rounded" required />
                </div>
                <div>
                    <label className="block font-medium">Mã vạch:</label>
                    <input type="text" name="barcode" value={product.barcode} onChange={handleChange} className="w-full p-2 border rounded" />
                    {product.barcode && (
                        <p className="text-red-500 mt-1">Mã vạch đã tồn tại trong hệ thống!</p>
                    )}
                </div>

                <div>
                    <label className="block font-medium">Đơn vị:</label>
                    <select name="unit" value={product.unit} onChange={handleChange} className="w-full p-2 border rounded">
                        <option value="">Chọn đơn vị</option>
                        <option value="Thùng">Thùng</option>
                        <option value="Lon">Lon</option>
                        <option value="Chai">Chai</option>
                        <option value="Túi">Túi</option>
                        <option value="Hộp">Hộp</option>
                        <option value="Gói">Gói</option>
                        <option value="Dây">Dây</option>
                    </select>
                </div>
                <div>
                    <label className="block font-medium">Trọng lượng (kg):</label>
                    <input type="number" name="weight" value={product.weight} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block font-medium">Thể tích (ml):</label>
                    <input type="number" name="volume" value={product.volume} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block font-medium">Danh mục:</label>
                    <input type="text" name="category" value={product.category} onChange={handleChange} className="w-full p-2 border rounded" />
                </div>
                <div>
                    <label className="block font-medium">Ảnh sản phẩm:</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        className="w-full p-2 border rounded" 
                        onChange={(e) => {
                            const file = e.target.files[0];
                            if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                    setProduct(prevState => ({ ...prevState, imageUrl: reader.result }));
                                };
                                reader.readAsDataURL(file);
                            }
                        }}
                    />
                    <p className="mt-2 text-sm">Hoặc nhập URL ảnh:</p>
                    <input 
                        type="text" 
                        name="imageUrl" 
                        value={product.imageUrl || ''} 
                        onChange={handleChange} 
                        className="w-full p-2 border rounded" 
                        placeholder="Nhập URL ảnh sản phẩm" 
                    />
                    {product.imageUrl && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">Xem trước ảnh:</p>
                            <img src={product.imageUrl} alt="Ảnh sản phẩm" className="w-24 h-24 object-cover mt-2" />
                        </div>
                    )} 
                </div>
                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded">Hủy</button>
                    <button type="submit" className="px-4 py-2 bg-blue-500 text-white rounded">Lưu</button>
                </div>
            </form>
        </div>
    );
};

export default AddProductComponent;
