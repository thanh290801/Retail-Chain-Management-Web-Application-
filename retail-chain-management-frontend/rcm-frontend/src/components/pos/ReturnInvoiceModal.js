import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Pagination, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const API_BASE_URL = "https://localhost:5000/api/sale-invoice";

const ReturnInvoiceModal = ({ show, onHide, handleCreateReturnInvoice }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;
    const [loading, setLoading] = useState(false);
    const [filteredOrders, setFilteredOrders] = useState([]);

    // ✅ State lưu bộ lọc tìm kiếm
    const [filters, setFilters] = useState({
        orderId: "",
        employeeId: "", // ✅ Thêm employeeId vào filters
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

    // ✅ Gọi API lấy danh sách hóa đơn khi mở modal hoặc bộ lọc thay đổi
    useEffect(() => {
        if (!show) return;

        setLoading(true);
        setCurrentPage(1); // ✅ Reset về trang đầu khi thay đổi filters

        axios.post(`${API_BASE_URL}/order/search`, {
            OrderId: filters.orderId ? parseInt(filters.orderId) : null,
            EmployeeId: filters.employeeId ? parseInt(filters.employeeId) : null,
            StartDate: formatDateToYYYYMMDD(filters.startDate),
            EndDate: formatDateToYYYYMMDD(filters.endDate),
            WarehouseId: 1,
            Barcode: filters.barcode || null,
            ProductName: filters.productName || null
        })
            .then(response => {
                setFilteredOrders(response.data || []);
                console.log("✅ API trả về:", response.data); // ✅ Log kiểm tra dữ liệu từ API
            })
            .catch(error => {
                console.error("❌ Lỗi khi tìm kiếm hóa đơn:", error);
                setFilteredOrders([]);
            })
            .finally(() => setLoading(false));
    }, [filters, show]);

    // ✅ Cập nhật khi danh sách đơn hàng thay đổi
    useEffect(() => {
        setCurrentPage(1); // ✅ Reset trang về 1 khi có dữ liệu mới
    }, [filteredOrders]);

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

    //Chọn order
    const handleSelectOrder = async (order) => {
        try {
            const response = await axios.post(`${API_BASE_URL}/orderdetails/search`, {
                orderId: order.orderId // ✅ Gửi `orderId` vào body
            });

            if (response.data) {
                handleCreateReturnInvoice(order, response.data); // ✅ Tạo phiếu trả hàng với dữ liệu từ API
            }
        } catch (error) {
            console.error("❌ Lỗi khi lấy chi tiết hóa đơn:", error);
        }

        onHide(); // ✅ Đóng modal sau khi chọn
    };

    return (
        <Modal show={show} onHide={onHide} centered size="lg">
            <Modal.Header closeButton>
                <Modal.Title>Chọn hóa đơn trả hàng</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                <Row>
                    {/* Cột trái: Bộ lọc tìm kiếm */}
                    <Col md={4} className="border-end">
                        <h5 className="mb-3">Tìm kiếm</h5>

                        <Form.Group className="mb-2">
                            <Form.Label>Mã hóa đơn</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập mã hóa đơn..."
                                value={filters.orderId}
                                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Nhân viên</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập ID nhân viên..."
                                value={filters.employeeId}
                                onChange={(e) => setFilters({ ...filters, employeeId: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Khách hàng</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên khách hàng..."
                                value={filters.customer}
                                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Mã vạch sản phẩm</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập barcode..."
                                value={filters.barcode}
                                onChange={(e) => setFilters({ ...filters, barcode: e.target.value })}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Tên sản phẩm</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên sản phẩm..."
                                value={filters.productName}
                                onChange={(e) => setFilters({ ...filters, productName: e.target.value })}
                            />
                        </Form.Group>

                        {/* Bộ lọc thời gian */}
                        <h5 className="mt-3">Thời gian</h5>
                        <Form.Group className="mb-2">
                            <Form.Label>Từ ngày</Form.Label>
                            <DatePicker
                                selected={filters.startDate ? new Date(filters.startDate.split("/").reverse().join("-")) : null}
                                onChange={(date) => setFilters({ ...filters, startDate: date.toLocaleDateString("en-GB") })}
                                dateFormat="dd/MM/yyyy"
                                className="form-control"
                                placeholderText="Chọn ngày"
                                maxDate={new Date()}
                            />
                        </Form.Group>

                        <Form.Group className="mb-2">
                            <Form.Label>Đến ngày</Form.Label>
                            <DatePicker
                                selected={filters.endDate ? new Date(filters.endDate.split("/").reverse().join("-")) : null}
                                onChange={(date) => setFilters({ ...filters, endDate: date.toLocaleDateString("en-GB") })}
                                dateFormat="dd/MM/yyyy"
                                className="form-control"
                                placeholderText="Chọn ngày"
                                maxDate={new Date()}
                            />
                        </Form.Group>
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
                                            <td>{order.orderDate}</td>
                                            <td>{order.employeeName}</td>
                                            <td>{order.totalAmount ? order.totalAmount.toLocaleString() : "0"} VND</td>
                                            <Button
                                                variant="success"
                                                size="sm"
                                                onClick={() => handleSelectOrder(order)}
                                            >
                                                Chọn
                                            </Button>
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
