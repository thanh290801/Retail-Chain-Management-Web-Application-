import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // 🔹 Import useNavigate

const CashHandoverForm = () => {
    const [formData, setFormData] = useState({
        transactionCode: `TX-${Date.now()}`, // 🔹 Sinh mã giao dịch tự động
        employeeId: "",  // 👨‍💼 Người bàn giao
        receiverId: "",  // 🤝 Người nhận bàn giao (Có thể để trống)
        branchId: "",  // 🏢 Chi nhánh
        amount: "",  // 💰 Số tiền
        transactionType: "CASH_HANDOVER",  // 🔄 Loại giao dịch
        description: "",  // 📝 Mô tả
        createdBy: "",  // ✍️ Người tạo phiếu (Tên đăng nhập)
        personName: "",  // 👤 Tên người nhận bàn giao
    });

    const [message, setMessage] = useState("");
    const navigate = useNavigate(); // 🔹 Sử dụng useNavigate để chuyển trang

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Nếu là amount thì chuyển sang số
        if (name === "amount") {
            setFormData({ ...formData, [name]: parseFloat(value) });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };


    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post("https://localhost:5000/api/CashHandover/create", formData);
            setMessage(response.data.Message);
            setTimeout(() => navigate("/staffHome"), 1000);

        } catch (error) {
            setMessage(error.response?.data?.Message || "Lỗi khi tạo phiếu bàn giao!");
        }
    };

    return (
        <div className="p-4 max-w-lg mx-auto bg-white shadow-md rounded-lg">
            <h2 className="text-xl font-bold mb-4">Tạo Phiếu Bàn Giao Tiền Mặt</h2>
            {message && <p className="text-green-500">{message}</p>}
            <form onSubmit={handleSubmit} className="space-y-3">
                <input name="transactionCode" value={formData.transactionCode} readOnly className="w-full p-2 border rounded" />

                <input name="employeeId" placeholder="Mã nhân viên" onChange={handleChange} className="w-full p-2 border rounded" required />

                <input name="receiverId" placeholder="Mã người nhận (nếu có)" onChange={handleChange} className="w-full p-2 border rounded" />

                <input name="branchId" placeholder="Chi nhánh" onChange={handleChange} className="w-full p-2 border rounded" required />

                <input type="number" name="amount" placeholder="Số tiền" onChange={handleChange} className="w-full p-2 border rounded" required />

                <select name="transactionType" onChange={handleChange} className="w-full p-2 border rounded">
                    <option value="CASH_HANDOVER">Thu tiền mặt</option>
                    <option value="CASH_EXPENSE">Chi tiền mặt</option>
                </select>

                <input name="description" placeholder="Mô tả" onChange={handleChange} className="w-full p-2 border rounded" />

                <input name="createdBy" placeholder="Người tạo" onChange={handleChange} className="w-full p-2 border rounded" required />

                <input name="personName" placeholder="Tên người nhận" onChange={handleChange} className="w-full p-2 border rounded" />

                <button type="submit" className="w-full bg-blue-500 text-white py-2 rounded">Tạo Phiếu</button>
            </form>
        </div>
    );
};

export default CashHandoverForm;
