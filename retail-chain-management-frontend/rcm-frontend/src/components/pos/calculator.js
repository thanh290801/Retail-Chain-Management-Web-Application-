import React, { useEffect, useState } from 'react';
import { Card, Form, Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';

const Calculator = ({ cartData, cashGiven, change, onCashUpdate, isReturn }) => {
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [paymentMethod, setPaymentMethod] = useState('cash'); // Mặc định: Tiền mặt
    const [selectedDenoms, setSelectedDenoms] = useState([]); // Lưu các mệnh giá đã chọn

    useEffect(() => {
        let totalItems = cartData.reduce((total, item) => 
            total + parseFloat(isReturn ? (item.returnQuantity || 0) : (item.quantity || 0)), 0
        );
    
        let totalPrice = cartData.reduce((total, item) =>
            total + (parseFloat(item.price || 0) * parseFloat(isReturn ? (item.returnQuantity || 0) : (item.quantity || 0))), 0
        );
    
        setTotalItems(totalItems);
        setTotalPrice(totalPrice);
    }, [cartData, isReturn]);      

    useEffect(() => {
        if (isReturn) {
            onCashUpdate(cashGiven, totalPrice - cashGiven); // Phiếu trả hàng: tiền khách còn thiếu
        } else {
            onCashUpdate(cashGiven, Math.max(cashGiven - totalPrice, 0)); // Hóa đơn: tiền thối lại
        }
    }, [totalPrice, cashGiven, isReturn, onCashUpdate]);    

    const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

    const handleSelectDenomination = (denom) => {
        const newCashGiven = cashGiven + denom;
        const newChange = isReturn ? Math.max(totalPrice - newCashGiven, 0) : Math.max(newCashGiven - totalPrice, 0);
        onCashUpdate(newCashGiven, newChange);
        setSelectedDenoms([...selectedDenoms, denom]);
    };

    const handleCashGivenChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        onCashUpdate(value, isReturn ? Math.max(totalPrice - value, 0) : Math.max(value - totalPrice, 0));
        setSelectedDenoms([]);
    };

    const handlePaymentMethodChange = (val) => {
        onCashUpdate(0, 0);
        setSelectedDenoms([]);
    };

    return (
        <Card className="p-3">
            <Form>
                <Form.Group className="mb-2">
                    <Form.Label>{isReturn ? "Tổng tiền hoàn trả" : "Tổng tiền hàng"} ({totalItems} sản phẩm)</Form.Label>
                    <div className={`text-end fw-bold fs-5 ${isReturn ? "text-danger" : "text-primary"}`}>
                        {(totalPrice || 0).toLocaleString()} VND
                    </div>
                </Form.Group>

                <Form.Group className="mb-3">
                    <Form.Label>{isReturn ? "Khách sẽ nhận lại" : "Khách cần trả"}</Form.Label>
                    <div className={`text-end fw-bold fs-4 ${isReturn ? "text-danger" : "text-success"}`}>
                        {(totalPrice || 0).toLocaleString()} VND
                    </div>
                </Form.Group>

                {!isReturn && (
                    <>
                        <ToggleButtonGroup
                            type="radio"
                            name="paymentMethod"
                            value={paymentMethod}
                            onChange={handlePaymentMethodChange}
                            className="w-100"
                        >
                            <ToggleButton
                                id="payment-cash"
                                variant={paymentMethod === "cash" ? "primary" : "outline-primary"}
                                value="cash"
                            >
                                Tiền mặt
                            </ToggleButton>

                            <ToggleButton
                                id="payment-transfer"
                                variant={paymentMethod === "transfer" ? "primary" : "outline-secondary"}
                                value="transfer"
                            >
                                Chuyển khoản
                            </ToggleButton>
                        </ToggleButtonGroup>

                        {paymentMethod === 'cash' && (
                            <Form.Group className="mb-3">
                                <div className="d-grid gap-2 p-2"
                                    style={{
                                        gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                                        justifyContent: "center"
                                    }}>
                                    {[...denominations].reverse().map((denom) => (
                                        <Button
                                            key={denom}
                                            variant={selectedDenoms.includes(denom) ? "primary" : "outline-secondary"}
                                            className="text-center rounded fw-bold"
                                            style={{
                                                fontSize: "16px",
                                                padding: "12px",
                                                minWidth: "100px",
                                                borderRadius: "8px"
                                            }}
                                            onClick={() => handleSelectDenomination(denom)}
                                        >
                                            {denom.toLocaleString()}
                                        </Button>
                                    ))}
                                </div>

                                <Form.Control
                                    type="number"
                                    min="0"
                                    value={cashGiven}
                                    onChange={handleCashGivenChange}
                                    placeholder="Nhập số tiền khách đưa"
                                    className="mt-2 p-2 fs-5"
                                />
                            </Form.Group>
                        )}
                    </>
                )}

                {/* Ẩn nếu là phiếu trả hàng */}
                {!isReturn && (
                    <Form.Group className="mb-3">
                        <Form.Label>Tiền thối lại</Form.Label>
                        <div className="text-end fw-bold fs-4 text-primary">
                            {(change || 0).toLocaleString()} VND
                        </div>
                    </Form.Group>
                )}

                <Button variant={isReturn ? "danger" : "primary"} className="w-100 py-2 fs-5">
                    {isReturn ? "Hoàn tiền" : "Thanh toán"}
                </Button>
            </Form>
        </Card>
    );
};

export default Calculator;
