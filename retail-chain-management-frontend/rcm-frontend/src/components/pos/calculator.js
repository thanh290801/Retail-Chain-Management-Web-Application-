import React from 'react';
import { Card, Form, Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';

const Calculator = ({ cartData, totalItems, totalPrice }) => {
    const discount = 154000; // Giảm giá mẫu
    const additionalFee = 20000; // Phí khác mẫu
    const totalAfterDiscount = totalPrice - discount + additionalFee;

    return (
        <Card className="p-3">
            <Form>
                <Form.Group className="mb-2">
                    <Form.Label>Tổng tiền hàng ({totalItems} sản phẩm)</Form.Label>
                    <div className="text-end fw-bold fs-5 text-primary">{totalPrice.toLocaleString()} VND</div>
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
                    <div className="text-end fw-bold fs-4 text-success">{totalAfterDiscount.toLocaleString()} VND</div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>Phương thức thanh toán</Form.Label>
                    <ToggleButtonGroup type="radio" name="paymentMethod" defaultValue="cash" className="w-100">
                        <ToggleButton variant="outline-primary" value="cash">Tiền mặt</ToggleButton>
                        <ToggleButton variant="outline-secondary" value="transfer">Chuyển khoản</ToggleButton>
                        <ToggleButton variant="outline-secondary" value="card">Thẻ</ToggleButton>
                    </ToggleButtonGroup>
                </Form.Group>

                <Button variant="primary" className="w-100 py-2 fs-5">Thanh toán</Button>
            </Form>
        </Card>
    );
};

export default Calculator;
