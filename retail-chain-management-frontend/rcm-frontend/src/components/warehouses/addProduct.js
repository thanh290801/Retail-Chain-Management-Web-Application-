import React from 'react';

const AddProductComponent = () => {
    return (
        <div className="p-4 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Thêm sản phẩm</h2>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Mã sản phẩm/SKU *</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Nhập mã SKU" required />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Tên sản phẩm *</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Nhập tên sản phẩm" />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Mã vạch</label>
                <input type="text" className="w-full p-2 border rounded" placeholder="Nhập mã vạch" />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Đơn vị bán ra</label>
                <select className="w-full p-2 border rounded">
                    <option value="Thùng">Thùng</option>
                    <option value="Lon">Lon</option>
                    <option value="Túi">Túi</option>
                    <option value="Dây">Dây</option>
                    <option value="Hộp">Hộp</option>
                </select>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Trọng lượng (kg)</label>
                <input type="number" className="w-full p-2 border rounded" placeholder="Nhập trọng lượng sản phẩm" />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Thể tích (l)</label>
                <input type="number" className="w-full p-2 border rounded" placeholder="Nhập thể tích sản phẩm" />
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Mô tả sản phẩm</label>
                <textarea className="w-full p-2 border rounded" placeholder="Nhập mô tả sản phẩm"></textarea>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Ảnh sản phẩm</label>
                <div className="border-dashed border-2 p-4 rounded-md text-center">
                    + Kéo thả hoặc tải ảnh lên từ thiết bị
                </div>
            </div>
            <div className="flex justify-end space-x-4">
                <button className="px-4 py-2 bg-gray-500 text-white rounded" onClick={() => {
                    if (window.confirm('Bạn có chắc chắn muốn hủy thêm sản phẩm không?')) {
                        window.location.href = '/listallproduct';
                    }
                }}>Thoát</button>
                <button className="px-4 py-2 bg-blue-500 text-white rounded" onClick={() => window.location.href = '/listallproduct'}>Lưu</button>
            </div>
        </div>
    );
};

export default AddProductComponent;
