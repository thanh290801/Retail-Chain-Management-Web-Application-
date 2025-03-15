<<<<<<< HEAD
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
=======
import React, { useState, useEffect } from "react";
import { Modal, Button, Form, Table, Pagination, Row, Col } from "react-bootstrap";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import axios from "axios";

const API_BASE_URL = "http://localhost:5000/api/sale-invoice";

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
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
        startDate: null,
        endDate: null
    });

<<<<<<< HEAD
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
=======
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
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee

    // ✅ Phân trang
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentOrders = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

<<<<<<< HEAD
=======
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

>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
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
<<<<<<< HEAD
                        <Form.Group className="mb-2">
                            <Form.Label>Theo mã hóa đơn</Form.Label>
=======

                        <Form.Group className="mb-2">
                            <Form.Label>Mã hóa đơn</Form.Label>
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                            <Form.Control
                                type="text"
                                placeholder="Nhập mã hóa đơn..."
                                value={filters.orderId}
                                onChange={(e) => setFilters({ ...filters, orderId: e.target.value })}
                            />
                        </Form.Group>

<<<<<<< HEAD
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
=======
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
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                                value={filters.customer}
                                onChange={(e) => setFilters({ ...filters, customer: e.target.value })}
                            />
                        </Form.Group>

<<<<<<< HEAD
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
=======
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
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                    </Col>

                    {/* Cột phải: Danh sách hóa đơn */}
                    <Col md={8}>
                        <Table bordered hover responsive>
                            <thead className="bg-primary text-white">
                                <tr>
                                    <th>Mã hóa đơn</th>
                                    <th>Thời gian</th>
                                    <th>Nhân viên</th>
<<<<<<< HEAD
                                    <th>Khách hàng</th>
=======
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                                    <th>Tổng cộng</th>
                                    <th>Chọn</th>
                                </tr>
                            </thead>
                            <tbody>
<<<<<<< HEAD
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
=======
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
                                                variant="outline-success"
                                                size="sm"
                                                onClick={() => handleSelectOrder(order)}
                                            >
                                                Chọn
                                            </Button>
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
<<<<<<< HEAD
                                        <td colSpan="6" className="text-center">Không tìm thấy hóa đơn nào.</td>
=======
                                        <td colSpan="5" className="text-center text-danger">
                                            ❌ Không tìm thấy hóa đơn phù hợp.
                                        </td>
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                                    </tr>
                                )}
                            </tbody>
                        </Table>
<<<<<<< HEAD

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
=======
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
                    </Col>
                </Row>
            </Modal.Body>
            <Modal.Footer>
                <Button variant="secondary" onClick={onHide}>Đóng</Button>
            </Modal.Footer>
        </Modal>
    );
};

<<<<<<< HEAD

=======
>>>>>>> 8665fd44e5a530537541616e0cbb8e9215f0deee
export default ReturnInvoiceModal;
