import React, { useState } from "react";
import { Modal, Button, Form, Table, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const api_url = process.env.REACT_APP_API_URL
const API_BASE_URL = `${api_url}/sale-invoice`;

const ReturnInvoiceModal = ({ show, onHide, handleCreateReturnInvoice }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [loading, setLoading] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState([]);

    const token = localStorage.getItem("token");

    // ✅ State bộ lọc tìm kiếm
    const [filters, setFilters] = useState({
        orderId: "",
        employeeId: "",
        customer: "",
        productId: "",
        productName: "",
        barcode: "",
        startDate: null,
        endDate: null
    });

    // ✅ Chuyển đổi ngày sang định dạng API
    const formatDateToYYYYMMDD = (date) => {
        if (!date) return null;
        return date.split("/").reverse().join("-");
    };

    // ✅ Định dạng ngày/tháng/năm giờ:phút:giây khi hiển thị
    const formatDateTime = (dateString) => {
        if (!dateString) return "N/A";
        const date = new Date(dateString);
        return new Intl.DateTimeFormat("vi-VN", {
            day: "2-digit", month: "2-digit", year: "numeric",
            hour: "2-digit", minute: "2-digit", second: "2-digit"
        }).format(date);
    };

    // ✅ Gọi API khi nhấn Enter hoặc click "Tìm kiếm"
    const handleSearch = () => {
        setLoading(true);
        setCurrentPage(1);

        axios.post(`${API_BASE_URL}/order/search`, {
            OrderId: filters.orderId ? parseInt(filters.orderId) : null,
            EmployeeId: filters.employeeId ? parseInt(filters.employeeId) : null,
            StartDate: formatDateToYYYYMMDD(filters.startDate),
            EndDate: formatDateToYYYYMMDD(filters.endDate),
            Barcode: filters.barcode || null,
            ProductName: filters.productName || null
        },
<<<<<<< HEAD
        {
=======
            {
>>>>>>> origin/thanh
                headers: {
                    "Content-Type": "application/json",  // ✅ Định dạng JSON
                    "Authorization": `Bearer ${token}`, // ✅ Thêm token nếu có
                }
            })
            .then(response => {
                setFilteredOrders(response.data || []);
            })
            .catch(error => {
                console.error("❌ Lỗi khi tìm kiếm hóa đơn:", error);
                setFilteredOrders([]);
            })
            .finally(() => setLoading(false));
    };

    // ✅ Lắng nghe phím Enter
    const handleKeyDown = (event) => {
        if (event.key === "Enter") {
            event.preventDefault();
            handleSearch();
        }
    };

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    // ✅ Chọn hóa đơn
    const handleSelectOrder = async (order) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/orderdetails/search`, {
                orderId: order.orderId
            }, {
                headers: {
                    "Content-Type": "application/json",  // ✅ Định dạng JSON
                    "Authorization": `Bearer ${token}`, // ✅ Thêm token nếu có
                }
            }
            );
            if (response.data) {
                handleCreateReturnInvoice(order, response.data); // ✅ Gửi orderId về Main.js
            }
        } catch (error) {
            console.error("❌ Lỗi khi lấy chi tiết hóa đơn:", error);
        }

        onHide(); // ✅ Đóng modal sau khi chọn
    };

    return (
        <Modal show={show} onHide={onHide} centered size="xl">
            <Modal.Header closeButton>
                <Modal.Title>Chọn hóa đơn trả hàng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    {/* Cột trái: Bộ lọc tìm kiếm */}
                    <Col md={4} className="border-end">
                        <h5 className="mb-3">Tìm kiếm</h5>

                        {["orderId", "employeeId", "customer", "barcode", "productName"].map((field, index) => (
                            <Form.Group className="mb-2" key={index}>
                                <Form.Label>{{
                                    orderId: "Mã hóa đơn",
                                    employeeId: "Nhân viên",
                                    customer: "Khách hàng",
                                    barcode: "Mã vạch sản phẩm",
                                    productName: "Tên sản phẩm"
                                }[field]}</Form.Label>
                                <Form.Control
                                    type="text"
                                    placeholder={`Nhập ${{
                                        orderId: "mã hóa đơn...",
                                        employeeId: "ID nhân viên...",
                                        customer: "tên khách hàng...",
                                        barcode: "barcode...",
                                        productName: "tên sản phẩm..."
                                    }[field]}`}
                                    value={filters[field]}
                                    onChange={(e) => setFilters({ ...filters, [field]: e.target.value })}
                                    onKeyDown={handleKeyDown}
                                />
                            </Form.Group>
                        ))}

                        {/* Bộ lọc thời gian */}
                        {/* Bộ lọc thời gian */}
                        <h5 className="mt-3">Thời gian</h5>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Từ ngày</Form.Label>
                                    <DatePicker
                                        selected={filters.startDate ? new Date(filters.startDate.split("/").reverse().join("-")) : null}
                                        onChange={(date) => setFilters({ ...filters, startDate: date.toLocaleDateString("en-GB") })}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày"
                                        maxDate={new Date()}
                                        onKeyDown={handleKeyDown}
                                    />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-2">
                                    <Form.Label>Đến ngày</Form.Label>
                                    <DatePicker
                                        selected={filters.endDate ? new Date(filters.endDate.split("/").reverse().join("-")) : null}
                                        onChange={(date) => setFilters({ ...filters, endDate: date.toLocaleDateString("en-GB") })}
                                        dateFormat="dd/MM/yyyy"
                                        className="form-control"
                                        placeholderText="Chọn ngày"
                                        maxDate={new Date()}
                                        onKeyDown={handleKeyDown}
                                    />
                                </Form.Group>
                            </Col>
                        </Row>

                        {/* Nút tìm kiếm */}
                        <Button variant="primary" className="mt-3 w-100" onClick={handleSearch}>
                            🔍 Tìm kiếm
                        </Button>
                    </Col>

                    {/* Cột phải: Danh sách hóa đơn */}
                    <Col md={8}>
                        <Table bordered hover responsive>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Mã hóa đơn</th>
                                    <th>Thời gian</th>
                                    <th>Nhân viên</th>
                                    <th>Tổng cộng</th>
                                    <th>Chọn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan="5" className="text-center">
                                            <span className="spinner-border spinner-border-sm"></span> Đang tải...
                                        </td>
                                    </tr>
                                ) : currentOrders.length > 0 ? (
                                    currentOrders.map(order => (
                                        <tr key={order.orderId}>
                                            <td>{order.orderId}</td>
                                            <td>{formatDateTime(order.orderDate)}</td>
                                            <td>{order.employeeName}</td>
                                            <td>{order.totalAmount?.toLocaleString() || "0"} VND</td>
                                            <td>
                                                <Button variant="outline-success" size="sm" onClick={() => handleSelectOrder(order)}>Chọn</Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="5" className="text-center text-danger">
                                            ❌ Không tìm thấy hóa đơn phù hợp.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default ReturnInvoiceModal;