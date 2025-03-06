import React, { useState } from 'react';
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
const OrderCheckComponent = () => {



const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [products, setProducts] = useState([]);
    const [previousEntries, setPreviousEntries] = useState([]);
    const [confirmedOrder, setConfirmedOrder] = useState(null);

    useEffect(() => {
        if (orderId) {
            const fetchedPreviousEntries = [
                { id: 'MNH001', date: '2024-02-10', products: [
                    { name: 'Áo khoác đầm dáng xòe', unit: 'Cái', received: 2 },
                    { name: 'Siro đường đen Eurodeli', unit: 'Hộp', received: 3 }
                ]},
                { id: 'MNH002', date: '2024-02-15', products: [
                    { name: 'Áo khoác đầm dáng xòe', unit: 'Cái', received: 4 },
                    { name: 'Siro đường đen Eurodeli', unit: 'Hộp', received: 3 }
                ]}
            ];
    
            const fetchedOrder = {
                id: orderId,
                products: [
                    { name: 'Áo khoác đầm dáng xòe', unit: 'Cái', ordered: 10, received: 10, status: 'Đủ' },
                    { name: 'Siro đường đen Eurodeli', unit: 'Hộp', ordered: 10, received: 10, status: 'Đủ' }
                ]
            };
    
            setPreviousEntries(fetchedPreviousEntries);
            setOrder(fetchedOrder);
            setProducts(fetchedOrder.products.map(product => {
                const totalReceived = fetchedPreviousEntries.reduce((sum, entry) => {
                    const previousProduct = entry.products.find(p => p.name === product.name);
                    return sum + (previousProduct ? previousProduct.received : 0);
                }, 0);
                return { 
                    ...product, 
                    previousReceived: totalReceived, 
                    received: 0, 
                    status: totalReceived >= product.ordered ? 'Đủ' : 'Chưa đủ' 
                };
            }));
        }
    }, [orderId]);

    const handleUpdateProduct = (index, value) => {
        const updatedProducts = [...products];
        const totalReceived = updatedProducts[index].previousReceived + value;
        let status;
        
        if (totalReceived > updatedProducts[index].ordered) {
            const excess = totalReceived - updatedProducts[index].ordered;
            status = `Thừa ${excess}`;
        } else {
            status = totalReceived >= updatedProducts[index].ordered ? 'Đủ' : 'Chưa đủ';
        }

        updatedProducts[index].received = value;
        updatedProducts[index].status = status;
        setProducts(updatedProducts);
    };

    const handleConfirm = () => {
        const today = new Date().toISOString().split('T')[0];
        const newEntry = {
            id: `MNH${previousEntries.length + 3}`,
            date: today,
            products: products.filter(product => product.received > 0)
        };
        setPreviousEntries([...previousEntries, newEntry]);
        setConfirmedOrder(newEntry);
    };

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">📋 Kiểm tra Nhập Đủ Order</h2>
            <p className="mb-2"><strong>Nhà phân phối:</strong> Nhà phân phối A</p>
            <p className="mb-2"><strong>Người giao hàng:</strong> Nguyễn Văn B</p>
            <p className="mb-4"><strong>Số điện thoại:</strong> 0987 654 321</p>
            <h3 className="text-lg font-semibold mb-4">Mã đơn hàng: {orderId}</h3>
            {order && (
                <div>
                    <table className="w-full bg-white shadow-md rounded">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">STT</th>
                                <th className="p-2">Tên sản phẩm</th>
                                <th className="p-2">Đơn vị</th>
                                <th className="p-2">Số lượng đặt</th>
                                <th className="p-2">Số lượng đã nhập (Trước)</th>
                                <th className="p-2">Số lượng đã nhập (Hiện tại)</th>
                                <th className="p-2">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((product, index) => (
                                <tr key={index}>
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">{product.name}</td>
                                    <td className="p-2">{product.unit}</td>
                                    <td className="p-2">{product.ordered}</td>
                                    <td className="p-2">{product.previousReceived}</td>
                                    <td className="p-2">
                                        <input 
                                            type="number" 
                                            className="w-full p-2 border rounded" 
                                            value={product.received} 
                                            onChange={(e) => handleUpdateProduct(index, Number(e.target.value))} 
                                        />
                                    </td>
                                    <td className={`p-2 ${product.status.includes('Thừa') ? 'text-red-500' : 'text-black'}`}>{product.status}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <button className="mt-4 bg-blue-500 text-white px-4 py-2 rounded" onClick={handleConfirm}>Xác nhận nhập hàng</button>
                </div>
            )}
            </div>
    )
}
                       

export default OrderCheckComponent;
