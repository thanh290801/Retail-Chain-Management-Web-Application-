import React, { useEffect, useState, forwardRef } from 'react';
import axios from 'axios';
import { Card, Table, Form, Row, Col, Modal, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from './useDebounce';
import Header from '../headerComponent/header';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);

    // filter state
    const [filters, setFilters] = useState({
        orderCode: '',
        productName: '',
        employeeId: '',
        branchId: '',
        paymentMethod: '',
        fromDate: null,
        toDate: null
    });

    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    // debounce
    const debouncedOrderCode = useDebounce(filters.orderCode, 500);
    const debouncedProductName = useDebounce(filters.productName, 500);

    // custom input for date picker
    const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
        <input
          type="text"
          className="form-control"
          onClick={onClick}
          ref={ref}
          value={value}
          readOnly
          placeholder="Chọn khoảng ngày"
          style={{
            width: '456.26px',
            minWidth: '300px',
            maxWidth: '100%'
          }}
        />
      ));      

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [debouncedOrderCode, debouncedProductName, filters.employeeId, filters.branchId, filters.paymentMethod, filters.fromDate, filters.toDate, currentPage]);

    const fetchBranches = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Warehouses/GetWarehouses');
            setBranches(res.data);
        } catch (error) {
            console.error('Lỗi khi lấy chi nhánh:', error);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Staff/getStaff');
            setEmployees(res.data);
        } catch (error) {
            console.error('Lỗi khi lấy nhân viên:', error);
        }
    };

    const fetchOrders = async () => {
        try {
            const body = {
                orderCode: debouncedOrderCode || null,
                productName: debouncedProductName || null,
                employeeName: filters.employeeId || null,
                branchId: filters.branchId || null,
                paymentMethod: filters.paymentMethod || null,
                fromDate: filters.fromDate || null,
                toDate: filters.toDate || null,
                page: currentPage,
                limit: ordersPerPage
            };

            const res = await axios.post('https://localhost:5000/api/sale-invoice/listOrder', body);
            setOrders(groupByOrder(res.data));
        } catch (error) {
            console.error('Lỗi khi lấy danh sách đơn hàng:', error);
        }
    };

    const groupByOrder = (data) => {
        const grouped = {};
        data.forEach(row => {
            if (!grouped[row.orderId]) {
                grouped[row.orderId] = {
                    ...row,
                    details: [],
                    refund: row.refund_id ? {
                        refundId: row.refund_id,
                        refundDate: row.refund_date,
                        refundProductId: row.refund_product_id,
                        refundQuantity: row.refund_quantity,
                        refundTotalPrice: row.refund_total_price
                    } : null
                };
            }
            grouped[row.orderId].details.push({
                productId: row.product_id,
                product_name: row.product_name || 'Không có tên sản phẩm',
                quantity: row.quantity || 0,
                unitPrice: row.unit_price || 0,
                totalPrice: row.total_price || 0
            });
        });
        return Object.values(grouped);
    };

    const totalPages = Math.ceil(orders.length / ordersPerPage);
    const indexOfLastOrder = currentPage * ordersPerPage;
    const indexOfFirstOrder = indexOfLastOrder - ordersPerPage;
    const currentOrders = orders.slice(indexOfFirstOrder, indexOfLastOrder);

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <Button
                    key={i}
                    variant={i === currentPage ? 'primary' : 'outline-secondary'}
                    onClick={() => setCurrentPage(i)}
                    className="mx-1"
                    size="sm"
                >
                    {i}
                </Button>
            );
        }
        return pages;
    };

    const handleFilterChange = (key, value) => {
        setCurrentPage(1);
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    useEffect(() => {
        handleFilterChange('fromDate', startDate ? startDate.toISOString() : null);
        handleFilterChange('toDate', endDate ? endDate.toISOString() : null);
    }, [startDate, endDate]);

    return (
        <div>
            <Header />
            <div className="bg-white p-3 rounded-lg shadow-sm mt-4 mx-5">
                <h4 className="mb-3">📋 Hóa đơn bán lẻ</h4>

                <Row className="mb-3 g-2">
                <Col md={4}>
                        <Form.Select
                            value={filters.branchId}
                            onChange={(e) => handleFilterChange('branchId', e.target.value)}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => (
                                <option key={branch.branchId} value={branch.branchId}>
                                    {branch.name}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Select
                            value={filters.employeeId}
                            onChange={(e) => handleFilterChange('employeeId', e.target.value)}
                        >
                            <option value="">Tất cả nhân viên</option>
                            {employees.map(emp => (
                                <option key={emp.employeeId} value={emp.fullName}>
                                    {emp.fullName}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    
                    <Col md={4}>
                        <Form.Select
                            value={filters.paymentMethod}
                            onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
                        >
                            <option value="">Tất cả phương thức</option>
                            <option value="cash">Tiền mặt</option>
                            <option value="transfer">Chuyển khoản</option>
                        </Form.Select>
                    </Col>
                </Row>

                <Row className="mb-3 g-2">
                    <Col md={4}>
                        <Form.Control
                            placeholder="Sản phẩm"
                            value={filters.productName}
                            onChange={(e) => handleFilterChange('productName', e.target.value)}
                        />
                    </Col>
                    <Col md={4}>
                        <Form.Control
                            placeholder="Mã đơn"
                            value={filters.orderCode}
                            onChange={(e) => handleFilterChange('orderCode', e.target.value)}
                        />
                    </Col>
                    <Col md={4}>
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            isClearable
                            dateFormat="yyyy-MM-dd"
                            customInput={<CustomDateInput />}
                        />
                    </Col>
                </Row>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Ngày tạo</th>
                                <th>Nhân viên</th>
                                <th>Tổng tiền</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentOrders.map((order, idx) => (
                                <tr key={order.orderId}>
                                    <td>{indexOfFirstOrder + idx + 1}</td>
                                    <td>{new Date(order.created_date).toLocaleString("vi-VN")}</td>
                                    <td>{order.employee_name}</td>
                                    <td>{order.total_amount.toLocaleString()} VND</td>
                                    <td>
                                        <Button variant="info" size="sm" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                                            Xem
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                <div className="d-flex justify-content-center mt-4 flex-wrap">
                    <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                        Trước
                    </Button>
                    {renderPageNumbers()}
                    <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                        Tiếp
                    </Button>
                </div>

                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Hóa đơn số {selectedOrder?.orderId}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedOrder && (
                            <>
                                <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.created_date).toLocaleString()}</p>
                                <p><strong>Chi nhánh:</strong> {selectedOrder.warehouse}</p>
                                <p><strong>Người bán:</strong> {selectedOrder.employee_name}</p>
                                <h5 className="mt-4">Sản phẩm:</h5>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Số lượng</th>
                                            <th>Đơn giá</th>
                                            <th>Tổng</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedOrder.details.map((item) => (
                                            <tr key={item.product_id}>
                                                <td>{item.product_name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.unitPrice.toLocaleString()} VND</td>
                                                <td>{item.totalPrice.toLocaleString()} VND</td>
                                            </tr>
                                        ))}
                                        <tr>
                                            <td colSpan={3}><strong>Thành tiền</strong></td>
                                            <td><strong>{selectedOrder.total_amount.toLocaleString()} VND</strong></td>
                                        </tr>
                                    </tbody>
                                </Table>
                            </>
                        )}
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                    </Modal.Footer>
                </Modal>
            </div>
        </div>
    );
};

export default OrderList;
