import React, { useEffect, useState, forwardRef } from 'react';
import axios from 'axios';
import { Table, Form, Row, Col, Button, Modal } from 'react-bootstrap';
import DatePicker, { registerLocale } from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import vi from "date-fns/locale/vi"; // 👈 Đưa lên cùng với import
import { format } from 'date-fns';
import Header from '../headerComponent/header';
registerLocale("vi", vi);

const RefundList = () => {
    const [refunds, setRefunds] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [selectedRefund, setSelectedRefund] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const [filters, setFilters] = useState({
        orderId: null,
        productName: null,
        employeeName: null,
        branchId: null,
        fromDate: null,
        toDate: null,
        page: 1,
        limit: 10
    });

    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    const CustomDateInput = forwardRef(({ value, onClick }, ref) => (
        <input
            type="text"
            className="form-control"
            onClick={onClick}
            ref={ref}
            value={value}
            readOnly
            placeholder="Chọn khoảng ngày"
            style={{ width: '336.26px', minWidth: '300px', maxWidth: '100%' }}
        />
    ));

    const fetchBranches = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Warehouses/GetWarehouses');
            setBranches(res.data);
        } catch (err) {
            console.error('Lỗi khi lấy chi nhánh:', err);
        }
    };

    const fetchEmployees = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Staff/getStaff');
            setEmployees(res.data);
        } catch (err) {
            console.error('Lỗi khi lấy nhân viên:', err);
        }
    };

    const groupByRefund = (data) => {
        const grouped = {};

        data.forEach(row => {
            if (!grouped[row.refund_id]) {
                grouped[row.refund_id] = {
                    refund_id: row.refund_id,
                    refund_date: row.refund_date,
                    order_id: row.order_id,
                    warehouse: row.warehouse,
                    employee_name: row.employee_name,
                    details: []
                };
            }

            grouped[row.refund_id].details.push({
                productId: row.product_id,
                productName: row.product_name,
                quantity: row.quantity,
                totalPrice: row.total_price
            });
        });

        return Object.values(grouped);
    };

    const [totalPages, setTotalPages] = useState(1);

    const fetchRefunds = async () => {
        try {
            const res = await axios.post('https://localhost:5000/api/sale-invoice/listRefund', {
                orderId: filters.orderId || null,
                productName: filters.productName || null,
                employeeName: filters.employeeName || null,
                branchId: filters.branchId || null,
                fromDate: startDate ? format(startDate, "yyyy-MM-dd'T'00:00:00") : null,
                toDate: endDate ? format(endDate, "yyyy-MM-dd'T'23:59:59") : null,
                page: filters.page,
                limit: filters.limit
            });
            setRefunds(groupByRefund(res.data));
            setTotalPages(Math.ceil(res.data.length / filters.limit));
        } catch (err) {
            console.error('Lỗi khi lấy danh sách hoàn tiền:', err);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRefunds();
    }, [filters]);

    const handleInputChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value === '' ? null : value, page: 1 }));
    };

    const handlePageChange = (newPage) => {
        setFilters(prev => ({ ...prev, page: newPage }));
    };

    const renderPagination = () => (
        <div className="d-flex justify-content-center mt-3">
            <Button variant="secondary" onClick={() => handlePageChange(filters.page - 1)} disabled={filters.page <= 1}>Trước</Button>
            <span className="mx-3 mt-1">Trang {filters.page}</span>
            <Button variant="secondary" onClick={() => handlePageChange(filters.page + 1)} disabled={refunds.length < filters.limit}>Tiếp</Button>
        </div>
    );

    return (
        <div>
            <Header />
            <div className="p-3 mt-4 mx-5 shadow-sm">
                <h4 className="mb-3">🔁 Danh sách hoàn tiền</h4>
                <Row className="mb-3 g-2">
                    <Col md={2}>
                        <Form.Control
                            placeholder="Mã đơn hàng"
                            value={filters.orderId ?? ''}
                            onChange={(e) => handleInputChange('orderId', e.target.value)}
                        />
                    </Col>
                    <Col md={3}>
                        <Form.Control
                            placeholder="Sản phẩm"
                            value={filters.productName ?? ''}
                            onChange={(e) => handleInputChange('productName', e.target.value)}
                        />
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={filters.employeeName ?? ''}
                            onChange={(e) => handleInputChange('employeeName', e.target.value)}
                        >
                            <option value="">Tất cả nhân viên</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.fullName}>{emp.fullName}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={filters.branchId ?? ''}
                            onChange={(e) => handleInputChange('branchId', parseInt(e.target.value) || null)}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => (
                                <option key={branch.warehousesId} value={branch.warehousesId}>{branch.name}</option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <DatePicker
                            selectsRange
                            startDate={startDate}
                            endDate={endDate}
                            onChange={(update) => setDateRange(update)}
                            onCalendarClose={() => {
                                handleInputChange('fromDate', startDate ? format(startDate, "yyyy-MM-dd'T'00:00:00") : null);
                                handleInputChange('toDate', endDate ? format(endDate, "yyyy-MM-dd'T'23:59:59") : null);
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
                                <th>#</th>
                                <th>Ngày hoàn</th>
                                <th>Mã đơn</th>
                                <th>Chi nhánh</th>
                                <th>Nhân viên</th>
                                <th>Thành tiền</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map((refund, idx) => (
                                <tr key={refund.refund_id}>
                                    <td>{(filters.page - 1) * filters.limit + idx + 1}</td>
                                    <td>{new Date(refund.refund_date).toLocaleString()}</td>
                                    <td>{refund.order_id}</td>
                                    <td>{refund.warehouse}</td>
                                    <td>{refund.employee_name}</td>
                                    <td>
                                        {refund.details.reduce((sum, d) => sum + d.totalPrice, 0).toLocaleString()} VND
                                    </td>
                                    <td>
                                        <Button size="sm" onClick={() => { setSelectedRefund(refund); setShowModal(true); }}>
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
                        <Modal.Title>Chi tiết hoàn tiền #{selectedRefund?.refund_id}</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {selectedRefund && (
                            <>
                                <p><strong>Ngày hoàn:</strong> {new Date(selectedRefund.refund_date).toLocaleString()}</p>
                                <p><strong>Mã đơn:</strong> {selectedRefund.order_id}</p>
                                <p><strong>Chi nhánh:</strong> {selectedRefund.warehouse}</p>
                                <p><strong>Nhân viên:</strong> {selectedRefund.employee_name}</p>

                                <h5 className="mt-3">Sản phẩm hoàn:</h5>
                                <Table striped bordered>
                                    <thead>
                                        <tr>
                                            <th>Sản phẩm</th>
                                            <th>Số lượng</th>
                                            <th>Thành tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {selectedRefund.details.map((item, idx) => (
                                            <tr key={idx}>
                                                <td>{item.productName}</td>
                                                <td>{item.quantity}</td>
                                                <td>{item.totalPrice.toLocaleString()} VND</td>
                                            </tr>
                                        ))}
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

export default RefundList;