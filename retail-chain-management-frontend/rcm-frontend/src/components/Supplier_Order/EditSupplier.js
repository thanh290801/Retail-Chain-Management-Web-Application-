import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const EditSupplier = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    // State lưu thông tin nhà cung cấp
    const [supplier, setSupplier] = useState({
        name: "",
        taxCode: "",
        website: "",
        email: "",
        phone: "",
        fax: "",
        address: "",
        contactPerson: "",
        r_Phone: ""
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Gọi API lấy thông tin nhà cung cấp khi component mount
    useEffect(() => {
        axios.get(`https://localhost:5000/api/supplier/${id}`)
            .then(response => {
                setSupplier(response.data);
                setLoading(false);
            })
            .catch(error => {
                console.error("❌ Lỗi khi tải dữ liệu nhà cung cấp:", error);
                setError("Không thể tải dữ liệu.");
                setLoading(false);
            });
    }, [id]);

    // Hàm cập nhật giá trị trong form
    const handleChange = (e) => {
        const { name, value } = e.target;
        setSupplier(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // Hàm xử lý khi nhấn "Lưu thay đổi"
    const handleUpdate = async (e) => {
        e.preventDefault();

        console.log("📤 Dữ liệu gửi lên API:", JSON.stringify(supplier, null, 2)); // 🟢 Debug dữ liệu gửi đi

        try {
            await axios.put(`https://localhost:5000/api/supplier/${id}`, supplier);
            alert("✅ Cập nhật thành công!");
            navigate("/SupplierList");
        } catch (error) {
            console.error("❌ Lỗi khi cập nhật nhà cung cấp:", error.response?.data || error);
            alert("⚠️ Cập nhật thất bại!");
        }
    };


    return (
        <div className="container mt-4">
            <h2 className="mb-4 text-center">✏️ Chỉnh sửa nhà cung cấp</h2>

            {loading ? (
                <p className="text-primary text-center">⏳ Đang tải dữ liệu...</p>
            ) : error ? (
                <p className="text-danger text-center">{error}</p>
            ) : (
                <form onSubmit={handleUpdate}>
                    <div className="row">
                        {/* Cột 1 */}
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Tên nhà cung cấp</label>
                                <input type="text" name="name" className="form-control" value={supplier.name} onChange={handleChange} required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Mã số thuế</label>
                                <input type="text" name="taxCode" className="form-control" value={supplier.taxCode} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Website</label>
                                <input type="text" name="website" className="form-control" value={supplier.website} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Email</label>
                                <input type="email" name="email" className="form-control" value={supplier.email} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Số điện thoại</label>
                                <input type="text" name="phone" className="form-control" value={supplier.phone} onChange={handleChange} required />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Số Fax</label>
                                <input type="text" name="fax" className="form-control" value={supplier.fax} onChange={handleChange} />
                            </div>
                        </div>

                        {/* Cột 2 */}
                        <div className="col-md-6">
                            <div className="mb-3">
                                <label className="form-label fw-bold">Địa chỉ</label>
                                <input type="text" name="address" className="form-control" value={supplier.address} onChange={handleChange} required />
                            </div>

                            <h4 className="mt-4">👤 Thông tin người đại diện</h4>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Tên người đại diện</label>
                                <input type="text" name="contactPerson" className="form-control" value={supplier.contactPerson} onChange={handleChange} />
                            </div>

                            <div className="mb-3">
                                <label className="form-label fw-bold">Số điện thoại người đại diện</label>
                                <input type="text" name="r_Phone" className="form-control" value={supplier.r_Phone} onChange={handleChange} />
                            </div>
                        </div>
                    </div>

                    {/* Nút lưu & quay lại */}
                    <div className="text-center mt-4">
                        <button type="submit" className="btn btn-success px-4">💾 Lưu thay đổi</button>
                        <button type="button" className="btn btn-secondary ms-3 px-4" onClick={() => navigate("/SupplierList")}>
                            ⬅️ Quay lại
                        </button>
                    </div>
                </form>
            )}
        </div>
    );
};

export default EditSupplier;
