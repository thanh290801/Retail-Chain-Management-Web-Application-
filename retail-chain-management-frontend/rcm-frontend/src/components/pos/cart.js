import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col, Card, InputGroup, FormControl, Table } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';

const Cart = ({ cartData, onUpdateCart, quantityInputRefs, isReturn }) => {
    const [cart, setCart] = useState(cartData);

    useEffect(() => {
        setCart(cartData);
    }, [cartData]);

    // ✅ Xử lý thay đổi số lượng sản phẩm trong hóa đơn bán hàng
    const handleQuantityChange = (id, value) => {
        let numericValue = value.replace(/[^0-9]/g, ''); // Chỉ giữ lại số
        const updatedCart = cart.map(item =>
            item.id === id ? { ...item, quantity: numericValue } : item
        );
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    // ✅ Xử lý thay đổi số lượng trả hàng (không được vượt quá số lượng mua)
    const handleReturnQuantityChange = (orderDetailId, value) => {
        const updatedCart = cart.map(item =>
            item.orderDetailId === orderDetailId
                ? { ...item, returnQuantity: Math.min(Number(value), item.quantity) }
                : item
        );
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    // ✅ Xóa sản phẩm khỏi giỏ hàng
    const handleRemoveItem = (id) => {
        const updatedCart = cart.filter(item => item.id !== id);
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    return (
        <Container>
            {/* 🔹 Nếu là Phiếu Trả Hàng, hiển thị bảng sản phẩm */}
            {isReturn ? (
                <Table bordered hover responsive>
                    <thead>
                        <tr>
                            <th style={{ width: "30%" }}>Tên sản phẩm</th>
                            <th style={{ width: "15%", textAlign: "center" }}>Số lượng mua</th>
                            <th style={{ width: "15%", textAlign: "center" }}>Số lượng trả</th>
                            <th style={{ width: "20%", textAlign: "right" }}>Giá</th>
                            <th style={{ width: "20%", textAlign: "right" }}>Tổng</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                            <tr key={item.orderDetailId || `return-${item.productId}`}>
                                {/* ✅ Tên sản phẩm */}
                                <td className="fw-bold">{item.productName}</td>

                                {/* ✅ Số lượng mua ban đầu */}
                                <td className="text-center fw-bold">{item.quantity}</td>

                                {/* 🔹 Input số lượng trả hàng */}
                                <td className="text-center">
                                    <InputGroup>
                                        <FormControl
                                            type="number"
                                            min="0"
                                            max={item.quantity} // Không cho nhập quá số lượng mua
                                            value={item.returnQuantity || 0}
                                            onChange={(e) => handleReturnQuantityChange(item.orderDetailId, e.target.value)}
                                        />
                                    </InputGroup>
                                </td>

                                {/* ✅ Đơn giá sản phẩm */}
                                <td className="text-end">{(item.unitPrice ?? 0).toLocaleString()} VND</td>

                                {/* ✅ Tổng tiền trả hàng */}
                                <td className="text-end fw-bold">
                                    {((parseFloat(item.unitPrice) || 0) * (parseFloat(item.returnQuantity) || 0)).toLocaleString()} VND
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                // 🔹 Nếu là Hóa Đơn Bán Hàng, hiển thị dạng danh sách sản phẩm
                cart.map(item => (
                    <Card key={item.id || `cart-${item.productId}`} className="mb-3 p-2">
                        <Row className="align-items-center">
                            <Col xs={3} className="fw-bold">{item.name}</Col>
                            <Col xs={3}>
                                <InputGroup>
                                    <FormControl
                                        type="text"
                                        value={item.quantity}
                                        onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                        ref={(el) => quantityInputRefs.current[item.id] = el}
                                    />
                                </InputGroup>
                            </Col>
                            <Col xs={2} className="text-end">{(item.price ?? 0).toLocaleString()} VND</Col>
                            <Col xs={2} className="text-end fw-bold">
                                {((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toLocaleString()} VND
                            </Col>
                            <Col xs={1} className="text-center">
                                <Button variant="outline-danger" onClick={() => handleRemoveItem(item.id)}>
                                    <BsTrash size={20} />
                                </Button>
                            </Col>
                        </Row>
                    </Card>
                ))
            )}
        </Container>
    );
};

export default Cart;