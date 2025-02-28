import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoginPage = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async (role) => {
        try {
            // Kiểm tra Role phù hợp với Backend ("Chủ" hoặc "Nhân viên")
            const mappedRole = role === 'Owner' ? 'Ch?' : 'Nhân viên';

            const response = await axios.post('http://localhost:5000/api/Auth/login', {
                username,
                password,
                role: mappedRole
            });

            if (response.data.token) {
                localStorage.setItem('token', response.data.token);
                localStorage.setItem('role', response.data.role);
                localStorage.setItem('username', response.data.username);

                // Điều hướng dựa trên role trả về từ API
                if (response.data.role === 'Ch?' && role === 'Owner') {
                    navigate('/admin-dashboard');
                } else if (response.data.role === 'Nhân viên' && role === 'Staff') {
                    navigate('/pos');
                } else {
                    setErrorMessage('Quyền truy cập không phù hợp.');
                }
            } else {
                setErrorMessage('Lỗi đăng nhập, vui lòng thử lại.');
            }
        } catch (error) {
            setErrorMessage('Tên đăng nhập hoặc mật khẩu không đúng.');
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
