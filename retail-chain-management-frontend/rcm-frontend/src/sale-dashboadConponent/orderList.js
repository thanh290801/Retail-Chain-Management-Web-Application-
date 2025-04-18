import React, { useEffect, useState, forwardRef } from 'react';
import axios from 'axios';
import { Table, Form, Row, Col, Modal, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from './useDebounce';
import Header from '../headerComponent/header';

const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [selectedOrderDetails, setSelectedOrderDetails] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        orderCode: null,
        productName: null,
        employeeId: null,
        branchId: null,
        paymentMethod: null,
        fromDate: null,
        toDate: null
    });

    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    const debouncedOrderCode = useDebounce(filters.orderCode, 500);
    const debouncedProductName = useDebounce(filters.productName, 500);

    const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
        <input
            type="text"
            className="form-control"
            onClick={onClick}
            ref={ref}
            value={value}
            readOnly
            placeholder="Chọn khoảng ngày"
            style={{ width: '456.26px', minWidth: '300px', maxWidth: '100%' }}
        />
    ));

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchOrders();
    }, [
        currentPage,
        debouncedOrderCode,
        debouncedProductName,
        filters.employeeId,
        filters.branchId,
        filters.paymentMethod,
        filters.fromDate,
        filters.toDate
    ]);

    useEffect(() => {
        fetchOrders();
    }, [currentPage]);

    useEffect(() => {
        handleFilterChange('fromDate', startDate ? startDate.toISOString() : null);
        handleFilterChange('toDate', endDate ? endDate.toISOString() : null);
    }, [startDate, endDate]);

    const fetchBranches = async () => {
        const res = await axios.get('https://localhost:5000/api/Warehouses/GetWarehouses');
        setBranches(res.data);
    };

    const fetchEmployees = async () => {
        const res = await axios.get('https://localhost:5000/api/Staff/getStaff');
        setEmployees(res.data);
    };

    const fetchOrders = async () => {
        const body = {
            orderCode: debouncedOrderCode || null,
            productName: debouncedProductName || null,
            employeeId: filters.employeeId || null,
            branchId: filters.branchId || null,
            paymentMethod: filters.paymentMethod || null,
            fromDate: filters.fromDate || null,
            toDate: filters.toDate || null,
            page: currentPage,
            limit: ordersPerPage
        };

        try {
            const res = await axios.post('https://localhost:5000/api/sale-invoice/listOrder', body);
            const { data, totalCount } = res.data;
            setOrders(data);
            setTotalPages(Math.ceil(totalCount / ordersPerPage));
            console.log("📤 Body gửi API:", body);
        } catch (err) {
            console.error('Lỗi khi lấy đơn hàng:', err);
            setOrders([]);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value }));
    };

    const handleViewOrder = (orderId) => {
        const mainOrder = orders.find(o => o.orderId === orderId);
        const details = orders.filter(o => o.orderId === orderId && o.product_id !== null);
        setSelectedOrder(mainOrder);
        setSelectedOrderDetails(details);
        setShowModal(true);
    };

    const renderPageNumbers = () => {
        const pages = [];
        for (let i = 1; i <= totalPages; i++) {
            pages.push(
                <Button key={i} variant={i === currentPage ? 'primary' : 'outline-secondary'} onClick={() => setCurrentPage(i)} className="mx-1" size="sm">
                    {i}
                </Button>
            );
        }
        return pages;
    };

    const uniqueOrders = [...new Map(orders.map(o => [o.orderId, o])).values()];

    return (
        <div>
            <Header />
            <div className="bg-white p-3 rounded-lg shadow-sm mt-4 mx-5">
                <h4 className="mb-3">📋 Hóa đơn bán lẻ</h4>

                <Row className="mb-3 g-2">
                    <Col md={4}>
                        <Form.Select
                            value={filters.branchId ?? ''}
                            onChange={(e) => handleFilterChange('branchId', e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => (
                                <option key={branch.warehousesId} value={branch.warehousesId}>{branch.name}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Select
                            value={filters.employeeId ?? ''}
                            onChange={(e) => handleFilterChange('employeeId', e.target.value ? parseInt(e.target.value) : null)}
                        >
                            <option value="">Tất cả nhân viên</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>{emp.fullName}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={4}>
                        <Form.Select value={filters.paymentMethod ?? ''} onChange={e => handleFilterChange('paymentMethod', e.target.value)}>
                            <option value="">Tất cả phương thức</option>
                            <option value="cash">Tiền mặt</option>
                            <option value="transfer">Chuyển khoản</option>
                        </Form.Select>
                    </Col>
                </Row>

                <Row className="mb-3 g-2">
                    <Col md={4}>
                        <Form.Control placeholder="Sản phẩm" value={filters.productName ?? ''} onChange={e => handleFilterChange('productName', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <Form.Control placeholder="Mã đơn" value={filters.orderCode ?? ''} onChange={e => handleFilterChange('orderCode', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <DatePicker selectsRange startDate={startDate} endDate={endDate} onChange={update => setDateRange(update)} isClearable dateFormat="yyyy-MM-dd" customInput={<CustomDateInput />} />
                    </Col>
                </Row>

                <div style={{ maxHeight: '500px', overflowY: 'auto' }}>
                    <Table striped bordered hover responsive>
                        <thead>
                            <tr>
                                <th>Mã</th>
                                <th>Ngày tạo</th>
                                <th>Nhân viên</th>
                                <th>Tổng tiền</th>
                                <th>Chi tiết</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueOrders.map(order => (
                                <tr key={order.orderId}>
                                    <td>{order.orderId}</td>
                                    <td>{new Date(order.created_date).toLocaleString("vi-VN")}</td>
                                    <td>{order.employee_name}</td>
                                    <td>{order.total_amount.toLocaleString()} VND</td>
                                    <td>
                                        <Button variant="info" size="sm" onClick={() => handleViewOrder(order.orderId)}>Xem</Button>
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
                                        {selectedOrderDetails.map((item, idx) => (
                                            <tr key={`${item.product_id}-${idx}`}>
                                                <td>{item.product_name}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.unit_price.toLocaleString()} VND</td>
                                                <td>{item.total_price.toLocaleString()} VND</td>
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
