import React, { useState } from 'react';

const AddProductComponent = ({ onSuccess, onCancel }) => {
    const [product, setProduct] = useState({
        name: '',
        barcode: '',
        unit: '',
        weight: '',
        volume: '',
        category: '',
        imageUrl: ''
    });
    const [barcodeExists, setBarcodeExists] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleChange = async (e) => {
        const { name, value } = e.target;
        setProduct(prev => ({ ...prev, [name]: value || '' }));

        if (name === "barcode") {
            const trimmed = value?.trim();
            if (trimmed) {
                try {
                    const res = await fetch(`https://localhost:5000/api/products/check-barcode?barcode=${trimmed}`);
                    const data = await res.json();
                    setBarcodeExists(data.exists);
                } catch (err) {
                    console.error("Lỗi kiểm tra mã vạch:", err);
                    setBarcodeExists(false);
                }
            } else {
                setBarcodeExists(false);
            }
        }
    };

    const handleImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const allowedTypes = ['image/png', 'image/jpg', 'image/jpeg'];
        if (!allowedTypes.includes(file.type)) {
            alert("Chỉ cho phép các file ảnh định dạng .png, .jpg hoặc .jpeg");
            return;
        }

        const formData = new FormData();
        formData.append('image', file);

        try {
            setUploading(true);
            const res = await fetch('https://localhost:5000/api/upload/image', {
                method: 'POST',
                body: formData,
            });

            if (res.ok) {
                const data = await res.json();
                setProduct(prev => ({ ...prev, imageUrl: data.imageUrl }));
                alert("Tải ảnh lên thành công!");
            } else {
                alert("Lỗi khi tải ảnh lên.");
            }
        } catch (err) {
            console.error("Upload error:", err);
            alert("Lỗi kết nối khi tải ảnh.");
        } finally {
            setUploading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (barcodeExists) {
            alert("Mã vạch đã tồn tại, vui lòng chọn mã khác.");
            return;
        }
    
        if (window.confirm('Bạn có chắc chắn muốn lưu sản phẩm này không?')) {
            try {
                const res = await fetch('https://localhost:5000/api/products', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ...product, isEnabled: true })
                });
                if (res.ok) {
                    alert('Sản phẩm đã được thêm thành công!');
                    if (onSuccess) onSuccess(); // ✅ Gọi callback reload
                } else {
                    alert('Có lỗi xảy ra khi thêm sản phẩm!');
                }
            } catch (err) {
                console.error('Add product error:', err);
                alert('Lỗi kết nối đến server!');
            }
        }
    };
    
    const handleCancel = () => {
        if (window.confirm('Bạn có chắc chắn muốn hủy thêm sản phẩm không?')) {
            onCancel();
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
                    {barcodeExists && <p className="text-red-500 mt-1">⚠️ Mã vạch đã tồn tại trong hệ thống!</p>}
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
                        <option value="cái">cái</option>
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
                    <label className="block font-medium">Ảnh sản phẩm (.png/.jpg):</label>
                    <input
                        type="file"
                        accept=".png,.jpg,.jpeg"
                        className="w-full p-2 border rounded"
                        onChange={handleImageUpload}
                    />
                    {uploading && <p className="text-blue-500 mt-1">Đang tải ảnh lên...</p>}
                    {product.imageUrl && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-500">Xem trước ảnh:</p>
                            <img src={product.imageUrl} alt="Ảnh sản phẩm" className="w-24 h-24 object-cover mt-2" />
                        </div>
                    )}
                </div>

                <div className="flex justify-end space-x-4">
                    <button type="button" onClick={handleCancel} className="px-4 py-2 bg-gray-500 text-white rounded">Hủy</button>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
                        disabled={barcodeExists || uploading}
                    >
                        Lưu
                    </button>
                </div>
            </form>
        </div>
    );
};

export default AddProductComponent;
