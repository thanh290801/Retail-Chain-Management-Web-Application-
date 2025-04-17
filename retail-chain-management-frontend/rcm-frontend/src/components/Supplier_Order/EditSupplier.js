import React, { useEffect, useState } from "react";
import axios from "axios";

const EditSupplierComponent = ({ supplier, onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({ ...supplier });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Cập nhật lại dữ liệu nếu supplier prop thay đổi
    useEffect(() => {
        if (supplier) {
            setFormData({ ...supplier });
        }
    }, [supplier]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleUpdate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const response = await axios.put(
                `https://localhost:5000/api/supplier/${formData.suppliersId}`,
                formData,
                { headers: { "Content-Type": "application/json" } }
            );

            alert("✅ Cập nhật nhà cung cấp thành công!");
            if (onSuccess) onSuccess(response.data); // cập nhật danh sách
        } catch (err) {
            console.error("❌ Lỗi khi cập nhật:", err);
            setError("Có lỗi xảy ra khi cập nhật. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    if (!formData) return <p className="text-center text-muted">Không có dữ liệu để chỉnh sửa</p>;

    return (
        <form onSubmit={handleUpdate}>
            {error && <p className="text-danger">{error}</p>}

            <div className="row">
                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Tên nhà cung cấp</label>
                        <input
                            type="text"
                            name="name"
                            className="form-control"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Mã số thuế</label>
                        <input
                            type="text"
                            name="taxCode"
                            className="form-control"
                            value={formData.taxCode}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Website</label>
                        <input
                            type="text"
                            name="website"
                            className="form-control"
                            value={formData.website}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Email</label>
                        <input
                            type="email"
                            name="email"
                            className="form-control"
                            value={formData.email}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Số điện thoại</label>
                        <input
                            type="text"
                            name="phone"
                            className="form-control"
                            value={formData.phone}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Fax</label>
                        <input
                            type="text"
                            name="fax"
                            className="form-control"
                            value={formData.fax}
                            onChange={handleChange}
                        />
                    </div>
                </div>

                <div className="col-md-6">
                    <div className="mb-3">
                        <label className="form-label fw-bold">Địa chỉ</label>
                        <input
                            type="text"
                            name="address"
                            className="form-control"
                            value={formData.address}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <h5 className="mt-4">👤 Thông tin người đại diện</h5>

                    <div className="mb-3">
                        <label className="form-label fw-bold">Tên người đại diện</label>
                        <input
                            type="text"
                            name="contactPerson"
                            className="form-control"
                            value={formData.contactPerson}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-bold">SĐT người đại diện</label>
                        <input
                            type="text"
                            name="rPhone"
                            className="form-control"
                            value={formData.rPhone}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            <div className="text-end mt-4 d-flex justify-content-end gap-2">
                <button type="button" className="btn btn-secondary" onClick={onCancel}>
                    Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
            </div>
        </form>
    );
};

export default EditSupplierComponent;
