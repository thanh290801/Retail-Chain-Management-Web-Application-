import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

    const handleLogout = () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        window.location.href = "/login";
    };

    const dropdownMenu = (items) => (
        <div className="absolute bg-white shadow-lg rounded-lg py-2 px-2 z-50 space-y-1 w-80">
            {items.map(({ to, label }, idx) => (
                <Link
                    key={idx}
                    to={to}
                    className="block px-4 py-2 hover:bg-gray-100 rounded-md no-underline text-gray-800 text-[16px] font-medium transition duration-150"
                >
                    {label}
                </Link>
            ))}
        </div>
    );

    return (
        <header className="bg-white shadow-md">
            <div className="flex items-center justify-between px-8 py-2 bg-blue-600">
                <div className="flex items-center space-x-6">
                    <button>
                        <h1 className="text-3xl font-bold text-white tracking-wide" onClick={() => navigate("/revenue-summary-owner")}>RCM</h1>
                    </button>
                    <nav className="flex space-x-4 text-[16px] font-medium">

                        {/* <button onClick={() => navigate("/revenue-summary-owner")} className="text-white font-bold hover:underline">
              Tổng quan
            </button> */}

                        {/* Sản phẩm & Nhập hàng */}
                        {/* <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('products')}
                        >
                            <span className="text-white font-bold">a</span>
                            {activeDropdown === 'products' &&
                                dropdownMenu([
                                    { to: "/listallproduct", label: "Danh sách hàng hóa" },
                                    { to: "/ownerproductstock", label: "Tồn kho sản phẩm" },
                                    { to: "/createpurchaseorder", label: "Đặt hàng từ nhà cung cấp" },
                                    { to: "/ownerorderlist", label: "Đơn hàng nhập kho" }
                                ])
                            }
                        </div> */}

                        {/* Điều phối kho */}
                        <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('warehouse')}
                        >
                            <span className="text-white font-bold">Quản lý kho</span>
                            {activeDropdown === 'warehouse' &&
                                dropdownMenu([
                                    { to: "/listallproduct", label: "Danh sách hàng hóa" },
                                    { to: "/ownerproductstock", label: "Tồn kho sản phẩm" },
                                    { to: "/warehousetransfer", label: "Điều chuyển hàng hóa" },
                                    { to: "/warehouse-transfers-history", label: "Lịch sử điều chuyển hàng hóa" },
                                    { to: "/inventoryhistory", label: "Lịch sử kiểm kho" },
                                    { to: "/ownerorderlist", label: "Quản lý nhập hàng" },
                                ])
                            }
                        </div>

                        {/* Bán hàng & Trả hàng */}
                        <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('sales')}
                        >
                            <span className="text-white font-bold">Lịch sử bán lẻ</span>
                            {activeDropdown === 'sales' &&
                                dropdownMenu([
                                    { to: "/order-list", label: "Danh sách hóa đơn bán hàng" },
                                    { to: "/refundlist", label: "Danh sách phiếu trả hàng" },
                                    // { to: "/button4", label: "Phiếu hoàn nhập kho" }
                                ])
                            }
                        </div>

                        {/* Đối tác */}
                        <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('partners')}
                        >
                            <span className="text-white font-bold">Đối tác cung ứng</span>
                            {activeDropdown === 'partners' &&
                                dropdownMenu([
                                    { to: "/supplierlist", label: "Danh sách nhà cung cấp" },
                                    { to: "/createpurchaseorder", label: "Đặt hàng từ nhà cung cấp" },
                                ])
                            }
                        </div>

                        {/* Nhân sự */}
                        <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('employees')}
                        >
                            <span className="text-white font-bold">Nhân sự</span>
                            {activeDropdown === 'employees' &&
                                dropdownMenu([
                                    { to: "/staffmanage", label: "Danh sách nhân viên" },
                                    { to: "/salary", label: "Bảng lương" },
                                    { to: "/attendance", label: "Bảng chấm công" },
                                    { to: "/requests", label: "Yêu cầu làm thêm giờ" }
                                ])
                            }
                        </div>

                        <button onClick={() => navigate("/cashBookOwner")} className="text-white font-bold hover:bg-blue-800 px-3 py-2 rounded transition">
                            Sổ quỹ
                        </button>

                        <button onClick={() => navigate("/financial-report")} className="text-white font-bold hover:bg-blue-800 px-3 py-2 rounded transition">
                            Báo cáo tài chính
                        </button>

                    </nav>
                </div>

                {/* Tài khoản & Chi nhánh */}
                <div className="flex items-center space-x-4">
                    <Link
                        to="/warehouselistdetail"
                        className="block px-4 py-2 hover:bg-gray-100 bg-white no-underline text-black rounded-lg shadow-sm text-[16px] font-bold"
                    >
                        Chi nhánh
                    </Link>

                    <div className="relative" onMouseLeave={closeDropdown}>
                        <button
                            onClick={toggleAccountDropdown}
                            className="flex items-center text-white hover:bg-blue-800 px-3 py-2 rounded transition font-bold text-[16px]"
                        >
                            <span className="material-icons text-[22px] mr-2">account_circle</span>
                            Tài khoản
                        </button>
                        {accountDropdown && (
                            <div className="absolute right-0 bg-white shadow-md rounded-lg p-2 space-y-1 min-w-[200px] z-[9999]">
                                <button
                                    onClick={() => navigate("/profile")}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-800 text-[16px]"
                                >
                                    Thông tin người dùng
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="block w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg text-gray-800 text-[16px]"
                                >
                                    Đăng xuất
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
