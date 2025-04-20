import React, { useEffect, useState, forwardRef } from 'react';
import axios from 'axios';
import { Table, Form, Row, Col, Modal, Button } from 'react-bootstrap';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from "date-fns/locale/vi"; // 👈 Đưa lên cùng với import
import { format } from 'date-fns';

import useDebounce from './useDebounce';
import Header from '../headerComponent/header';

// ✅ Sau tất cả import, mới được gọi hàm
registerLocale("vi", vi);


const OrderList = () => {
    const [orders, setOrders] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [ordersPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);

    const [filters, setFilters] = useState({
        orderId: null,
        productName: null,
        employeeId: null,
        branchId: null,
        paymentMethod: null,
        fromDate: null,
        toDate: null
    });

    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    const debouncedOrderId = useDebounce(filters.orderId, 500);
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
    }, [currentPage, debouncedOrderId, debouncedProductName, filters.employeeId, filters.branchId, filters.paymentMethod, filters.fromDate, filters.toDate]);

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

    const groupByOrder = (data) => {
        const grouped = {};
        data.forEach(row => {
            if (!grouped[row.orderId]) {
                grouped[row.orderId] = {
                    orderId: row.orderId,
                    created_date: row.created_date,
                    employee_name: row.employee_name,
                    total_amount: row.total_amount,
                    warehouse: row.warehouse,
                    details: []
                };
            }

            if (row.product_id !== null) {
                grouped[row.orderId].details.push({
                    product_name: row.product_name,
                    quantity: row.quantity,
                    unit_price: row.unit_price,
                    total_price: row.total_price
                });
            }
        });

        return Object.values(grouped);
    };

    const fetchOrders = async () => {
        const body = {
            orderId: debouncedOrderId || null,        // ✅ đúng với DTO
            productName: debouncedProductName || null,
            employeeId: filters.employeeId || null,
            branchId: filters.branchId || null,
            paymentMethod: filters.paymentMethod || null,
            fromDate: filters.fromDate || null,
            toDate: filters.toDate || null,
            page: currentPage,
            limit: ordersPerPage
        };
        console.log(body)
        try {
            const res = await axios.post('https://localhost:5000/api/sale-invoice/listOrder', body);
            const { data, totalCount } = res.data;
            setOrders(groupByOrder(data));
            setTotalPages(Math.ceil(totalCount / ordersPerPage));
            console.log(groupByOrder(data))
        } catch (err) {
            console.error('Lỗi khi lấy đơn hàng:', err);
            setOrders([]);
        }
    };

    const handleFilterChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
        setCurrentPage(1);
    };

    const renderPagination = () => (
        <div className="d-flex justify-content-center mt-4 flex-wrap">
            <Button variant="secondary" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
                Trước
            </Button>
            {[...Array(totalPages).keys()].map(i => (
                <Button key={i + 1} variant={i + 1 === currentPage ? 'primary' : 'outline-secondary'} onClick={() => setCurrentPage(i + 1)} className="mx-1" size="sm">
                    {i + 1}
                </Button>
            ))}
            <Button variant="secondary" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
                Tiếp
            </Button>
        </div>
    );

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
                        <Form.Control placeholder="Mã đơn" value={filters.orderId ?? ''} onChange={e => handleFilterChange('orderId', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <Form.Control placeholder="Sản phẩm" value={filters.productName ?? ''} onChange={e => handleFilterChange('productName', e.target.value)} />
                    </Col>
                    <Col md={4}>
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => {
                                setDateRange(update);
                                handleFilterChange('fromDate', update[0] ? format(update[0], "yyyy-MM-dd'T'00:00:00") : null);
                                handleFilterChange('toDate', update[1] ? format(update[1], "yyyy-MM-dd'T'23:59:59") : null);
                            }}
                            isClearable
                            placeholderText="Chọn khoảng ngày"
                            className="form-control"
                            dateFormat="dd/MM/yyyy"
                            locale="vi"
                            customInput={<CustomDateInput />}
                        />
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
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {orders.map((order, idx) => (
                                <tr key={order.orderId}>
                                    <td>{order.orderId}</td>
                                    <td>{new Date(order.created_date).toLocaleString("vi-VN")}</td>
                                    <td>{order.employee_name}</td>
                                    <td>{order.total_amount.toLocaleString()} VND</td>
                                    <td>
                                        <Button size="sm" onClick={() => { setSelectedOrder(order); setShowModal(true); }}>
                                            Xem
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {totalPages > 1 && renderPagination()}

                <Modal show={showModal} onHide={() => setShowModal(false)} size="lg" centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.orderId}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedOrder && (
                            <>
                                <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.created_date).toLocaleString()}</p>
                                <p><strong>Chi nhánh:</strong> {selectedOrder.warehouse}</p>
                                <p><strong>Người bán:</strong> {selectedOrder.employee_name}</p>

                                <h5 className="mt-3">Sản phẩm:</h5>
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
                                        {selectedOrder.details.map((item, idx) => (
                                            <tr key={idx}>
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
