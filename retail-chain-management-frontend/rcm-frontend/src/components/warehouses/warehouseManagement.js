import React, { useState } from 'react';

const WarehouseManagementComponent = () => {
    const [warehouses, setWarehouses] = useState([
        { id: 'KH0001', name: 'Kho A', address: 'ICD Mỹ Đình, 17 Phạm Hùng, Mỹ Đình 2, Nam Từ Liêm, Hà Nội', capacity: 15000 },
        { id: 'KH0002', name: 'Kho B', address: 'CN2A, Cụm CN Quất Động, Thường Tín, Hà Nội', capacity: 10000 },
        { id: 'KH0003', name: 'Kho C', address: 'Lô 7.1.3 KCN Nam Thăng Long, P.Liên Mạc, Q.Bắc Từ Liêm, Hà Nội', capacity: 16000 }
    ]);

    const [selectedWarehouse, setSelectedWarehouse] = useState(null);

    const handleSelectWarehouse = (warehouse) => {
        setSelectedWarehouse(warehouse);
    };

    const handleDelete = (id) => {
        if (window.confirm("Bạn có chắc chắn muốn xóa kho này không?")) {
            setWarehouses(warehouses.filter(warehouse => warehouse.id !== id));
            if (selectedWarehouse?.id === id) {
                setSelectedWarehouse(null);
            }
        }
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📦 Quản Lý Kho Hàng</h2>
            <div className="mt-6 mb-4">
                <h3 className="text-lg font-semibold">📋 Danh sách Kho Hàng</h3>
            </div>
            <div className="flex justify-end mb-4">
                <button onClick={() => setSelectedWarehouse({ id: '', name: '', address: '', capacity: '' })} className="bg-green-500 text-white px-4 py-2 rounded">+ Thêm kho hàng</button>
            </div>
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã kho</th>
                        <th className="p-2">Tên kho</th>
                        <th className="p-2">Địa chỉ</th>
                        <th className="p-2">Dung tích (m³)</th>
                        <th className="p-2">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map((warehouse) => (
                        <tr key={warehouse.id} onClick={() => handleSelectWarehouse(warehouse)} className="cursor-pointer hover:bg-gray-100">
                            <td className="p-2">{warehouse.id}</td>
                            <td className="p-2">{warehouse.name}</td>
                            <td className="p-2">{warehouse.address}</td>
                            <td className="p-2">{warehouse.capacity}</td>
                            <td className="p-2 space-x-2">
                                <button onClick={(e) => { e.stopPropagation(); handleDelete(warehouse.id); }} className="bg-red-500 text-white px-2 py-1 rounded">Xóa</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {selectedWarehouse && (
                <div className="mt-6 border p-4 rounded bg-gray-50">
                    <h4 className="font-semibold">{selectedWarehouse.id ? 'Chỉnh sửa kho hàng' : 'Thêm kho hàng'}</h4>
                    <label className="block mb-1 font-medium">Mã kho</label>
                    <input type="text" className="w-full p-2 border rounded" value={selectedWarehouse?.id || ''} onChange={(e) => setSelectedWarehouse({...selectedWarehouse, id: e.target.value})} />
                    <label className="block mb-1 font-medium mt-2">Tên kho</label>
                    <input type="text" className="w-full p-2 border rounded" value={selectedWarehouse?.name || ''} onChange={(e) => setSelectedWarehouse({...selectedWarehouse, name: e.target.value})} />
                    <label className="block mb-1 font-medium mt-2">Địa chỉ kho</label>
                    <textarea className="w-full p-2 border rounded" value={selectedWarehouse?.address || ''} onChange={(e) => setSelectedWarehouse({...selectedWarehouse, address: e.target.value})} />
                    <label className="block mb-1 font-medium mt-2">Dung tích kho (m³)</label>
                    <input type="number" className="w-full p-2 border rounded" value={selectedWarehouse?.capacity || ''} onChange={(e) => setSelectedWarehouse({...selectedWarehouse, capacity: e.target.value})} />
                    <div className="mt-4 flex space-x-2">
                        <button onClick={() => {
                            if (selectedWarehouse.id) {
                                setWarehouses([...warehouses.filter(w => w.id !== selectedWarehouse.id), selectedWarehouse]);
                                setSelectedWarehouse(null);
                            }
                        }} className="bg-green-500 text-white px-4 py-2 rounded">Lưu kho</button>
                        <button onClick={() => setSelectedWarehouse(null)} className="bg-gray-500 text-white px-4 py-2 rounded">Hủy</button>
                    </div>
                </div>
            )}
        </div>       
            
    );
};

export default WarehouseManagementComponent;
