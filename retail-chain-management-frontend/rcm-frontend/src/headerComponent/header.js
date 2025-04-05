import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import NotificationDropdown from '../components/NotificationDropdown'; // ✅ Thêm component dropdown thông báo

const Header = () => {
    const [activeDropdown, setActiveDropdown] = useState(null);
    const [accountDropdown, setAccountDropdown] = useState(false);
    const [avatarUrl, setAvatarUrl] = useState(null);
    const navigate = useNavigate();

    const fallbackAvatar =
        "data:image/jpeg;base64,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";

    useEffect(() => {
        const token = localStorage.getItem("token");
        if (!token) {
            navigate("/login");
        } else {
            try {
                const decodedToken = jwtDecode(token);
                const accountId = decodedToken.AccountId;

                fetch(`https://localhost:5000/api/accounts/avatar/${accountId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data && data.avatarUrl) {
                            setAvatarUrl(data.avatarUrl);
                        } else {
                            setAvatarUrl(fallbackAvatar);
                        }
                    })
                    .catch(() => setAvatarUrl(fallbackAvatar));
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
                        {/* Quản lý kho */}
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

                        {/* Các dropdown khác giữ nguyên như bạn đã viết */}

                        <div
                            className="relative p-3 rounded cursor-pointer hover:bg-blue-800 transition duration-150"
                            onMouseLeave={closeDropdown}
                            onClick={() => handleDropdown('sales')}
                        >
                            <span className="text-white font-bold">Lịch sử bán lẻ</span>
                            {activeDropdown === 'sales' &&
                                dropdownMenu([
                                    { to: "/button6", label: "Danh sách hóa đơn bán hàng" },
                                    { to: "/button5", label: "Danh sách phiếu trả hàng" },
                                ])
                            }
                        </div>

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

                {/* Thông báo + Tài khoản */}
                <div className="flex items-center space-x-4">
                    <NotificationDropdown /> {/* ✅ Dropdown thông báo dạng popup */}

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
                            <img
                                src={avatarUrl || fallbackAvatar}
                                alt="Avatar"
                                className="w-8 h-8 rounded-full object-cover mr-2 border-2 border-white"
                            />
                        </button>
                        {accountDropdown && (
                            <div className="absolute right-0 bg-white shadow-md rounded-lg p-2 space-y-1 min-w-[200px]">
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
