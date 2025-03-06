import React, { useState, useEffect } from 'react';

const OrderListComponent = () => {
    const [orders, setOrders] = useState([]);
    const [filterStatus, setFilterStatus] = useState('');
    const [filterDistributor, setFilterDistributor] = useState('');
    const [filterTime, setFilterTime] = useState('all');

    useEffect(() => {
        // Fake dữ liệu đơn hàng
        const fakeOrders = [
            { id: 'ORD001', distributor: 'Nhà phân phối A', date: '2025-03-04', status: 'completed' },
            { id: 'ORD002', distributor: 'Nhà phân phối B', date: '2025-03-02', status: 'partial' },
            { id: 'ORD003', distributor: 'Nhà phân phối C', date: '2025-03-03', status: 'pending' }
        ];
        setOrders(fakeOrders);
    }, []);

    const filterByTime = (date) => {
        const now = new Date();
        const orderDate = new Date(date);
        
        // Xác định ngày đầu tuần (Thứ Hai)
        const startOfWeek = new Date(now);
        const dayOfWeek = now.getDay() === 0 ? 6 : now.getDay() - 1; // Nếu Chủ Nhật, tính lùi 6 ngày
        startOfWeek.setDate(now.getDate() - dayOfWeek);
        startOfWeek.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        
        switch (filterTime) {
            case 'today':
                return orderDate.toDateString() === now.toDateString();
            case 'week':
                return orderDate >= startOfWeek && orderDate <= now;
            case 'month':
                return orderDate >= startOfMonth && orderDate <= now;
            case 'year':
                return orderDate >= startOfYear && orderDate <= now;
            default:
                return true;
        }
    };

    const filteredOrders = orders.filter(order => 
        (!filterStatus || order.status === filterStatus) &&
        (!filterDistributor || order.distributor === filterDistributor) &&
        filterByTime(order.date)
    );

    return (
        <div className="p-6 bg-white rounded-lg shadow-md">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">📦 Danh Sách Đơn Hàng</h2>
                <button onClick={() => window.location.href = '/createorder'} className="bg-green-500 text-white px-4 py-2 rounded">+ Tạo đơn hàng</button>
            </div>
            <div className="mb-4 flex justify-between items-center">
                <select className="p-2 border rounded" onChange={(e) => setFilterStatus(e.target.value)}>
                    <option value="">Tất cả trạng thái</option>
                    <option value="completed">Đã hoàn thành</option>
                    <option value="partial">Giao một phần</option>
                    <option value="pending">Chưa giao</option>
                </select>
                <select className="p-2 border rounded" onChange={(e) => setFilterDistributor(e.target.value)}>
                    <option value="">Tất cả nhà phân phối</option>
                    <option value="Nhà phân phối A">Nhà phân phối A</option>
                    <option value="Nhà phân phối B">Nhà phân phối B</option>
                    <option value="Nhà phân phối C">Nhà phân phối C</option>
                </select>
                <select className="p-2 border rounded" onChange={(e) => setFilterTime(e.target.value)}>
                    <option value="all">Tất cả thời gian</option>
                    <option value="today">Trong ngày</option>
                    <option value="week">Trong tuần</option>
                    <option value="month">Trong tháng</option>
                    <option value="year">Trong năm</option>
                </select>
            </div>
            <table className="w-full bg-white shadow-md rounded">
                <thead className="bg-gray-100">
                    <tr>
                        <th className="p-2">Mã đơn hàng</th>
                        <th className="p-2">Nhà phân phối</th>
                        <th className="p-2">Ngày tạo</th>
                        <th className="p-2">Kho nhập hàng</th>
                        <th className="p-2">Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredOrders.map((order) => (
                        <tr key={order.id} className={
                            order.status === 'completed' ? 'bg-green-100' :
                            order.status === 'partial' ? 'bg-yellow-100' : 'bg-red-100'
                        } onClick={() => window.location.href = `/ordercheck/${order.id}`}>
                            <td className="p-2 cursor-pointer text-blue-500\" 
                              >{order.id}</td>
                            <td className="p-2">{order.distributor}</td>
                            <td className="p-2">{order.date}</td>
                            <td className="p-2">Kho Trung Tâm</td>
                            <td className="p-2 font-semibold">
                                {order.status === 'completed' ? '✅ Hoàn thành' :
                                order.status === 'partial' ? '⚠ Giao một phần' : '❌ Chưa giao'}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default OrderListComponent;
