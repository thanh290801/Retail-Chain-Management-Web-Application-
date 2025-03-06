import React, { useEffect, useState } from 'react';

const ProductListComponent = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        // Fake dữ liệu sản phẩm
        const fakeProducts = [
            { id: 1, name: 'Nước ngọt Coca Cola', barcode: '123456789', unit: 'Thùng', quantity_per_unit: 24, base_unit: 'Lon', weight: 0.33, volume: 0.33, image_url: 'https://example.com/coca.jpg', category: 'Đồ uống', is_enabled: true, has_pending_orders: false },
            { id: 2, name: 'Bánh Oreo', barcode: '987654321', unit: 'Thùng', quantity_per_unit: 10, base_unit: 'Hộp', weight: 0.5, volume: null, image_url: 'https://example.com/oreo.jpg', category: 'Bánh kẹo', is_enabled: true, has_pending_orders: true },
            { id: 3, name: 'Sữa Vinamilk', barcode: '567891234', unit: 'Thùng', quantity_per_unit: 12, base_unit: 'Hộp', weight: null, volume: 1, image_url: 'https://example.com/milk.jpg', category: 'Sữa', is_enabled: true, has_pending_orders: false },
            { id: 4, name: 'Mì Hảo Hảo', barcode: '192837465', unit: 'Thùng', quantity_per_unit: 30, base_unit: 'Gói', weight: 2.5, volume: null, image_url: 'https://example.com/mi.jpg', category: 'Mì ăn liền', is_enabled: true, has_pending_orders: false },
            { id: 5, name: 'Bột giặt Omo', barcode: '564738291', unit: 'Bao', quantity_per_unit: 1, base_unit: 'Túi', weight: 3, volume: null, image_url: 'https://example.com/omo.jpg', category: 'Hóa phẩm', is_enabled: true, has_pending_orders: true }
        ];
        
        setProducts(fakeProducts);
    }, []);

    const toggleProductStatus = (product) => {
        if (product.has_pending_orders) {
            alert(`Sản phẩm "${product.name}" đang có giao dịch xử lý, không thể ẩn!`);
            return;
        }
        const confirmMessage = product.is_enabled ? "Bạn có chắc chắn muốn ẩn sản phẩm này?" : "Bạn có chắc chắn muốn hiển thị sản phẩm này?";
        if (window.confirm(confirmMessage)) {
            setProducts(products.map(p => p.id === product.id ? { ...p, is_enabled: !p.is_enabled } : p));
        }
    };

    const filteredProducts = products.filter(product => 
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.barcode.includes(searchTerm)
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="mb-4 flex justify-between">
                <input 
                    type="text" 
                    placeholder="Tìm kiếm sản phẩm..." 
                    className="p-2 border rounded w-1/3" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <button className="bg-green-500 text-white px-4 py-2 rounded\" onClick={() => window.location.href = '/addproduct'}>+ Thêm sản phẩm</button>
            </div>
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">ID</th>
                        <th className="p-2">Tên sản phẩm</th>
                        <th className="p-2">Mã vạch</th>
                                                <th className="p-2">Đơn vị bán ra (Chai, lọ, gói,...)</th>
                                                <th className="p-2">Trọng lượng (kg)</th>
                        <th className="p-2">Thể tích (l)</th>
                        <th className="p-2">Hình ảnh</th>
                        <th className="p-2">Danh mục</th>
                        <th className="p-2">Trạng thái</th>
                        <th className="p-2">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product) => (
                        <tr key={product.id}>
                            <td className="p-2">{product.id}</td>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2">{product.barcode}</td>
                                                        <td className="p-2">{product.base_unit}</td>
                                                        <td className="p-2">{product.weight !== null ? product.weight : 'N/A'}</td>
                            <td className="p-2">{product.volume !== null ? product.volume : 'N/A'}</td>
                            <td className="p-2"><img src={product.image_url} alt={product.name} className="w-12 h-12 object-cover" /></td>
                            <td className="p-2">{product.category}</td>
                            <td className="p-2">{product.is_enabled ? 'Hiển thị' : 'Ẩn'}</td>
                            <td className="p-2">
                                <button 
                                    className={`px-3 py-1 rounded ${product.is_enabled ? 'bg-red-500' : 'bg-blue-500'} text-white`} 
                                    onClick={() => toggleProductStatus(product)}
                                >
                                    {product.is_enabled ? 'Ẩn' : 'Hiển thị'}
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductListComponent;
