import React, { useState } from 'react';
import { useEffect } from "react";
import { Link } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

const Header = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [branchId, setBranchId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        } else {
            try {
                const decodedToken = jwtDecode(token);
                setBranchId(decodedToken.BranchId);
            } catch (error) {
                console.error("Lỗi khi decode token:", error);
            }
        }
    }, [navigate]);

    const handleDropdown = (dropdownName) => {
        setActiveDropdown(activeDropdown === dropdownName ? null : dropdownName);
    };



    const toggleAccountDropdown = () => {
        setAccountDropdown((prev) => !prev);
    };

    const closeDropdown = () => {
        setActiveDropdown(null);
        setAccountDropdown(false);
    };
    useEffect(() => {

        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        }
    }, [navigate]); // Chạy 1 lần khi Header được render

    const handleLogout = () => {
        // Xóa token khỏi localStorage
        localStorage.removeItem("token");
        localStorage.removeItem("user");

        // Reload lại trang để đảm bảo trạng thái mới
        window.location.href = "/login";
    };



    return (
        <>
            <header className="bg-white shadow-md">
                <div className="flex items-center justify-between p-2 bg-blue-600">
                    <div className="flex items-center space-x-4">
                        <h1 className="text-2xl font-bold text-white">RCM</h1>
                        <nav className="flex space-x-4">
                            <button onClick={() => navigate("/revenue-summary-owner")} className="text-white flex items-center">
                                Tổng quan
                            </button>
                            <div
                                className="relative"
                                onMouseLeave={closeDropdown}>
                                <button onClick={() => handleDropdown('goods')} className="text-white flex items-center">
                                    Hàng hóa
                                </button>
                                {activeDropdown === 'goods' && (
                                    <div className="absolute bg-white shadow-md rounded p-2 z-50">
                                        <Link to={branchId === "0" ? "/ownerproductstock" : "/productstock"} className="block px-4 py-2 hover:bg-gray-200">Danh sách sản phẩm</Link>
                                        <Link to="/button2" className="block px-4 py-2 hover:bg-gray-200">Kiểm kho</Link>
                                        <Link to="/button3" className="block px-4 py-2 hover:bg-gray-200">Nhập hàng</Link>
                                    </div>
                                )}
                            </div>
                            <div
                                className="relative"
                                onMouseLeave={closeDropdown}
                            >
                                <button onClick={() => handleDropdown('transactions')} className="text-white flex items-center">
                                    Giao dịch
                                </button>
                                {activeDropdown === 'transactions' && (
                                    <div className="absolute bg-white shadow-md rounded p-2 z-50">
                                        <Link to="/button6" className="block px-4 py-2 hover:bg-gray-200">Bán hàng</Link>
                                        <Link to="/button5" className="block px-4 py-2 hover:bg-gray-200">Đổi trả hàng</Link>
                                        <Link to="/button4" className="block px-4 py-2 hover:bg-gray-200">Phiếu nhập hàng</Link>
                                    </div>
                                )}
                            </div>
                            <div
                                className="relative"
                                onMouseLeave={closeDropdown}
                            >
                                <button onClick={() => handleDropdown('partners')} className="text-white flex items-center">
                                    Đối tác
                                </button>
                                {activeDropdown === 'partners' && (
                                    <div className="absolute bg-white shadow-md rounded p-2 z-50">
                                        <Link to="/button7" className="block px-4 py-2 hover:bg-gray-200">Nhà cung cấp</Link>
                                        <Link to="/button8" className="block px-4 py-2 hover:bg-gray-200">...</Link>
                                        <Link to="/button9" className="block px-4 py-2 hover:bg-gray-200">...</Link>
                                    </div>
                                )}
                            </div>

                            <div
                                className="relative"
                                onMouseLeave={closeDropdown}
                            >
                                <button onClick={() => handleDropdown('employees')} className="text-white flex items-center">
                                    Nhân viên
                                </button>
                                {activeDropdown === 'employees' && (
                                    <div className="absolute bg-white shadow-md rounded p-2 z-50">
                                        <Link to="/staffmanage" className="block px-4 py-2 hover:bg-gray-200">Danh sách nhân viên</Link>
                                        <Link to="/salary" className="block px-4 py-2 hover:bg-gray-200">Lương</Link>
                                        <Link to="/attendance" className="block px-4 py-2 hover:bg-gray-200">Bảng chấm công</Link>
                                        <Link to="/button12" className="block px-4 py-2 hover:bg-gray-200">Thiết lập lương</Link>
                                        <Link to="/requests" className="block px-4 py-2 hover:bg-gray-200">Danh sách tăng ca</Link>
                                    </div>
                                )}
                            </div>

                            <button onClick={() => navigate("/cashBookOwner")} className="text-white flex items-center">Sổ quỹ </button>
                            <button onClick={() => navigate("/financial-report")} className="text-white flex items-center">Báo cáo tài chính </button>

                        </nav>
                    </div>
                    <div className="flex items-center space-x-4">
                        <button onClick={() => navigate("/pos")} className="bg-white text-blue-600 px-4 py-2 rounded flex items-center">Bán hàng</button>

                        <div
                            className="relative"
                            onMouseLeave={closeDropdown}
                        >
                            <button onClick={toggleAccountDropdown} className="text-white">
                                <span className="material-icons">Menu</span>
                            </button>
                            {accountDropdown && (
                                <div className="absolute right-0 bg-white shadow-md rounded p-2">
                                    <button
                                        onClick={() => navigate("/profile")}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                    >
                                        Thông tin người dùng
                                    </button>

                                    <button
                                        onClick={handleLogout}
                                        className="block w-full text-left px-4 py-2 hover:bg-gray-200"
                                    >
                                        Đăng xuất
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </header>

        </>
    );
};

export default Header;
