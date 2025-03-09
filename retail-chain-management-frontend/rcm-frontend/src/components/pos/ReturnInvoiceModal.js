import React, { useState } from "react";
import { Modal, Button, Form, Table, Pagination, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

const ReturnInvoiceModal = ({ show, onHide, orders, handleCreateReturnInvoice }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 5;

    const [filters, setFilters] = useState({
        orderId: "",
        shipmentId: "",
        customer: "",
        productId: "",
        productName: "",
        startDate: null,
        endDate: null
    });

    const parseDate = (dateString) => {
        if (!dateString) return null;
        const [day, month, year] = dateString.split(" ")[0].split("/").map(Number);
        return new Date(year, month - 1, day).setHours(0, 0, 0, 0); // Chỉ lấy ngày, bỏ giờ phút
    };

    const isDateInRange = (orderDate, startDate, endDate) => {
        const orderTime = parseDate(orderDate);
        const startTime = startDate ? parseDate(startDate) : null;
        const endTime = endDate ? parseDate(endDate) : null;
    
        return (!startTime || orderTime >= startTime) && (!endTime || orderTime <= endTime);
    };    

    const formatDateToDDMMYYYY = (dateString) => {
        if (!dateString) return "";
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, "0");
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Tháng tính từ 0
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };    

    // ✅ Hàm lọc danh sách hóa đơn
    const filteredOrders = orders.filter(order => {
        const orderDate = new Date(order.date);
        const today = new Date();

        return (
            (filters.orderId ? order.id.toLowerCase().includes(filters.orderId.toLowerCase()) : true) &&
            (filters.shipmentId ? order.shipmentId?.toLowerCase().includes(filters.shipmentId.toLowerCase()) : true) &&
            (filters.customer ? order.customer.toLowerCase().includes(filters.customer.toLowerCase()) : true) &&
            (filters.productId ? order.products.some(p => p.id.toLowerCase().includes(filters.productId.toLowerCase())) : true) &&
            (filters.productName ? order.products.some(p => p.name.toLowerCase().includes(filters.productName.toLowerCase())) : true) &&
            (filters.orderId ? order.id.toLowerCase().includes(filters.orderId.toLowerCase()) : true) &&
            (filters.startDate || filters.endDate ? isDateInRange(order.date, filters.startDate, filters.endDate) : true)
        );
    });

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

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
                            <Form.Label>Theo mã hóa đơn</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập mã hóa đơn..."
                                value={filters.orderId}
                                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                            />
                        </Form.Group>

                        {/* <Form.Group className="mb-2">
                            <Form.Label>Theo mã vận đơn</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập mã vận đơn..."
                                value={filters.shipmentId}
                                onChange={(e) => setFilters({ ...filters, shipmentId: e.target.value })}
                            />
                        </Form.Group> */}

                        <Form.Group className="mb-2">
                            <Form.Label>Theo khách hàng</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Nhập tên khách hàng"
                                value={filters.customer}
                                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                            />
                        </Form.Group>

                        {/* Bộ lọc thời gian */}
                        <h5 className="mt-3">Thời gian</h5>
                        <Form.Group className="mb-2">
                        <Form.Label>Từ ngày</Form.Label>
                        <DatePicker
                            selected={filters.startDate ? new Date(filters.startDate.split("/").reverse().join("-")) : null}
                            onChange={(date) => {
                                const formattedDate = formatDateToDDMMYYYY(date);
                                setFilters(prev => ({
                                    ...prev,
                                    startDate: formattedDate,
                                    endDate: prev.endDate && new Date(formattedDate.split("/").reverse().join("-")) > new Date(prev.endDate.split("/").reverse().join("-")) ? "" : prev.endDate
                                }));
                            }}
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            placeholderText="Chọn ngày"
                            maxDate={new Date()} // Không thể chọn ngày trong tương lai
                        />
                    </Form.Group>

                    <Form.Group className="mb-2">
                        <Form.Label>Đến ngày</Form.Label>
                        <DatePicker
                            selected={filters.endDate ? new Date(filters.endDate.split("/").reverse().join("-")) : null}
                            onChange={(date) => {
                                const formattedDate = formatDateToDDMMYYYY(date);
                                if (filters.startDate && new Date(formattedDate.split("/").reverse().join("-")) < new Date(filters.startDate.split("/").reverse().join("-"))) {
                                    alert("Ngày kết thúc không thể nhỏ hơn ngày bắt đầu!");
                                } else {
                                    setFilters(prev => ({
                                        ...prev,
                                        endDate: formattedDate
                                    }));
                                }
                            }}
                            dateFormat="dd/MM/yyyy"
                            className="form-control"
                            placeholderText="Chọn ngày"
                            minDate={filters.startDate ? new Date(filters.startDate.split("/").reverse().join("-")) : null} // Không thể chọn ngày nhỏ hơn startDate
                            maxDate={new Date()} // Không thể chọn ngày trong tương lai
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
                                    <th>Khách hàng</th>
                                    <th>Tổng cộng</th>
                                    <th>Chọn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentOrders.length > 0 ? (
                                    currentOrders.map(order => (
                                        <tr key={order.id}>
                                            <td>{order.id}</td>
                                            <td>{order.date}</td>
                                            <td>{order.staff}</td>
                                            <td>{order.customer}</td>
                                            <td>{order.total.toLocaleString()} VND</td>
                                            <td>
                                                <Button variant="outline-success" size="sm" onClick={() => {
                                                    handleCreateReturnInvoice(order);
                                                    onHide(); // Đóng modal sau khi chọn
                                                }}>Chọn</Button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="6" className="text-center">Không tìm thấy hóa đơn nào.</td>
                                    </tr>
                                )}
                            </tbody>
                        </Table>

                        {/* Phân trang */}
                        <Pagination className="justify-content-center">
                            <Pagination.Prev
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            />
                            {[...Array(totalPages)].map((_, index) => (
                                <Pagination.Item
                                    key={index + 1}
                                    active={index + 1 === currentPage}
                                    onClick={() => setCurrentPage(index + 1)}
                                >
                                    {index + 1}
                                </Pagination.Item>
                            ))}
                            <Pagination.Next
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            />
                        </Pagination>
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
