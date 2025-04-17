import React, { useEffect, useState } from "react";
import axios from "axios";
import { jwtDecode } from "jwt-decode";
import { useNavigate } from "react-router-dom";

const UserProfile = () => {
    const [employee, setEmployee] = useState(null);
    const [role, setRole] = useState(true);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [isEditing, setIsEditing] = useState(false); // 👈 Chế độ chỉnh sửa
    const [editData, setEditData] = useState({});
    const navigate = useNavigate();
    const api_url = process.env.REACT_APP_API_URL;

    useEffect(() => {
        const fetchEmployeeData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Bạn chưa đăng nhập.");
                    setLoading(false);
                    return;
                }

                const decodedToken = jwtDecode(token);
                const response = await axios.get(`${api_url}/employees/profile`, {
                    headers: { Authorization: `Bearer ${token}` },
                });

                setEmployee(response.data);
                setEditData(response.data); // 👈 Khởi tạo dữ liệu chỉnh sửa
            } catch (err) {
                setError("Không thể tải dữ liệu nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        const fetchRoleData = async () => {
            try {
                const token = localStorage.getItem("token");
                if (!token) {
                    setError("Bạn chưa đăng nhập.");
                    setLoading(false);
                    return;
                }
                const response = await axios.get(`${api_url}/Account/me`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setRole(response.data.role);
            } catch (err) {
                setError("Không thể tải dữ liệu nhân viên.");
            } finally {
                setLoading(false);
            }
        };

        fetchRoleData();
        fetchEmployeeData();
    }, []);

    const handleEditChange = (e) => {
        const { name, value } = e.target;
        setEditData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const token = localStorage.getItem("token");
            const res = await axios.put(`${api_url}/employees/update-profile`, editData, {
                headers: { Authorization: `Bearer ${token}` },
            });
            alert("Cập nhật thông tin thành công!");
            setEmployee(editData);
            setIsEditing(false);
        } catch (err) {
            console.error(err);
            alert("Lỗi khi cập nhật thông tin.");
        }
    };

    if (loading) return <p>Đang tải...</p>;
    if (error) return <p className="text-red-500">{error}</p>;
    if (!employee) return <p>Không tìm thấy nhân viên.</p>;

    return (
        <div className="max-w-lg mx-auto bg-white shadow-md rounded-lg p-6">
            <button
                onClick={() => navigate(role === "Owner" ? "/revenue-summary-owner" : "/staffHome")}
                className="px-4 py-2 bg-gray-400 text-white rounded-lg font-semibold shadow-md"
            >
                ⬅ Quay lại
            </button>

            <div className="text-center mt-4">
                <img
                    src={employee.profileImage || "https://via.placeholder.com/150"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full mx-auto"
                />
                <h2 className="text-xl font-semibold mt-2">{employee.fullName}</h2>
                <p className="text-gray-600">{employee.branchName || "Chủ sở hữu"}</p>
            </div>

            <div className="mt-4 space-y-3">
                {/* Họ và tên */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Họ và tên:</span>
                    {isEditing ? (
                        <input
                            type="text"
                            name="fullName"
                            value={editData.fullName || ""}
                            onChange={handleEditChange}
                            className="border px-2 rounded"
                        />
                    ) : (
                        <span>{employee.fullName}</span>
                    )}
                </div>

                {/* Số điện thoại */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Số điện thoại:</span>
                    {isEditing ? (
                        <input
                            type="text"
                            name="phone"
                            value={editData.phone || ""}
                            onChange={handleEditChange}
                            className="border px-2 rounded"
                        />
                    ) : (
                        <span>{employee.phone}</span>
                    )}
                </div>

                {/* Giới tính */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Giới tính:</span>
                    {isEditing ? (
                        <select
                            name="gender"
                            value={editData.gender || ""}
                            onChange={handleEditChange}
                            className="border px-2 rounded"
                        >
                            <option value="">Chọn giới tính</option>
                            <option value="Male">Nam</option>
                            <option value="Female">Nữ</option>
                            <option value="Other">Khác</option>
                        </select>
                    ) : (
                        <span>
                            {employee.gender === "Female"
                                ? "Nữ"
                                : employee.gender === "Male"
                                ? "Nam"
                                : "Khác"}
                        </span>
                    )}
                </div>

                {/* Ngày sinh */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Ngày sinh:</span>
                    {isEditing ? (
                        <input
                            type="date"
                            name="birthDate"
                            value={editData.birthDate?.split("T")[0] || ""}
                            onChange={handleEditChange}
                            className="border px-2 rounded"
                        />
                    ) : (
                        <span>{new Date(employee.birthDate).toLocaleDateString()}</span>
                    )}
                </div>

                {/* Quê quán */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Quê quán:</span>
                    {isEditing ? (
                        <input
                            type="text"
                            name="hometown"
                            value={editData.hometown || ""}
                            onChange={handleEditChange}
                            className="border px-2 rounded"
                        />
                    ) : (
                        <span>{employee.hometown}</span>
                    )}
                </div>

                {/* Các thông tin khác không chỉnh sửa */}
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">CMND/CCCD:</span>
                    <span>{employee.identityNumber}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Lương cố định:</span>
                    <span>
                        {employee.fixedSalary !== undefined
                            ? employee.fixedSalary.toLocaleString() + " VND"
                            : "Chưa cập nhật"}
                    </span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Ngày bắt đầu:</span>
                    <span>{new Date(employee.startDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between border-b py-2">
                    <span className="font-medium">Trạng thái:</span>
                    <span className={employee.isActive ? "text-green-600" : "text-red-600"}>
                        {employee.isActive ? "Đang làm việc" : "Đã nghỉ"}
                    </span>
                </div>
            </div>

            {/* Nút chỉnh sửa / lưu */}
            <div className="mt-6 text-center space-x-3">
                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="px-4 py-2 bg-yellow-500 text-white rounded"
                    >
                        ✏️ Chỉnh sửa thông tin
                    </button>
                ) : (
                    <>
                        <button
                            onClick={handleSave}
                            className="px-4 py-2 bg-green-600 text-white rounded"
                        >
                            💾 Lưu
                        </button>
                        <button
                            onClick={() => {
                                setIsEditing(false);
                                setEditData(employee); // Reset lại dữ liệu nếu hủy
                            }}
                            className="px-4 py-2 bg-gray-500 text-white rounded"
                        >
                            ❌ Hủy
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default UserProfile;
