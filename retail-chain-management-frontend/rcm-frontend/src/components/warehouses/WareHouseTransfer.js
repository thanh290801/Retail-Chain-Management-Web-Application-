import React, { useState, useEffect } from 'react';

const WarehouseTransferComponent = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [transfers, setTransfers] = useState([
        { id: 'DC0001', from: 'Kho B', to: 'Kho A', products: [{ name: 'Sữa đậu', quantity: 100 }] },
        { id: 'DC0002', from: 'Kho A', to: 'Kho B', products: [{ name: 'Bánh mì', quantity: 200 }] }
    ]);
    
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [fromWarehouse, setFromWarehouse] = useState('');
    const [toWarehouse, setToWarehouse] = useState('');
    const [productName, setProductName] = useState('');
    const [productQuantity, setProductQuantity] = useState(0);

    useEffect(() => {
        setWarehouses(['Kho A', 'Kho B', 'Kho C']);
    }, []);

    const handleAddProduct = () => {
        if (productName && productQuantity > 0) {
            setSelectedProducts([...selectedProducts, { name: productName, quantity: productQuantity }]);
            setProductName('');
            setProductQuantity(0);
        }
    };

    const handleEditProduct = (index) => {
        const product = selectedProducts[index];
        setProductName(product.name);
        setProductQuantity(product.quantity);
        handleDeleteProduct(index);
    };

    const handleDeleteProduct = (index) => {
        setSelectedProducts(selectedProducts.filter((_, i) => i !== index));
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">🚚 Quản Lý Phiếu Điều Chuyển Kho Hàng</h2>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Kho gửi</label>
                <select className="w-full p-2 border rounded" value={fromWarehouse} onChange={(e) => setFromWarehouse(e.target.value)}>
                    <option value="">Chọn kho gửi</option>
                    {warehouses.map((warehouse, index) => (
                        <option key={index} value={warehouse}>{warehouse}</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Kho nhận</label>
                <select className="w-full p-2 border rounded" value={toWarehouse} onChange={(e) => setToWarehouse(e.target.value)}>
                    <option value="">Chọn kho nhận</option>
                    {warehouses.map((warehouse, index) => (
                        <option key={index} value={warehouse}>{warehouse}</option>
                    ))}
                </select>
            </div>
            <div className="mb-4">
                <label className="block mb-1 font-medium">Sản phẩm điều chuyển</label>
                <div className="flex space-x-2 mb-2">
                    <input type="text" placeholder="Nhập tên sản phẩm" className="w-full p-2 border rounded" value={productName} onChange={(e) => setProductName(e.target.value)} />
                    <input type="number" placeholder="Nhập số lượng" className="w-full p-2 border rounded" value={productQuantity} onChange={(e) => setProductQuantity(Number(e.target.value))} />
                    <button onClick={handleAddProduct} className="bg-blue-500 text-white px-4 py-2 rounded">Thêm</button>
                </div>
                <ul>
                    {selectedProducts.map((product, index) => (
                        <li key={index} className="p-2 border rounded mb-2 flex justify-between">
                            {product.name} - Số lượng: {product.quantity}
                            <div>
                                <button onClick={() => handleEditProduct(index)} className="bg-yellow-500 text-white px-2 py-1 rounded mr-2">Sửa</button>
                                <button onClick={() => handleDeleteProduct(index)} className="bg-red-500 text-white px-2 py-1 rounded">Xóa</button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
            <button className="bg-green-500 text-white px-4 py-2 rounded">Tạo phiếu điều chuyển</button>
        </div>
    );
};

export default WarehouseTransferComponent;
