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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleCheckTaxCode = async () => {
        if (!formData.TaxCode) return false;
        try {
            const response = await axios.get(`https://localhost:5000/api/Supplier/check-taxcode`, {
                params: { taxCode: formData.TaxCode },
            });
            if (response.data.exists) {
                setError("⚠️ Mã số thuế đã tồn tại. Vui lòng kiểm tra lại!");
                return true;
            }
        } catch (err) {
            console.error("Lỗi kiểm tra mã số thuế:", err);
        }
        setError("");
        return false;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

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

            const newSupplier = response.data;
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

            if (onSuccess) onSuccess(newSupplier);
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
                            placeholder="Nhập tên nhà cung cấp"
                            name="Name"
                            value={formData.Name}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Mã số thuế</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nhập mã số thuế"
                            name="TaxCode"
                            value={formData.TaxCode}
                            onChange={handleChange}
                            onBlur={handleCheckTaxCode}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Website</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Địa chỉ website"
                            name="Website"
                            value={formData.Website}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Email</Form.Label>
                        <Form.Control
                            type="email"
                            placeholder="Email liên hệ"
                            name="Email"
                            value={formData.Email}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Số điện thoại</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Số điện thoại"
                            name="Phone"
                            value={formData.Phone}
                            onChange={handleChange}
                            required
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Fax</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Số fax (nếu có)"
                            name="Fax"
                            value={formData.Fax}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={12}>
                    <Form.Group className="mb-3">
                        <Form.Label>Địa chỉ</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Nhập địa chỉ"
                            name="Address"
                            value={formData.Address}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>Người đại diện</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="Tên người đại diện"
                            name="ContactPerson"
                            value={formData.ContactPerson}
                            onChange={handleChange}
                        />
                    </Form.Group>
                </Col>

                <Col md={6}>
                    <Form.Group className="mb-3">
                        <Form.Label>SDT người đại diện</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="SĐT người đại diện"
                            name="RPhone"
                            value={formData.RPhone}
                            onChange={handleChange}
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
