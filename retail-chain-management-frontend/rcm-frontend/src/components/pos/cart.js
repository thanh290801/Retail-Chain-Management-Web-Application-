import React, { useEffect, useState } from 'react';
import { Button, Container, Row, Col, Card, InputGroup, FormControl, Table } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';

const Cart = ({ cartData, onUpdateCart, quantityInputRefs, isReturn }) => {
    const [cart, setCart] = useState(cartData);

    useEffect(() => {
        setCart(cartData);
    }, [cartData]);

    const handleQuantityChange = (id, value) => {
        let numericValue = value.replace(/[^0-9.]/g, '');
        const updatedCart = cart.map(item => 
            item.id === id ? { ...item, quantity: numericValue } : item
        );
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    const handleReturnQuantityChange = (id, value) => {
        const updatedCart = cart.map(item => 
            item.id === id ? { ...item, returnQuantity: Math.min(Number(value), item.quantity) } : item
        );
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    const handleRemoveItem = (id) => {
        const updatedCart = cart.filter(item => item.id !== id);
        setCart(updatedCart);
        onUpdateCart(updatedCart);
    };

    return (
        <Container>
            {/* Nếu là Phiếu Trả Hàng, hiển thị dạng bảng */}
            {isReturn ? (
                <Table bordered hover responsive>
                    <thead>
                        <tr>
                            <th>Tên sản phẩm</th>
                            <th>Số lượng mua</th>
                            <th>Số lượng trả</th>
                            <th>Giá</th>
                            <th>Tổng</th>
                            {/* <th>Hành động</th> */}
                        </tr>
                    </thead>
                    <tbody>
                        {cart.map(item => (
                            <tr key={item.id}>
                                <td className="fw-bold">{item.name}</td>
                                <td className="text-center fw-bold">{item.quantity}</td>

                                {/* Số lượng trả lại */}
                                <td className="text-center">
                                    <InputGroup>
                                    <FormControl
                                        type="number"
                                        min="0"
                                        max={item.quantity} // Không cho nhập quá số lượng gốc
                                        value={item.returnQuantity || 0}
                                        onChange={(e) => {
                                            const newReturnQty = Math.min(Number(e.target.value), item.quantity);
                                            handleReturnQuantityChange(item.id, newReturnQty);
                                        }}
                                    />
                                    </InputGroup>
                                </td>

                                <td className="text-end">{(item.price ?? 0).toLocaleString()} VND</td>
                                <td className="text-end fw-bold">
                                    {((parseFloat(item.price) || 0) * (parseFloat(item.returnQuantity) || 0)).toLocaleString()} VND
                                </td>
                                
                                {/* <td className="text-center">
                                    <Button variant="outline-danger" onClick={() => handleRemoveItem(item.id)}>
                                        <BsTrash size={20} />
                                    </Button>
                                </td> */}
                            </tr>
                        ))}
                    </tbody>
                </Table>
            ) : (
                // Nếu là Hóa Đơn Bán Hàng, hiển thị dạng Card
                cart.map(item => (
                    <Card key={item.id} className="mb-3 p-2">
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
                            <Col xs={2} className="text-end fw-bold">{((parseFloat(item.price) || 0) * (parseFloat(item.quantity) || 0)).toLocaleString()} VND</Col>
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
