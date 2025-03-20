import { useState, useEffect } from "react";
import axios from "axios";
import { Table, Button, Form, Pagination } from "react-bootstrap";
import { useNavigate } from "react-router-dom";

const API_URL = "https://localhost:5000/api/orders";
const SUPPLIER_API_URL = "https://localhost:5000/api/suppliers"; // ✅ API lấy danh sách nhà cung cấp

// ✅ Hàm lấy token và decode lấy `branchId` và `accountId`
const getAuthHeader = () => {
    const token = localStorage.getItem("token"); 
    return { headers: { Authorization: `Bearer ${token}` } };
};

// ✅ Hàm decode token để lấy `branchId` và `accountId`
const decodeToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return { BranchId: null, AccountId: null };

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode JWT token
        return { branchId: payload.BranchId, accountId: payload.AccountId };
    } catch (error) {
        console.error("Error decoding token:", error);
        return { branchId: null, accountId: null };
    }
};

export function OrderList() {
    const [orders, setOrders] = useState([]);
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [suppliers, setSuppliers] = useState([]); // ✅ Danh sách nhà cung cấp đầy đủ
    const [selectedStatus, setSelectedStatus] = useState("");
    const [selectedSupplier, setSelectedSupplier] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // ✅ Số đơn hàng mỗi trang
    const navigate = useNavigate();
    const { branchId, accountId } = decodeToken(); 

    useEffect(() => {
        if (!branchId || !accountId) {
            console.error("Missing branchId or accountId");
            return;
        }

        axios.get(`${API_URL}?branchId=${branchId}&accountId=${accountId}`, getAuthHeader())
            .then(response => {
                setOrders(response.data);
                setFilteredOrders(response.data);
            })
            .catch(error => console.error("Error fetching orders:", error));

        // ✅ Lấy danh sách tất cả nhà cung cấp
        axios.get(SUPPLIER_API_URL+ '/get-all', getAuthHeader())
            .then(response => {
                setSuppliers(response.data); // ✅ Cập nhật danh sách nhà cung cấp từ API
            })
            .catch(error => console.error("Error fetching suppliers:", error));
    }, [branchId, accountId]);

    // ✅ Hàm xử lý lọc dữ liệu
    useEffect(() => {
        let filtered = orders;

        if (selectedStatus) {
            filtered = filtered.filter(order => order.paymentStatus === selectedStatus);
        }

        if (selectedSupplier) {
            filtered = filtered.filter(order => order.supplierName === selectedSupplier);
        }

        if (selectedMonth) {
            filtered = filtered.filter(order => new Date(order.createdDate).getMonth() + 1 === parseInt(selectedMonth));
        }

        if (selectedYear) {
            filtered = filtered.filter(order => new Date(order.createdDate).getFullYear() === parseInt(selectedYear));
        }

        setFilteredOrders(filtered);
        setCurrentPage(1); // Reset về trang đầu tiên sau khi lọc
    }, [selectedStatus, selectedSupplier, selectedMonth, selectedYear, orders]);

    // ✅ Phân trang danh sách đơn hàng
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    return (
        <div className="container mt-4">
            <h2>Danh Sách Đơn Hàng</h2>

            {/* 🔍 Bộ lọc */}
            <div className="d-flex gap-3 mb-3">
                <Form.Select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}>
                    <option value="">-- Lọc theo trạng thái --</option>
                    <option value="Chưa nhận hàng">Chưa nhận hàng</option>
                    <option value="Đã nhận một phần">Nhận một phần</option>
                    <option value="Đã nhận đủ hàng">Đã nhận đủ</option>
                </Form.Select>

                <Form.Select value={selectedSupplier} onChange={e => setSelectedSupplier(e.target.value)}>
                    <option value="">-- Lọc theo nhà cung cấp --</option>
                    {suppliers.map(supplier => (
                        <option key={supplier.suppliersId} value={supplier.name}>{supplier.name}</option>
                    ))}
                </Form.Select>

                <Form.Select value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}>
                    <option value="">-- Chọn tháng --</option>
                    {[...Array(12)].map((_, i) => (
                        <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                    ))}
                </Form.Select>

                <Form.Select value={selectedYear} onChange={e => setSelectedYear(e.target.value)}>
                    <option value="">-- Chọn năm --</option>
                    {[...Array(5)].map((_, i) => {
                        const year = new Date().getFullYear() - i;
                        return <option key={year} value={year}>{year}</option>;
                    })}
                </Form.Select>
            </div>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Ngày tạo</th>
                        <th>Nhà cung cấp</th>
                        <th>Tổng tiền</th>
                        <th>Trạng thái</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {currentOrders.map(order => (
                        <tr key={order.orderId}>
                            <td>{order.orderId}</td>
                            <td>{new Date(order.createdDate).toLocaleDateString()}</td>
                            <td>{order.supplierName || "Không có nhà cung cấp"}</td>
                            <td>{order.totalAmount.toLocaleString()} VNĐ</td>
                            <td>{order.paymentStatus}</td>
                            <td>
                                <Button variant="info" onClick={() => navigate(`/order/${order.orderId}`)}>
                                    Xem chi tiết
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* ✅ Thanh phân trang */}
            {totalPages > 1 && (
                <Pagination>
                    <Pagination.Prev onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} />
                    {[...Array(totalPages)].map((_, i) => (
                        <Pagination.Item key={i} active={i + 1 === currentPage} onClick={() => setCurrentPage(i + 1)}>
                            {i + 1}
                        </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} />
                </Pagination>
            )}
        </div>
    );
}

export default OrderList;
