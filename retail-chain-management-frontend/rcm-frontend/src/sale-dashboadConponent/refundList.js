import React, { useEffect, useState, forwardRef } from 'react';
import axios from 'axios';
import { Table, Form, Row, Col, Card, Button } from 'react-bootstrap';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import Header from '../headerComponent/header';

const RefundList = () => {
    const [refunds, setRefunds] = useState([]);
    const [branches, setBranches] = useState([]);
    const [employees, setEmployees] = useState([]);

    const [filters, setFilters] = useState({
        orderId: '',
        productName: '',
        employeeId: '',
        branchId: '',
        fromDate: null,
        toDate: null,
        page: 1,
        limit: 10
    });

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
                width: '400.26px',
                minWidth: '300px',
                maxWidth: '100%'
              }}
            />
          ));

    const [dateRange, setDateRange] = useState([null, null]);
    const [startDate, endDate] = dateRange;

    // Fetch chi nhánh
    const fetchBranches = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Warehouses/GetWarehouses');
            setBranches(res.data);
        } catch (err) {
            console.error('❌ Lỗi khi lấy chi nhánh:', err);
        }
    };

    // Fetch nhân viên
    const fetchEmployees = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/Staff/getStaff');
            setEmployees(res.data);
        } catch (err) {
            console.error('❌ Lỗi khi lấy nhân viên:', err);
        }
    };

    const fetchRefunds = async () => {
        try {
            const res = await axios.post('https://localhost:5000/api/sale-invoice/listRefund', {
                orderId: filters.orderId || null,
                productName: filters.productName || null,
                employeeName: filters.employeeId || null,
                branchId: filters.branchId || null,
                fromDate: startDate ? startDate.toISOString() : null,
                toDate: endDate ? endDate.toISOString() : null,
                page: filters.page,
                limit: filters.limit
            });
            setRefunds(res.data);
        } catch (err) {
            console.error('❌ Lỗi khi lấy hoàn tiền:', err);
        }
    };

    useEffect(() => {
        fetchBranches();
        fetchEmployees();
    }, []);

    useEffect(() => {
        fetchRefunds();
    }, [filters.page]);

    const handleInputChange = (key, value) => {
        setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
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
            <Header></Header>
            <div className="p-3 mt-4 mx-5 shadow-sm">
                <h4 className="mb-3">🔁 Danh sách hoàn tiền</h4>

                <Row className="mb-3 g-2">
                    <Col md={1}>
                        <Form.Control
                            placeholder="Mã đơn hàng"
                            value={filters.orderId}
                            onChange={(e) => handleInputChange('orderId', e.target.value)}
                        />
                    </Col>
                    <Col md={3}>
                        <Form.Control
                            placeholder="Sản phẩm"
                            value={filters.productName}
                            onChange={(e) => handleInputChange('productName', e.target.value)}
                        />
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={filters.employeeId}
                            onChange={(e) => handleInputChange('employeeId', e.target.value)}
                        >
                            <option value="">Tất cả nhân viên</option>
                            {employees.map(emp => (
                                <option key={emp.employeeId || emp.id} value={emp.fullName}>
                                    {emp.fullName}
                                </option>
                            ))}
                        </Form.Select>
                    </Col>
                    <Col md={2}>
                        <Form.Select
                            value={filters.branchId}
                            onChange={(e) => handleInputChange('branchId', e.target.value)}
                        >
                            <option value="">Tất cả chi nhánh</option>
                            {branches.map(branch => (
                                <option key={branch.branchId || branch.id} value={branch.branchId || branch.id}>
                                    {branch.name}
                                </option>
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
                                handleInputChange('fromDate', startDate);
                                handleInputChange('toDate', endDate);
                            }}
                            isClearable
                            placeholderText="Chọn khoảng ngày hoàn tiền"
                            className="form-control"
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
                                <th>Ngày hoàn</th>
                                <th>Mã đơn</th>
                                <th>Chi nhánh</th>
                                <th>Nhân viên</th>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Thành tiền</th>
                            </tr>
                        </thead>
                        <tbody>
                            {refunds.map((item, idx) => (
                                <tr key={idx}>
                                    <td>{(filters.page - 1) * filters.limit + idx + 1}</td>
                                    <td>{new Date(item.refund_date).toLocaleString()}</td>
                                    <td>{item.order_id}</td>
                                    <td>{item.warehouse}</td>
                                    <td>{item.employee_name}</td>
                                    <td>{item.product_name}</td>
                                    <td>{item.quantity}</td>
                                    <td>{item.total_price.toLocaleString()} VND</td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>

                {renderPagination()}
            </div>
        </div>
    );
};

export default RefundList;
