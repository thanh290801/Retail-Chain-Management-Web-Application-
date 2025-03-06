import React, { useState } from 'react';

const StockCheckComponent = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [products, setProducts] = useState([
        { id: 'P001', name: 'Nước ngọt Coca Cola', unit: 'Lon', quantity: 0 },
        { id: 'P002', name: 'Bánh Oreo', unit: 'Hộp', quantity: 0 },
        { id: 'P003', name: 'Sữa Vinamilk', unit: 'Thùng', quantity: 0 }
    ]);

    const handleQuantityChange = (index, value) => {
        const updatedProducts = [...products];
        updatedProducts[index].quantity = value;
        setProducts(updatedProducts);
    };

    const filteredProducts = products.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📋 Tạo Phiếu Kiểm Kho</h2>
            <div className="mb-6 p-4 border rounded bg-gray-50">
                <h3 className="text-lg font-semibold mb-2">Thông tin kiểm kho</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block font-medium">Kho kiểm:</label>
                        <input type="text" className="w-full p-2 border rounded bg-gray-100" value="Kho Trung Tâm" disabled />
                    </div>
                    <div>
                        <label className="block font-medium">Người kiểm kho:</label>
                        <input type="text" className="w-full p-2 border rounded bg-gray-100" value="Nguyễn Văn A" disabled />
                    </div>
                </div>
            </div>
            
            
            <input 
                type="text" 
                placeholder="Tìm kiếm hàng hóa..." 
                className="p-2 border rounded w-full mb-4" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã hàng</th>
                        <th className="p-2">Tên hàng</th>
                        <th className="p-2">Đơn vị</th>
                        <th className="p-2">Số lượng trên hệ thống</th>
                        <th className="p-2">Số lượng kiểm</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredProducts.map((product, index) => (
                        <tr key={product.id}>
                            <td className="p-2">{product.id}</td>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2">{product.unit}</td>
                            <td className="p-2">100</td>
                            <td className="p-2">
                                <input 
                                    type="number" 
                                    className="w-full p-2 border rounded" 
                                    value={product.quantity} 
                                    onChange={(e) => handleQuantityChange(index, Number(e.target.value))} 
                                />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <button className="mt-4 bg-green-500 text-white px-4 py-2 rounded">Tạo Phiếu Kiểm Kho</button>
        </div>
    );
};

export default StockCheckComponent;
