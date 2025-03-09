import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const numberToWordsVietnamese = (num) => {
    if (!num) return "";
    const units = ["", "nghìn", "triệu", "tỷ", "nghìn tỷ", "triệu tỷ", "tỷ tỷ"];
    const digits = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

    const convertThreeDigits = (n) => {
        let str = "";
        let hundred = Math.floor(n / 100);
        let ten = Math.floor((n % 100) / 10);
        let one = n % 10;
        if (hundred > 0) str += `${digits[hundred]} trăm `;
        if (ten > 1) str += `${digits[ten]} mươi `;
        else if (ten === 1) str += "mười ";
        if (one > 0) {
            if (ten === 0) str += "lẻ ";
            if (ten > 1 && one === 1) str += "mốt ";
            else if (one === 5 && ten > 0) str += "lăm ";
            else str += `${digits[one]} `;
        }
        return str.trim();
    };

    let parts = [];
    let unitIndex = 0;
    while (num > 0) {
        let part = num % 1000;
        if (part > 0) {
            let converted = convertThreeDigits(part);
            if (unitIndex > 0 && converted.startsWith("lẻ ")) {
                converted = converted.replace("lẻ ", "");
            }
            parts.unshift(`${converted} ${units[unitIndex]}`.trim());
        }
        num = Math.floor(num / 1000);
        unitIndex++;
    }
    return parts.join(" ") + " Việt Nam đồng";
};

const TransactionForm = () => {
    const navigate = useNavigate();
    const [type, setType] = useState("receipt");
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("cash");
    const [createdAt, setCreatedAt] = useState(new Date().toLocaleString("vi-VN"));
    const [receiver, setReceiver] = useState("");
    const [employeeInfo, setEmployeeInfo] = useState(null);
    const [showPrintModal, setShowPrintModal] = useState(false);

    useEffect(() => {
        fetchEmployeeInfo();
    }, []);

    const fetchEmployeeInfo = async () => {
        try {
            const token = localStorage.getItem("token");
            if (!token) return;

            const response = await axios.get("http://localhost:5000/api/account/me", {
                headers: { Authorization: `Bearer ${token}` },
            });

            setEmployeeInfo(response.data);
        } catch (error) {
            console.error("Lỗi khi lấy thông tin nhân viên:", error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const transactionData = {
            type,
            amount,
            description,
            paymentMethod,
            createdAt,
            receiver,
            creator: employeeInfo?.fullname,
        };
        try {
            await axios.post("http://localhost:5000/api/transactionsThuchi", transactionData);
            setShowPrintModal(true);
        } catch (error) {
            console.error("Lỗi khi gửi dữ liệu:", error);
        }
    };

    const handlePrint = () => {
        window.print();
        navigate("/staffHome");
    };

    return (//đổi biên bản bàn giao tiền mặt

        <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-6">
            <h2 className="text-xl font-bold text-center text-blue-600 mb-4">
                {type === "receipt" ? "Phiếu Thu Tiền" : "Phiếu Chi Tiền"}
            </h2>

            <p className="mb-2"><strong>Nhân viên tạo phiếu:</strong> {employeeInfo?.fullname || "Đang tải..."}</p>
            <p className="mb-4"><strong>Ngày lập phiếu:</strong> {createdAt}</p>

            <label className="block font-semibold">Loại phiếu:</label>
            <select
                className="w-full p-2 border rounded mt-1"
                value={type}
                onChange={(e) => setType(e.target.value)}
            >
                <option value="receipt">Phiếu Thu</option>
                <option value="expense">Phiếu Chi</option>
            </select>

            <form onSubmit={handleSubmit}>
                <label className="block font-semibold mt-3">Số tiền:</label>
                <input
                    type="number"
                    className="w-full p-2 border rounded mt-1"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    required
                />
                <p className="mt-2 text-gray-700"><strong>Bằng chữ:</strong> {numberToWordsVietnamese(Number(amount))}</p>

                <label className="block font-semibold mt-3">Nội dung:</label>
                <textarea
                    className="w-full p-2 border rounded mt-1"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    required
                />

                <div className="flex justify-between mt-4">
                    <button type="button" className="px-4 py-2 bg-gray-500 text-white rounded-lg" onClick={() => navigate("/cashBook")}>
                        Hủy
                    </button>
                    <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg">
                        Xác nhận
                    </button>
                </div>
            </form>

            {showPrintModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-gray-500 bg-opacity-50">
                    <div className="bg-white p-6 rounded shadow-lg">
                        <p>Bạn có muốn in phiếu không?</p>
                        <div className="flex justify-end mt-4">
                            <button className="px-4 py-2 bg-gray-500 text-white rounded-lg mr-2" onClick={() => navigate("/staffHome")}>Không</button>
                            <button className="px-4 py-2 bg-blue-600 text-white rounded-lg" onClick={handlePrint}>In</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TransactionForm;
