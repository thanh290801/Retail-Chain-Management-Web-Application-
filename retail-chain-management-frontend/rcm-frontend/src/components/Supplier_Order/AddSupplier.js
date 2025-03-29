import { useState } from "react";
import { Form, Button, Container, Row, Col } from "react-bootstrap";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const CreateSupplierForm = () => {
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
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        console.log("🔹 Dữ liệu gửi lên API:", formData); // 🟢 Kiểm tra dữ liệu trước khi gửi

        try {
            const response = await axios.post("https://localhost:5000/api/Supplier", formData, {
                headers: { "Content-Type": "application/json" },
            });
            alert("Nhà cung cấp đã được thêm thành công!");
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
            navigate('/supplierlist');
        } catch (err) {
            console.error("❌ Lỗi API:", err.response?.data || err.message); // 🔴 Log lỗi cụ thể
            setError("Có lỗi xảy ra khi thêm nhà cung cấp. Vui lòng thử lại!");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container className="mt-4">
            <Row className="justify-content-md-center">
                <Col md={8}>
                    <h2 className="mb-4">📝 Thêm mới Nhà cung cấp</h2>

                    {error && <p className="text-danger">{error}</p>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên nhà cung cấp</Form.Label>
                            <Form.Control type="text" placeholder="Nhập tên nhà cung cấp" name="Name" value={formData.Name} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Mã số thuế</Form.Label>
                            <Form.Control type="text" placeholder="Nhập mã số thuế" name="TaxCode" value={formData.TaxCode} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Website</Form.Label>
                            <Form.Control type="text" placeholder="Nhập địa chỉ website" name="Website" value={formData.Website} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control type="email" placeholder="Nhập email liên hệ" name="Email" value={formData.Email} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control type="text" placeholder="Nhập số điện thoại" name="Phone" value={formData.Phone} onChange={handleChange} required />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số Fax</Form.Label>
                            <Form.Control type="text" placeholder="Nhập số Fax (nếu có)" name="Fax" value={formData.Fax} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Địa chỉ chi tiết</Form.Label>
                            <Form.Control type="text" placeholder="Nhập địa chỉ chi tiết" name="Address" value={formData.Address} onChange={handleChange} />
                        </Form.Group>
                        <h4 className="mt-4">👤 Thông tin người đại diện</h4>
                        <Form.Group className="mb-3">
                            <Form.Label>Tên người đại diện</Form.Label>
                            <Form.Control type="text" placeholder="Nhập tên người đại diện" name="ContactPerson" value={formData.ContactPerson} onChange={handleChange} />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Số điện thoại</Form.Label>
                            <Form.Control type="text" placeholder="Nhập số điện thoại người đại diện" name="RPhone" value={formData.RPhone} onChange={handleChange} />
                        </Form.Group>
                        <td>
                            <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                                {loading ? "Đang thêm..." : "Thêm mới"}
                            </Button>

                        </td>
                        <td><button type="button" className="btn btn-secondary ms-2" onClick={() => navigate("/supplierlist")}>
                            ⬅️ Quay lại
                        </button></td>
                        
                        
                                                                     
                    </Form>
                </Col>
            </Row>
        </Container>
    );
};

export default CreateSupplierForm;
