import React, { useState } from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Cart from './cart';
import Calculator from './calculator';

const Main = () => {
    const [cartData, setCartData] = useState([]);

    const handleUpdateCart = (updatedCart) => {
        setCartData(updatedCart); // Nhận dữ liệu từ Cart
    };

    const totalItems = cartData.reduce((total, item) => total + item.quantity, 0);
    const totalPrice = cartData.reduce((total, item) => total + item.price * item.quantity, 0);

    return (
        <Container fluid>
            <Row>
                <Col md={8} className='mt-2'>
                    <Container className='item-card left-tem'>
                        <Cart onUpdateCart={handleUpdateCart} />
                    </Container>
                </Col>
                <Col md={4} className='mt-2'>
                    <Container className='item-card right-item'>
                        <Calculator cartData={cartData} totalItems={totalItems} totalPrice={totalPrice} />
                    </Container>
                </Col>
            </Row>
        </Container>
    );
};

export default Main;
