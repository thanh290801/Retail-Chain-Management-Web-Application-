import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const LoginPage = () => {
    const [showPassword, setShowPassword] = useState(false);

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-gray-100">
            <div className="bg-white p-8 rounded-2xl shadow-md w-80">
                <h1 className="text-3xl font-bold text-blue-600 text-center mb-6">RCM</h1>

                <div className="mb-4">
                    <input
                        type="text"
                        placeholder="Tên đăng nhập"
                        className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring focus:ring-blue-200"
                    />
                </div>
                <div className="mb-4 relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
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
                    <button className="w-1/2 bg-blue-600 text-white p-3 rounded-md font-semibold hover:bg-blue-700">
                        QUẢN LÝ
                    </button>
                    <button className="w-1/2 bg-green-600 text-white p-3 rounded-md font-semibold hover:bg-green-700">
                        BÁN HÀNG
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LoginPage;
