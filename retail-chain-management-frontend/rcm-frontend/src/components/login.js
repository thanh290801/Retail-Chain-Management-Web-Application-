import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();
    const api_url = process.env.REACT_APP_API_URL

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (role) => {
        try {
            const mappedRole = role === 'Owner' ? 'Owner' : 'Staff';

            const response = await axios.post(`${api_url}/Auth/login`, {
                username,
                password,
                role: mappedRole
            });

            console.log("Response:", response); // ✅ LOG response để debug

            // Kiểm tra nếu response có data
            if (!response || !response.data) {
                throw new Error('API không trả về dữ liệu hợp lệ.');
                localStorage.clear();
            }

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('username', response.data.username);
                localStorage.setItem('employeeId', response.data.employeeId);
                if (response.data.role === 'Owner' && role === 'Owner') {
                    navigate('/revenue-summary-owner');
                } else if (response.data.role === 'Staff' && role === 'Staff') {
                    navigate('/staffHome');
                } else {
                    setErrorMessage('Quyền truy cập không phù hợp.');
                    localStorage.clear();
                }
            } else {
                localStorage.clear();

                setErrorMessage('Lỗi đăng nhập, vui lòng thử lại.');
            }
        } catch (error) {
            console.error("Lỗi đăng nhập:", error.response?.data || error.message);
            setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng.');
            localStorage.clear();

        }
    };


    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-80">
                <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">RCM</h1>

                {errorMessage && (
                    <div className="bg-red-100 text-red-700 p-2 mb-4 rounded-md">
                        {errorMessage}
                    </div>
                )}

                <div className="mb-4">
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Tên đăng nhập"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    />
                </div>

                <div className="mb-4 relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Mật khẩu"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    />
                    <span
                        onClick={togglePasswordVisibility}
                        className="absolute right-3 top-3 cursor-pointer text-gray-500"
                    >
                        {showPassword ? '🙈' : '👁️'}
                    </span>
                </div>

                <div className="flex items-center justify-between mb-6">
                    <label className="flex items-center text-gray-600">
                        <input type="checkbox" className="mr-2" /> Duy trì đăng nhập
                    </label>
                    <Link to="/forgot-password" className="text-blue-600 text-sm">
                        Quên mật khẩu?
                    </Link>
                </div>

                <div className="flex space-x-4">
                    <button
                        onClick={() => handleLogin('Owner')}
                        className="w-1/2 bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700"
                    >
                        QUẢN LÝ
                    </button>
                    <button
                        onClick={() => handleLogin('Staff')}
                        className="w-1/2 bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700"
                    >
                        BÁN HÀNG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
