import { useState } from "react";
import { Form, Button, Row, Col } from "react-bootstrap";
import axios from "axios";

const AddSupplierComponent = ({ onSuccess, onCancel }) => {
    const [formData, setFormData] = useState({
        Name: "",
        TaxCode: "",
        Website: "",
        Email: "",
        Phone: "",
        Fax: "",
        Address: "",
        ContactPerson: "",
        RPhone: "",
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [fieldErrors, setFieldErrors] = useState({});

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setFieldErrors({ ...fieldErrors, [e.target.name]: "" }); // Clear error as user types
    };

    const validateFields = () => {
        const errors = {};
        if (!formData.Name.trim()) errors.Name = "Vui lòng điền vào trường này.";
        if (!formData.Phone.trim()) errors.Phone = "Vui lòng điền vào trường này.";
        if (formData.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.Email)) {
            errors.Email = "Dữ liệu không hợp lệ.";
        }
        setFieldErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleCheckTaxCode = async () => {
        if (!formData.TaxCode) return false;
        try {
            const response = await axios.get(`https://localhost:5000/api/Supplier/check-taxcode`, {
                params: { taxCode: formData.TaxCode },
            });
            if (response.data.exists) {
                setFieldErrors((prev) => ({ ...prev, TaxCode: "⚠️ Mã số thuế đã tồn tại. Vui lòng kiểm tra lại!" }));
                return true;
            }
        } catch (err) {
            console.error("Lỗi kiểm tra mã số thuế:", err);
        }
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setFieldErrors({});

        const isValid = validateFields();
        if (!isValid) {
            setLoading(false);
            return;
        }

        const isDuplicate = await handleCheckTaxCode();
        if (isDuplicate) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.post("https://localhost:5000/api/Supplier", formData, {
                headers: { "Content-Type": "application/json" },
            });

            alert("✅ Thêm nhà cung cấp thành công!");
            setFormData({
                Name: "",
                TaxCode: "",
                Website: "",
                Email: "",
                Phone: "",
                Fax: "",
                Address: "",
                ContactPerson: "",
                RPhone: "",
            });
            if (onSuccess) onSuccess(response.data);
        } catch (err) {
            console.error("❌ Lỗi khi thêm:", err.response?.data || err.message);
            setError("Có lỗi xảy ra khi thêm nhà cung cấp. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form onSubmit={handleSubmit}>
            {error && <p className="text-danger">{error}</p>}
            <Row>
                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Tên nhà cung cấp</Form.Label>
                        <Form.Control
                            type="text"
                            name="Name"
                            value={formData.Name}
                            onChange={handleChange}
                            placeholder="Nhập tên nhà cung cấp"
                        />
                        {fieldErrors.Name && <div className="text-danger">{fieldErrors.Name}</div>}
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Mã số thuế</Form.Label>
                        <Form.Control
                            type="text"
                            name="TaxCode"
                            value={formData.TaxCode}
                            onChange={handleChange}
                            onBlur={handleCheckTaxCode}
                            placeholder="Nhập mã số thuế"
                        />
                        {fieldErrors.TaxCode && <div className="text-danger">{fieldErrors.TaxCode}</div>}
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                            type="text"
                            name="Website"
                            value={formData.Website}
                            onChange={handleChange}
                            placeholder="Địa chỉ website"
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            name="Email"
                            value={formData.Email}
                            onChange={handleChange}
                            placeholder="Email liên hệ"
                        />
                        {fieldErrors.Email && <div className="text-danger">{fieldErrors.Email}</div>}
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control
                            type="text"
                            name="Phone"
                            value={formData.Phone}
                            onChange={handleChange}
                            placeholder="Số điện thoại"
                        />
                        {fieldErrors.Phone && <div className="text-danger">{fieldErrors.Phone}</div>}
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Fax</Form.Label>
                        <Form.Control
                            type="text"
                            name="Fax"
                            value={formData.Fax}
                            onChange={handleChange}
                            placeholder="Số fax (nếu có)"
                        />
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Địa chỉ</Form.Label>
                        <Form.Control
                            type="text"
                            name="Address"
                            value={formData.Address}
                            onChange={handleChange}
                            placeholder="Nhập địa chỉ"
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Người đại diện</Form.Label>
                        <Form.Control
                            type="text"
                            name="ContactPerson"
                            value={formData.ContactPerson}
                            onChange={handleChange}
                            placeholder="Tên người đại diện"
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>SDT người đại diện</Form.Label>
                        <Form.Control
                            type="text"
                            name="RPhone"
                            value={formData.RPhone}
                            onChange={handleChange}
                            placeholder="SĐT người đại diện"
                        />
                    </Form.Group>
                </Col>

                <Col md={12} className="d-flex justify-content-end gap-2 mt-2">
                    <Button type="submit" variant="primary" disabled={loading}>
                        {loading ? "Đang xử lý..." : "Lưu"}
                    </Button>
                    <Button variant="secondary" onClick={onCancel}>Hủy</Button>
                </Col>
            </Row>
        </Form>
    );
};

export default AddSupplierComponent;
