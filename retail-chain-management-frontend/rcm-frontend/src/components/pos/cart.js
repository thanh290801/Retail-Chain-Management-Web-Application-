import React, { useState, useEffect } from 'react';
import { Button, Container, Row, Col, Card, InputGroup, FormControl } from 'react-bootstrap';
import { BsTrash } from 'react-icons/bs';

const Cart = ({ onUpdateCart }) => {
    // Dữ liệu mẫu
    const [cart, setCart] = useState([
        { id: 1, name: 'Hoa Yến Mạch', price: 170000, quantity: '1', unit: 'Bó' },
        { id: 2, name: 'Lọ hoa gốm trang trí - S', price: 600000, quantity: '1', unit: 'Chiếc' },
        { id: 3, name: 'Bình hoa thủy tinh', price: 250000, quantity: '1', unit: 'Chiếc' }
    ]);

    useEffect(() => {
        onUpdateCart(cart); // Cập nhật cartData trong POSScreen khi cart thay đổi
    }, [cart, onUpdateCart]);

    const handleQuantityChange = (id, value) => {
        // Chỉ cho phép số và dấu chấm, ngăn ký tự khác
        let numericValue = value.replace(/[^0-9.]/g, '');

        // Kiểm tra nếu có nhiều hơn một dấu chấm
        const dotCount = (numericValue.match(/\./g) || []).length;
        if (dotCount > 1) {
            return;
        }

        // Giới hạn tối đa 3 chữ số sau dấu chấm
        if (numericValue.includes('.')) {
            const [integerPart, decimalPart] = numericValue.split('.');
            if (decimalPart.length > 3) {
                return;
            }
        }

        // Cập nhật giá trị chuỗi trực tiếp vào state
        const updatedCart = cart.map(item =>
            item.id === id ? { ...item, quantity: numericValue } : item
        );
        setCart(updatedCart);
    };

    const handleIncrement = (id, currentQuantity) => {
        const newQuantity = (parseFloat(currentQuantity) + 1).toString();
        const updatedCart = cart.map(item =>
            item.id === id ? { ...item, quantity: newQuantity } : item
        );
        setCart(updatedCart);
    };

    const handleDecrement = (id, currentQuantity) => {
        const newQuantity = Math.max(parseFloat(currentQuantity) - 1, 1).toFixed(3);
        const updatedCart = cart.map(item =>
            item.id === id ? { ...item, quantity: parseFloat(newQuantity).toString() } : item
        );
        setCart(updatedCart);
    };

    const handleRemoveItem = (id) => {
        const updatedCart = cart.filter(item => item.id !== id);
        setCart(updatedCart);
    };

    return (
        <Container className="mt-4">
            {cart.map(item => (
                <Card key={item.id} className="mb-3 p-2">
                    <Row className="align-items-center">
                        <Col xs={3} className="fw-bold">{item.name}</Col>
                        <Col xs={1} className="text-center text-muted">{item.unit}</Col>
                        <Col xs={3}>
                            <InputGroup className="d-flex align-items-center">
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => handleDecrement(item.id, item.quantity)}
                                >-</Button>

                                <FormControl
                                    type="text"
                                    inputMode="decimal"
                                    value={item.quantity}
                                    onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                    className="mx-2 text-center quantity-input"
                                />

                                <Button
                                    variant="outline-secondary"
                                    onClick={() => handleIncrement(item.id, item.quantity)}
                                >+</Button>
                            </InputGroup>
                        </Col>
                        <Col xs={2} className="text-end">{item.price.toLocaleString()}</Col>
                        <Col xs={2} className="text-end fw-bold">
                            {(item.price * parseFloat(item.quantity || 0)).toLocaleString()}
                        </Col>
                        <Col xs={1} className="text-center">
                            <Button
                                variant="outline-danger"
                                onClick={() => handleRemoveItem(item.id)}
                            >
                                <BsTrash size={20} color="red" />
                            </Button>
                        </Col>
                    </Row>
                </Card>
            ))}
        </Container>
    );
};

export default Cart;
