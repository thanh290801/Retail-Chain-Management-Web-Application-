import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Pagination } from "react-bootstrap";
import { useParams } from "react-router-dom";

const API_URL = "https://localhost:5000/api/orders";

// Hàm để giải mã token JWT và lấy thông tin
const getUserInfoFromToken = () => {
    const token = localStorage.getItem("token");
    if (!token) return { branchId: null, accountId: null };

    try {
        const payload = JSON.parse(atob(token.split(".")[1])); // Giải mã payload của token
        return {
            branchId: payload.BranchId || null,
            accountId: payload.AccountId || null
        };
    } catch (error) {
        console.error("Lỗi khi giải mã token:", error);
        return { branchId: null, accountId: null };
    }
};

const OrderCheck = () => {
    const { orderId } = useParams();
    const [order, setOrder] = useState(null);
    const [receiveData, setReceiveData] = useState([]);
    const [searchTerm, setSearchTerm] = useState(""); // 🔍 Thanh tìm kiếm
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10; // ✅ Số sản phẩm mỗi trang

    // Lấy branchId và accountId từ token
    const { branchId, accountId } = getUserInfoFromToken();

    useEffect(() => {
        if (!branchId || !accountId) {
            console.error("Thiếu thông tin branchId hoặc accountId.");
            return;
        }

        axios.get(`${API_URL}/${orderId}?branchId=${branchId}&accountId=${accountId}`, {
            headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`
            }
        })
        .then(response => {
            setOrder(response.data);
            setReceiveData(response.data.products.map(p => ({
                productId: p.productId,
                receivedQuantity: 0,
                purchasePrice: p.purchasePrice
            })));
        })
        .catch(error => console.error("Error fetching order details:", error));
    }, [orderId, branchId, accountId]);

    const handleReceiveChange = (index, value) => {
        const newReceiveData = [...receiveData];
        newReceiveData[index].receivedQuantity = parseInt(value) || 0;
        setReceiveData(newReceiveData);
    };

    const totalReceiveCost = receiveData.reduce((sum, p) => sum + (p.receivedQuantity * p.purchasePrice), 0);

    const handleReceiveSubmit = () => {
        if (!branchId || !accountId) {
            console.error("Không có branchId hoặc accountId hợp lệ.");
            return;
        }

        axios.post(`${API_URL}/${orderId}/receive`, {
            branchId,
            products: receiveData
        }, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        })
        .then(response => {
            alert(`Đơn nhận hàng thành công!`);
            window.location.reload();
        })
        .catch(error => console.error("Error submitting receive order:", error));
    };

    if (!order) return <p>Loading...</p>;

    // 🔍 Bộ lọc sản phẩm theo tên
    const filteredProducts = order.products.filter(p =>
        p.productName.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // ✅ Phân trang sản phẩm
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);

    return (
        <div className="container mt-4">
            <h2>Chi Tiết Đơn Hàng #{order.orderId}</h2>
            <h4>Nhà cung cấp: {order.supplierName || "Không có nhà cung cấp"}</h4>

            {/* 🔍 Thanh tìm kiếm sản phẩm */}
            <Form.Group className="mb-3">
                <Form.Control
                    type="text"
                    placeholder="Tìm kiếm sản phẩm..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Form.Group>

            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Mã SP</th>
                        <th>Tên SP</th>
                        <th>Đơn vị</th>
                        <th>Giá nhập</th>
                        <th>SL đặt</th>
                        <th>SL đã nhận</th>
                        <th>Nhận lần này</th>
                        <th>Tổng giá</th>
                    </tr>
                </thead>
                <tbody>
                    {currentProducts.map((p, index) => (
                        <tr key={p.productId}>
                            <td>{p.productId}</td>
                            <td>{p.productName}</td>
                            <td>{p.unit}</td>
                            <td>{p.purchasePrice ? p.purchasePrice.toLocaleString() : "0"} VNĐ</td>
                            <td>{p.orderedQuantity}</td>
                            <td>{p.receivedQuantity}</td>
                            <td>
                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={receiveData[index]?.receivedQuantity || 0}
                                    onChange={e => handleReceiveChange(index, e.target.value)}
                                />
                            </td>
                            <td>{(receiveData[index]?.receivedQuantity * p.purchasePrice).toLocaleString()} VNĐ</td>
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

            <h4>Tổng giá nhập hàng: {totalReceiveCost.toLocaleString()} VNĐ</h4>

            <Button variant="primary" onClick={handleReceiveSubmit}>Tạo đơn nhận hàng</Button>

            <h4>Danh sách Batches:</h4>
            <Table striped bordered hover>
                <thead>
                    <tr>
                        <th>Mã Batch</th>
                        <th>Ngày nhận</th>
                        <th>Tổng giá</th>
                        <th>Trạng thái</th>
                    </tr>
                </thead>
                <tbody>
                    {order.batches?.length > 0 ? order.batches.map(batch => (
                        <tr key={batch.batchId}>
                            <td>{batch.batchId}</td>
                            <td>{batch.receivedDate ? new Date(batch.receivedDate).toLocaleDateString() : "Chưa có"}</td>
                            <td>{batch.totalPrice ? batch.totalPrice.toLocaleString() : "0"} VNĐ</td>
                            <td>{batch.status}</td>
                        </tr>
                    )) : <tr><td colSpan="4">Không có Batch nào</td></tr>}
                </tbody>
            </Table>
        </div>
    );
};

export default OrderCheck;
