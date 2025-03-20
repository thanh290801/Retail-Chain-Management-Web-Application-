import React, { useEffect, useState, useCallback } from 'react';
import { Card, Form, Button, ToggleButton, ToggleButtonGroup } from 'react-bootstrap';
import axios from 'axios';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Calculator = ({
    cartData,
    cashGiven,
    change,
    onCashUpdate,
    isReturn,
    paymentMethod,
    onPaymentMethodChange,
    invoiceId,
    orderId, // ✅ Nhận orderId từ props
    handleRemoveInvoice // ✅ Nhận handleRemoveInvoice từ props
}) => {
    const [totalItems, setTotalItems] = useState(0);
    const [totalPrice, setTotalPrice] = useState(0);
    const [selectedDenoms, setSelectedDenoms] = useState([]);
    const [qrCode, setQrCode] = useState("");

    const token = localStorage.getItem("token");

    useEffect(() => {
        let totalItems = cartData.reduce((total, item) =>
            total + (isReturn ? (parseInt(item.returnQuantity, 10) || 0) : (parseInt(item.quantity, 10) || 0)), 0
        );

        let totalPrice = cartData.reduce((total, item) =>
            total + ((item.unitPrice || item.price || 0) * (isReturn ? (parseInt(item.returnQuantity, 10) || 0) : (parseInt(item.quantity, 10) || 0))), 0
        );

        setTotalItems(totalItems);
        setTotalPrice(totalPrice);
    }, [cartData, isReturn]);

    useEffect(() => {
        const newChange = isReturn ? totalPrice - cashGiven : Math.max(cashGiven - totalPrice, 0);

        // 🔹 Chỉ gọi `onCashUpdate` nếu giá trị thay đổi thực sự
        if (change !== newChange) {
            onCashUpdate(cashGiven, newChange);
        }
    }, [totalPrice, cashGiven, isReturn, change, onCashUpdate]);

    const denominations = [1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000];

    const handleSelectDenomination = (denom) => {
        const newCashGiven = cashGiven + denom;
        const newChange = isReturn ? Math.max(totalPrice - newCashGiven, 0) : Math.max(newCashGiven - totalPrice, 0);
        onCashUpdate(newCashGiven, newChange);
        setSelectedDenoms([...selectedDenoms, denom]);
    };

    const handleCashGivenChange = (e) => {
        const value = parseFloat(e.target.value) || 0;
        const newChange = isReturn ? Math.max(totalPrice - value, 0) : Math.max(value - totalPrice, 0);

        if (cashGiven !== value || change !== newChange) {
            onCashUpdate(value, newChange);
        }

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

    const handlePrintInvoice = (invoiceData) => {
        const printWindow = window.open("", "_blank");

        const invoiceHTML = `
            <html>
            <head>
                <title>Hóa đơn thanh toán</title>
                <style>
                    @page {
                        size: A0; /* 🔹 Đặt kích thước giấy A0 */
                        margin: 0;
                    }
                    body { 
                        font-family: Arial, sans-serif; 
                        padding: 50px;
                        font-size: 48px; /* 🔹 Phóng to chữ phù hợp với A0 */
                    }
                    .invoice-container { 
                        max-width: 1800px; /* 🔹 Tăng chiều rộng nội dung phù hợp */
                        margin: auto; 
                        text-align: center;
                    }
                    h2 { font-size: 80px; } /* 🔹 Tiêu đề to hơn */
                    .invoice-details { text-align: left; margin-top: 50px; }
                    .invoice-details div { margin-bottom: 20px; font-size: 48px; }
                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-top: 50px;
                    }
                    th, td {
                        border: 2px solid black;
                        padding: 20px;
                        text-align: center;
                        font-size: 48px;
                    }
                    .total {
                        font-weight: bold; 
                        font-size: 60px; 
                        margin-top: 50px;
                    }
                </style>
            </head>
            <body>
                <div class="invoice-container">
                    <h2>🧾 HÓA ĐƠN THANH TOÁN</h2>
                    <hr>
                    <div class="invoice-details">
                        <div><strong>Mã hóa đơn:</strong> ${invoiceData.id}</div>
                        <div><strong>Ngày:</strong> ${new Date().toLocaleString()}</div>
                        <div><strong>Khách hàng:</strong> ${invoiceData.customer || "Khách lẻ"}</div>
                    </div>
                    <hr>
                    <table>
                        <thead>
                            <tr>
                                <th>Sản phẩm</th>
                                <th>Số lượng</th>
                                <th>Giá</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoiceData.items.map(item => `
                                <tr>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>${item.price.toLocaleString()} VND</td>
                                </tr>
                            `).join("")}
                        </tbody>
                    </table>
                    <hr>
                    <div class="total">Tổng cộng: ${invoiceData.totalAmount.toLocaleString()} VND</div>
                    <hr>
                    <p>Cảm ơn quý khách đã mua hàng! 🎉</p>
                </div>
                <script>
                    window.print();
                </script>
            </body>
            </html>
        `;

        printWindow.document.write(invoiceHTML);
        printWindow.document.close();
    };

    const handlePayment = async () => {
        try {
            console.log("🔄 Đang gửi yêu cầu thanh toán...");

            const requestData = {
                TotalAmount: totalPrice,
                PaymentMethod: paymentMethod === "cash" ? "Cash" : "Bank",
                Products: cartData.map((item) => ({
                    ProductId: item.id,
                    Quantity: item.quantity,
                    UnitPrice: item.price
                }))
            };

            const response = await axios.post(
                "https://localhost:5000/api/sale-invoice/order/create",
                requestData,
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    }
                }
            );

            // ✅ Hiển thị thông báo
            toast.success(`💰 Thanh toán thành công!`);

            // ✅ Gọi `handleRemoveInvoice` để xóa hóa đơn sau khi thanh toán
            handleRemoveInvoice(invoiceId);

        } catch (error) {
            console.error("❌ Lỗi khi gọi API thanh toán:", error);

            if (error.response) {
                console.log("🔍 Chi tiết lỗi:", error.response.data);
                toast.error(`❌ Lỗi tạo hóa đơn: ${error.response.data.message || "Lỗi không xác định"}`);
            } else {
                toast.error("❌ Không thể kết nối đến server, kiểm tra mạng hoặc API.");
            }
        }
    };

    const handleRefund = async () => {
        try {
            const response = await axios.post(
                "https://localhost:5000/api/sale-invoice/order/refund",
                {
                    OrderId: orderId,
                    RefundProducts: cartData.map((item) => ({
                        ProductId: item.productId,
                        ReturnQuantity: item.returnQuantity || 0,
                        UnitPrice: item.unitPrice
                    }))
                },
                {
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`,
                    }
                }
            );

            toast.success(`🔄 Hoàn tiền thành công!`);
            handleRemoveInvoice(invoiceId);
            setTimeout(() => {
                onCashUpdate(0, 0);
            }, 500);
        } catch (error) {
            console.error("❌ Lỗi khi gọi API hoàn tiền:", error);
            toast.error("❌ Lỗi khi gửi yêu cầu hoàn tiền.");
        }
    };

    return (
        <Card className="p-3">
            <ToastContainer position="top-right" autoClose={3000} hideProgressBar={false} />

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