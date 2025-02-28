import React, { useEffect, useState } from 'react';
import { Card, Form, Button } from 'react-bootstrap';

const Calculator = ({ cartData }) => {
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);

    const discount = 154000; // Giảm giá mẫu
    const additionalFee = 20000; // Phí khác mẫu

    useEffect(() => {
        // Tính toán tổng số lượng sản phẩm
        const totalItems = cartData.reduce((total, item) => total + parseFloat(item.quantity || 0), 0);
        setTotalItems(totalItems);

        // Tính toán tổng giá trị sản phẩm
        const totalPrice = cartData.reduce((total, item) =>
            total + (parseFloat(item.price || 0) * parseFloat(item.quantity || 0)), 0
        );
        setTotalPrice(totalPrice);
    }, [cartData]);

    const totalAfterDiscount = (totalPrice - discount + additionalFee) > 0 
        ? totalPrice - discount + additionalFee 
        : 0;

    return (
        <Card className="p-3">
            <Form>
                <Form.Group className="mb-2">
                    <Form.Label>Tổng tiền hàng ({totalItems} sản phẩm)</Form.Label>
                    <div className="text-end fw-bold fs-5 text-primary">
                        {(totalPrice || 0).toLocaleString()} VND
                    </div>
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>Giảm giá</Form.Label>
                    <div className="text-end text-muted">{discount.toLocaleString()} VND</div>
                </Form.Group>

                <Form.Group className="mb-2">
                    <Form.Label>Phí khác</Form.Label>
                    <div className="text-end text-muted">{additionalFee.toLocaleString()} VND</div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Khách cần trả</Form.Label>
                    <div className="text-end fw-bold fs-4 text-success">
                        {(totalAfterDiscount || 0).toLocaleString()} VND
                    </div>
                </Form.Group>

                <Button variant="primary" className="w-100 py-2 fs-5">Thanh toán</Button>
            </Form>
        </Card>
    );
};

export default Calculator;
