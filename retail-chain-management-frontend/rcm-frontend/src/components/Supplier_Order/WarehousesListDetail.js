// WarehousesListDetail.jsx
import React, { useEffect, useState } from "react";
import axios from "axios";
import { Button, Modal, Form } from "react-bootstrap";

const WarehousesListDetail = () => {
    const [warehouses, setWarehouses] = useState([]);
    const [selectedWarehouse, setSelectedWarehouse] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const fetchWarehouses = () => {
        axios.get("https://localhost:5000/api/Warehouses")
            .then(res => setWarehouses(res.data))
            .catch(err => console.error("Lỗi khi tải danh sách kho:", err));
    };

    useEffect(() => {
        fetchWarehouses();
    }, []);

    const handleEdit = (warehouse) => {
        setSelectedWarehouse({ ...warehouse });
        setShowModal(true);
    };

    const handleSave = () => {
        if (!selectedWarehouse) return;

        axios.put(`https://localhost:5000/api/Warehouses/${selectedWarehouse.warehousesId}`, {
            name: selectedWarehouse.name,
            address: selectedWarehouse.address,
            capacity: selectedWarehouse.capacity
        })
            .then(() => {
                alert("Cập nhật kho thành công");
                setShowModal(false);
                fetchWarehouses();
            })
            .catch(err => {
                console.error("Lỗi khi cập nhật kho:", err);
                alert("Cập nhật kho thất bại");
            });
    };

    return (
        <div className="container mt-4">
            <h2 className="mb-4">🏬 Danh sách kho hàng</h2>
            <table className="table table-bordered">
                <thead>
                    <tr>
                        <th>Tên kho</th>
                        <th>Địa chỉ</th>
                        <th>Dung tích</th>
                        <th>Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {warehouses.map((w) => (
                        <tr key={w.warehousesId}>
                            <td>{w.name}</td>
                            <td>{w.address}</td>
                            <td>{w.capacity}</td>
                            <td>
                                <Button variant="warning" onClick={() => handleEdit(w)}>
                                    ✏️ Sửa
                                </Button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Chỉnh sửa kho</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedWarehouse && (
                        <Form>
                            <Form.Group className="mb-3">
                                <Form.Label>Tên kho</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedWarehouse.name}
                                    onChange={(e) => setSelectedWarehouse(prev => ({ ...prev, name: e.target.value }))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Địa chỉ</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={selectedWarehouse.address}
                                    onChange={(e) => setSelectedWarehouse(prev => ({ ...prev, address: e.target.value }))}
                                />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Dung tích</Form.Label>
                                <Form.Control
                                    type="number"
                                    value={selectedWarehouse.capacity}
                                    onChange={(e) => setSelectedWarehouse(prev => ({ ...prev, capacity: parseInt(e.target.value) }))}
                                />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Hủy
                    </Button>
                    <Button variant="success" onClick={handleSave}>
                        📂 Lưu thay đổi
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default WarehousesListDetail;
