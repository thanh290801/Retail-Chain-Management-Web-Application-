import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';

const CreateStockAdjustment = () => {
    const [products, setProducts] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [notes, setNotes] = useState('');
    const [warehouseId, setWarehouseId] = useState(null);
    const [auditorId, setAuditorId] = useState(null);

    const [currentPageProducts, setCurrentPageProducts] = useState(1);
    const [currentPageSelected, setCurrentPageSelected] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            const decodedToken = jwtDecode(token);
            if(decodedToken.BranchId){
                setWarehouseId(decodedToken.BranchId);
            }
            if(decodedToken.AccountId){
                setAuditorId(decodedToken.AccountId);
            }
        }
    }, []);

    useEffect(() => {
        if (warehouseId) {
            axios.get(`https://localhost:5000/api/warehouse/${warehouseId}/products`)
                .then(res => setProducts(res.data))
                .catch(err => console.error("Failed to fetch products:", err));
        }
    }, [warehouseId]);

    const addProductToAdjustment = (product) => {
        setSelectedProducts([...selectedProducts, {
            productId: product.productsId,
            productName: product.name,
            unit: product.unit,
            previousQuantity: product.quantity,
            adjustedQuantity: product.quantity,
            reason: ''
        }]);
        setProducts(products.filter(p => p.productsId !== product.productsId));
    };

    const handleAdjustmentChange = (index, field, value) => {
        const newItems = [...selectedProducts];
        newItems[index][field] = value;
        setSelectedProducts(newItems);
    };

    const removeFromAdjustment = (product) => {
        setProducts([...products, {
            productsId: product.productId,
            name: product.productName,
            unit: product.unit,
            quantity: product.previousQuantity
        }]);
        setSelectedProducts(selectedProducts.filter(p => p.productId !== product.productId));
    };

    const submitAdjustment = () => {
        axios.post('https://localhost:5000/api/stockadjustments/CreateStockAdjustment', {
            warehouseId,
            auditorId,
            notes,
            items: selectedProducts.map(p => ({
                productId: p.productId,
                previousQuantity: p.previousQuantity,
                adjustedQuantity: parseInt(p.adjustedQuantity),
                reason: p.reason
            }))
        }).then(res => {
            alert("Đã tạo phiếu điều chỉnh thành công!");
            setSelectedProducts([]);
            setNotes('');
        }).catch(err => alert("Có lỗi xảy ra khi tạo phiếu điều chỉnh!"));
    };

    const paginate = (items, page) => items.slice((page - 1) * itemsPerPage, page * itemsPerPage);

    return (
        <div className="p-4 bg-gray-100 rounded shadow-lg">
            <h3 className="text-2xl font-bold mb-4">Phiếu điều chỉnh tồn kho</h3>

            <input
                type="text"
                placeholder="Tìm sản phẩm..."
                className="border p-2 w-full mb-3"
                onChange={(e) => setSearchTerm(e.target.value)}
            />

            <div className="border p-3 max-h-60 overflow-auto mb-3 bg-white">
                {paginate(products.filter(p => p.name && p.name.toLowerCase().includes(searchTerm.toLowerCase())), currentPageProducts).map(product => (
                    <div key={product.productsId} className="p-1 cursor-pointer hover:bg-gray-100"
                        onClick={() => addProductToAdjustment(product)}>
                        {product.name} (Tồn kho: {product.quantity} {product.unit})
                    </div>
                ))}
            </div>
            <div className="mb-3">
                <button className="px-2 py-1 mr-2 border" onClick={() => setCurrentPageProducts(Math.max(1, currentPageProducts - 1))}>Prev</button>
                <button className="px-2 py-1 border" onClick={() => setCurrentPageProducts(currentPageProducts + 1)}>Next</button>
            </div>

            <textarea
                placeholder="Ghi chú chung cho phiếu"
                className="border p-2 w-full mb-3"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
            />

            <div className="p-3 bg-blue-100 rounded mb-3 shadow">
                <table className="table-auto w-full">
                    <thead>
                        <tr>
                            <th className="border px-4 py-2">Sản phẩm</th>
                            <th className="border px-4 py-2">Đơn vị</th>
                            <th className="border px-4 py-2">Tồn kho</th>
                            <th className="border px-4 py-2">Số lượng mới</th>
                            <th className="border px-4 py-2">Lý do điều chỉnh</th>
                            <th className="border px-4 py-2">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginate(selectedProducts.filter(p => p.productName && p.productName.toLowerCase().includes(searchTerm.toLowerCase())), currentPageSelected).map((item, idx) => (
                            <tr key={item.productId}>
                                <td className="border px-4 py-2">{item.productName}</td>
                                <td className="border px-4 py-2">{item.unit}</td>
                                <td className="border px-4 py-2">{item.previousQuantity}</td>
                                <td className="border px-4 py-2">
                                    <input type="number" className="border px-2 w-full" value={item.adjustedQuantity}
                                        onChange={(e) => handleAdjustmentChange(idx, 'adjustedQuantity', e.target.value)} />
                                </td>
                                <td className="border px-4 py-2">
                                    <input type="text" className="border px-2 w-full" value={item.reason}
                                        onChange={(e) => handleAdjustmentChange(idx, 'reason', e.target.value)} />
                                </td>
                                <td className="border px-4 py-2">
                                    <button className="text-red-500" onClick={() => removeFromAdjustment(item)}>Xóa</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <button className="bg-blue-500 text-white px-4 py-2 mt-4" onClick={submitAdjustment}>Tạo phiếu điều chỉnh</button>
        </div>
    );
};

export default CreateStockAdjustment;
