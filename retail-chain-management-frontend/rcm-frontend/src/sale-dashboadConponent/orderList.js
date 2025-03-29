import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, Table, Form, Row, Col, Modal, Button } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

const OrderList = () => {
    const location = useLocation();
    const queryParams = new URLSearchParams(location.search);

    const [orders, setOrders] = useState([]);
    const [paymentFilter, setPaymentFilter] = useState(queryParams.get('paymentMethod') || '');
    const branchId = queryParams.get('branchId') || '';
    const [fromDate] = useState(queryParams.get('fromDate') || '');
    const [toDate] = useState(queryParams.get('toDate') || '');
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        fetchOrders();
    }, [paymentFilter]);

    const fetchOrders = async () => {
        try {
            const params = { paymentMethod: paymentFilter };
            if (branchId) params.branchId = branchId;
            if (fromDate) params.fromDate = fromDate;
            if (toDate) params.toDate = toDate;

            const response = await axios.get('https://localhost:5000/api/sale-invoice/list', { params });
            setOrders(groupByOrder(response.data));
        } catch (error) {
            console.error('❌ Lỗi khi tải danh sách đơn hàng:', error);
        }
    };

    const groupByOrder = (data) => {
        const grouped = {};
        data.forEach(row => {
            if (!grouped[row.orderId]) {
                grouped[row.orderId] = {
                    ...row,
                    details: [],
                    refund: null // Thêm trường refund để lưu thông tin hoàn tiền
                };
            }
            grouped[row.orderId].details.push({
                productId: row.product_id,
                product_name: row.product_name || 'Không có tên sản phẩm',
                quantity: row.quantity || 0,
                unitPrice: row.unit_price || 0,
                totalPrice: row.total_price || 0
            });

            // Nếu có thông tin hoàn tiền thì lưu vào trường refund
            if (row.refund_id) {
                grouped[row.orderId].refund = {
                    refundId: row.refund_id,
                    refundDate: row.refund_date,
                    refundProductId: row.refund_product_id,
                    refundQuantity: row.refund_quantity,
                    refundTotalPrice: row.refund_total_price
                };
            }
        });
        return Object.values(grouped);
    };

    const handleShowModal = (order) => {
        setSelectedOrder(order);
        setShowModal(true);
    };

    return (
        <Card className="p-3 mt-3">
            <h4 className="mb-3">📋 Danh sách đơn hàng</h4>

            <Row className="mb-3">
                <Col md={4}>
                    <Form.Select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)}>
                        <option value="">Tất cả phương thức</option>
                        <option value="cash">Tiền mặt</option>
                        <option value="transfer">Chuyển khoản</option>
                    </Form.Select>
                </Col>
            </Row>

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
                    {orders.map((order, idx) => (
                        <tr key={order.orderId}>
                            <td>{idx + 1}</td>
                            <td>{new Date(order.created_date).toLocaleString()}</td>
                            <td>{order.employee_name}</td>
                            <td>{order.total_amount.toLocaleString()} VND</td>
                            <td>
                                <Button variant="info" size="sm" onClick={(e) => { e.stopPropagation(); handleShowModal(order); }}>
                                    Xem
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            {/* Modal Chi tiết đơn hàng */}
            <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>Chi tiết đơn hàng #{selectedOrder?.orderId}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedOrder && (
                        <>
                            <p><strong>Ngày tạo:</strong> {new Date(selectedOrder.created_date).toLocaleString()}</p>
                            <p><strong>Chi nhánh:</strong> {selectedOrder.warehouse}</p>
                            <p><strong>Nhân viên:</strong> {selectedOrder.employee_name}</p>
                            <p><strong>Tổng tiền:</strong> {selectedOrder.total_amount.toLocaleString()} VND</p>

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
                                    {selectedOrder.details.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.product_name}</td>
                                            <td>{item.quantity}</td>
                                            <td>{item.unitPrice.toLocaleString()} VND</td>
                                            <td>{item.totalPrice.toLocaleString()} VND</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>

                            {/* Hiển thị thông tin Refund nếu có */}
                            {/* {selectedOrder.refund && (
                                <>
                                    <h5 className="mt-4">Thông tin hoàn tiền:</h5>
                                    <p><strong>Ngày hoàn tiền:</strong> {new Date(selectedOrder.refund.refundDate).toLocaleString()}</p>
                                    <p><strong>Sản phẩm hoàn tiền:</strong> SP #{selectedOrder.refund.refundProductId}</p>
                                    <p><strong>Số lượng hoàn tiền:</strong> {selectedOrder.refund.refundQuantity}</p>
                                    <p><strong>Tổng tiền hoàn tiền:</strong> {selectedOrder.refund.refundTotalPrice.toLocaleString()} VND</p>
                                </>
                            )} */}
                        </>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>Đóng</Button>
                </Modal.Footer>
            </Modal>
        </Card>
    );
};

export default OrderList;
