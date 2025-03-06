import React, { useEffect, useState } from 'react';

const ProductStockComponent = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [showLowStock, setShowLowStock] = useState(false);

    useEffect(() => {
        // Fake dữ liệu tồn kho với tồn kho tối thiểu cho từng sản phẩm
        const fakeStock = [
            { id: 'SP000025', name: 'Hộp phở bò phở cổ', category: 'Thực phẩm ăn liền', unit: 'Thùng', stock: 120, minStock: 30, image: 'https://www.havietfoods.vn/upload/Pho%20Bo%20(goi).jpg' },
            { id: 'SP000026', name: 'Bánh Oreo', category: 'Bánh kẹo', unit: 'Hộp', stock: 50, minStock: 20, image: 'https://example.com/oreo.jpg' },
            { id: 'SP000027', name: 'Nước ngọt Coca Cola', category: 'Đồ uống', unit: 'Lon', stock: 10, minStock: 50, image: 'https://example.com/coca.jpg' } // Tồn kho thấp
        ];
        setProducts(fakeStock);
    }, []);

    const handleMinStockChange = (index, value) => {
        const updatedProducts = [...products];
        updatedProducts[index].minStock = Number(value);
        setProducts(updatedProducts);
    };

    const filteredProducts = products.filter(product => 
        (product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.id.includes(searchTerm)) &&
        (!showLowStock || product.stock < product.minStock)
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="mb-4 flex justify-between items-center">
                <input 
                    type="text" 
                    placeholder="Tìm kiếm theo mã hoặc tên sản phẩm..." 
                    className="p-2 border rounded w-1/3" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                />
                <div className="flex items-center">
                    <input 
                        type="checkbox" 
                        className="mr-2" 
                        checked={showLowStock} 
                        onChange={() => setShowLowStock(!showLowStock)} 
                    />
                    <label>Chỉ hiển thị sản phẩm sắp hết hàng</label>
                </div>
            </div>
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã sản phẩm</th>
                        <th className="p-2">Ảnh sản phẩm</th>
                        <th className="p-2">Tên sản phẩm</th>
                        <th className="p-2">Loại sản phẩm</th>
                        <th className="p-2">Đơn vị</th>
                        <th className="p-2">Tồn kho</th>
                        <th className="p-2">Tồn kho tối thiểu</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product, index) => (
                        <tr key={product.id} className={product.stock < product.minStock ? 'bg-red-100' : ''}>
                            <td className="p-2">{product.id}</td>
                            <td className="p-2"><img src={product.image} alt="Ảnh sản phẩm" width="50" /></td>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2">{product.category}</td>
                            <td className="p-2">{product.unit}</td>
                            <td className={`p-2 font-semibold ${product.stock < product.minStock ? 'text-red-600' : ''}`}>{product.stock}</td>
                            <td className="p-2">
                                <input 
                                    type="number" 
                                    className="w-16 p-1 border rounded text-center" 
                                    value={product.minStock} 
                                    onChange={(e) => handleMinStockChange(index, e.target.value)}
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default ProductStockComponent;
