import React, { useEffect, useState, useCallback } from 'react';
import { Card, Form, Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import axios from 'axios';

const Calculator = ({ cartData, cashGiven, change, onCashUpdate, isReturn, paymentMethod, onPaymentMethodChange }) => {
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedDenoms, setSelectedDenoms] = useState([]);
    const [qrCode, setQrCode] = useState("");

    useEffect(() => {
        let totalItems = cartData.reduce((total, item) =>
            total + (isReturn ? (item.returnQuantity || 0) : (item.quantity || 0)), 0
        );

        let totalPrice = cartData.reduce((total, item) =>
            total + ((item.price || 0) * (isReturn ? (item.returnQuantity || 0) : (item.quantity || 0))), 0
        );

        setTotalItems(totalItems);
        setTotalPrice(totalPrice);
    }, [cartData, isReturn]);

    useEffect(() => {
        if (isReturn) {
            onCashUpdate(cashGiven, totalPrice - cashGiven);
        } else {
            onCashUpdate(cashGiven, Math.max(cashGiven - totalPrice, 0));
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

    const generateVietQR = useCallback(async () => {
        try {
            if (totalPrice > 0) {
                const response = await fetch("https://api.vietqr.io/v2/generate", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        accountNo: "8106205176266",
                        accountName: "Nguyen Thanh Huy",
                        acqId: "970405",
                        amount: totalPrice,
                        addInfo: `Thanh toán đơn hàng ${Date.now()}`,
                        format: "compact",
                        template: "compact"
                    }),
                });

                const data = await response.json();
                if (response.ok && data.data.qrDataURL) {
                    setQrCode(data.data.qrDataURL);
                } else {
                    console.error("Không thể tạo QR:", data.message || "Lỗi không xác định.");
                }
            } else {
                console.log("vui lòng thêm sản phẩm");
            }
        } catch (error) {
            console.error("Lỗi khi gọi API VietQR:", error);
        }
    }, [totalPrice]);

    const handlePaymentMethodChange = (val) => {
        onPaymentMethodChange(val);
        if (val === "transfer") {
            generateVietQR();
        } else {
            setQrCode("");
        }
    };

    // const handlePayment = useCallback(() => {
    //     console.log("Thanh toán thành công!");
    // }, []);

    // useEffect(() => {
    //     const handleKeyDown = (event) => {
    //         if (event.shiftKey && event.key === "P") {
    //             event.preventDefault();
    //             generateVietQR();
    //         }
    //         if (event.shiftKey && event.key === "Enter") {
    //             event.preventDefault();
    //             handlePayment();
    //         }
    //     };

    //     window.addEventListener("keydown", handleKeyDown);
    //     return () => window.removeEventListener("keydown", handleKeyDown);
    // }, [generateVietQR, handlePayment]);

    const handlePayment = async () => {
        try {
            console.log("🔄 Đang gửi yêu cầu thanh toán...");

            const requestData = {
                EmployeeId: 2, // Kiểm tra giá trị này có hợp lệ không?
                ShopId: 1, // Kiểm tra giá trị này có hợp lệ không?
                TotalAmount: totalPrice, // Tổng tiền có hợp lệ không?
                PaymentMethod: paymentMethod === "cash" ? "Cash" : "Bank",
                Products: cartData.map((item) => ({
                    ProductId: item.id, // Kiểm tra id sản phẩm
                    Quantity: item.quantity, // Kiểm tra số lượng
                    UnitPrice: item.price // Kiểm tra giá
                }))
            };

            console.log("📤 Data gửi lên API:", requestData);
            console.log(cartData);
            const response = await axios.post(
                "https://localhost:5000/api/sale-invoice/order/create",
                requestData
            );

            console.log("✅ API Response:", response.data);
            alert(`✅ Thanh toán thành công! Mã hóa đơn: ${response.data.orderId}`);
            onCashUpdate(0, 0);
        } catch (error) {
            console.error("❌ Lỗi khi gọi API thanh toán:", error);

            if (error.response) {
                console.log("🔍 Chi tiết lỗi:", error.response.data);
                alert(`❌ Lỗi tạo hóa đơn: ${error.response.data.message || "Lỗi không xác định"}`);
            } else {
                alert("❌ Không thể kết nối đến server, kiểm tra mạng hoặc API.");
            }
        }
    };


    const handleRefund = async () => {
        try {
            const { data } = await axios.post("https://localhost:5000/api/sale-invoice/order/refund", {
                EmployeeId: 1,
                ShopId: 1,
                TotalAmount: totalPrice,
                PaymentMethod: "Cash",
                Products: cartData.map((item) => ({
                    ProductId: item.id,
                    ReturnQuantity: item.returnQuantity || 0,
                    UnitPrice: item.price
                }))
            });

            if (data.refundId) {
                alert(`✅ Hoàn tiền thành công! Mã phiếu hoàn tiền: ${data.refundId}`);
                onCashUpdate(0, 0);
            } else {
                alert(`❌ Lỗi khi hoàn tiền: ${data.message || "Không thể tạo phiếu hoàn tiền."}`);
            }
        } catch (error) {
            console.error("❌ Lỗi khi gọi API hoàn tiền:", error);
            alert("❌ Lỗi khi gửi yêu cầu hoàn tiền.");
        }
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
                            <ToggleButton id="payment-cash" variant={paymentMethod === "cash" ? "primary" : "outline-primary"} value="cash">
                                Tiền mặt
                            </ToggleButton>
                            <ToggleButton id="payment-transfer" variant={paymentMethod === "transfer" ? "primary" : "outline-secondary"} value="transfer">
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
                                <Form.Label>Tiền thừa</Form.Label>
                                <div className="text-end fw-bold fs-4 text-success">
                                    {(change || 0).toLocaleString()} VND
                                </div>
                            </Form.Group>
                        )}

                        {paymentMethod === 'transfer' && (
                            <div className="d-flex flex-column align-items-center mt-3">
                                <Button variant="primary" onClick={generateVietQR} className="mb-3">
                                    Tạo mã QR (Shift + P)
                                </Button>

                                {qrCode && (
                                    <>
                                        <img src={qrCode} alt="QR Code VietQR" width={200} height={200} className="mx-auto d-block" />
                                        <p className="mt-2 text-center">Agribank - 8106205176266 - Nguyen Thanh Huy</p>
                                        <p className="text-muted text-center">Quét mã để thanh toán</p>
                                    </>
                                )}
                            </div>
                        )}
                    </>
                )}

                <Button
                    variant={isReturn ? "danger" : "primary"}
                    className="w-100 py-2 fs-5"
                    onClick={isReturn ? handleRefund : handlePayment}
                >
                    {isReturn ? "Hoàn tiền" : "Thanh toán"}
                </Button>

            </Form>
        </Card>
    );
};

export default Calculator;
