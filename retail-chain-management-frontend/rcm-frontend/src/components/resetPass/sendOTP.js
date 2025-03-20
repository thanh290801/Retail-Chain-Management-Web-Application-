import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {
    const [username, setUsername] = useState("");
    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSendOTP = async () => {
        try {
            if (!username) {
                setError("Vui lòng nhập username!");
                return;
            }
            setError("");
            const response = await axios.post("https://localhost:5000/api/resetpasss/send-otp", { username });
            setMessage(response.data.message);
            setTimeout(() => navigate("/reset-password", { state: { username } }), 2000);
        } catch (err) {
            setError("Không thể gửi OTP. Vui lòng thử lại!");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-6 rounded-lg shadow-md w-96">
                <h2 className="text-2xl font-bold text-center text-gray-800 mb-4">🔐 Quên Mật Khẩu</h2>

                {message && <p className="text-green-600 text-center mb-2">{message}</p>}
                {error && <p className="text-red-500 text-center mb-2">{error}</p>}

                <div className="flex flex-col space-y-3">
                    <label className="text-gray-600 font-medium">Nhập Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Nhập username của bạn..."
                        className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />

                    <button
                        onClick={handleSendOTP}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-md transition duration-200"
                    >
                        🚀 Gửi OTP
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
