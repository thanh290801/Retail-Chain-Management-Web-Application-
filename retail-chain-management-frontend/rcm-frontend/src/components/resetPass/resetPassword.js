import React, { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import axios from "axios";

const ResetPassword = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const username = location.state?.username || "";

    const [otp, setOtp] = useState("");
    const [PasswordHash, setNewPassword] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const api_url = process.env.REACT_APP_API_URL

    const resetPassword = async () => {
        try {
            if (!otp || !PasswordHash) {
                setError("Vui lòng nhập đầy đủ OTP và mật khẩu mới.");
                return;
            }
            setError("");
            const response = await axios.post(`${api_url}/resetpasss/confirm-reset`, {
                username,
                otp,
                PasswordHash,
            });
            setMessage(response.data.message);
            setTimeout(() => navigate("/login"), 2000); // Chuyển về trang đăng nhập sau khi reset thành công
        } catch (error) {
            setError("OTP không hợp lệ hoặc lỗi hệ thống.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">🔑 Đặt Lại Mật Khẩu</h2>
                <p className="text-gray-600 text-center mb-4">Nhập mã OTP đã gửi đến số điện thoại của bạn.</p>

                {message && <p className="text-green-600 text-center mb-2">{message}</p>}
                {error && <p className="text-red-500 text-center mb-2">{error}</p>}

                <div className="flex flex-col space-y-3">
                    <label className="text-gray-600 font-medium">Mã OTP</label>
                    <input
                        type="text"
                        placeholder="Nhập OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    <label className="text-gray-600 font-medium">Mật khẩu mới</label>
                    <input
                        type="password"
                        placeholder="Nhập mật khẩu mới"
                        value={PasswordHash}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    <button
                        onClick={resetPassword}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200"
                    >
                        🔄 Đặt lại mật khẩu
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ResetPassword;
