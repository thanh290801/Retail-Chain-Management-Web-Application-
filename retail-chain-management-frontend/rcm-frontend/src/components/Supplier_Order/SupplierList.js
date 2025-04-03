import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaSearch, FaPlusCircle } from "react-icons/fa";
import Header from "../../headerComponent/header";
import CreateSupplierForm from "./AddSupplier";
import EditSupplier from "./EditSupplier";

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [showModal, setShowModal] = useState(false); // Thêm mới
    const [editSupplier, setEditSupplier] = useState(null); // Sửa
    const suppliersPerPage = 10;
    const navigate = useNavigate();

    // 🔒 Khóa scroll nền khi modal mở
    useEffect(() => {
        if (showModal || editSupplier) {
            document.body.classList.add('overflow-hidden');
        } else {
            document.body.classList.remove('overflow-hidden');
        }
        return () => document.body.classList.remove('overflow-hidden');
    }, [showModal, editSupplier]);

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get("https://localhost:5000/api/supplier");
            setSuppliers(response.data);
            setFilteredSuppliers(response.data);
        } catch (error) {
            console.error("❌ Lỗi API:", error);
        }
    };

    useEffect(() => {
        const filtered = suppliers.filter(supplier =>
            supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.phone?.includes(searchTerm) ||
            supplier.taxCode?.includes(searchTerm) ||
            supplier.email?.toLowerCase().includes(searchTerm) ||
            supplier.address?.toLowerCase().includes(searchTerm)
        );
        setFilteredSuppliers(filtered);
        setCurrentPage(1);
    }, [searchTerm, suppliers]);

    const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);
    const indexOfLastSupplier = currentPage * suppliersPerPage;
    const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstSupplier, indexOfLastSupplier);

    // ✅ Thêm mới thành công
    const handleAddSupplierSuccess = (newSupplier) => {
        setSuppliers([newSupplier, ...suppliers]);
        setShowModal(false);
    };

    // ✅ Cập nhật sau khi sửa
    const handleUpdateSupplierSuccess = (updatedSupplier) => {
        const updatedList = suppliers.map((s) =>
            s.suppliersId === updatedSupplier.suppliersId ? updatedSupplier : s
        );
        setSuppliers(updatedList);
        setEditSupplier(null);
    };

    return (
        <div>
            <Header />
            <div className="container mt-4">
                <h2 className="mb-4 text-center">📋 Danh Sách Nhà Cung Cấp</h2>

                {/* Tìm kiếm */}
                <div className="input-group mb-4">
                    <span className="input-group-text"><FaSearch /></span>
                    <input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="form-control"
                        placeholder="Nhập tên, người đại diện, MST, SĐT hoặc địa chỉ..."
                    />
                </div>

                {/* Modal Thêm */}
                {showModal && (
                    <div className="fixed inset-0 z-50 bg-white bg-opacity-50 overflow-y-auto" onClick={() => setShowModal(false)}>
                        <div className="min-h-screen flex items-center justify-center px-4 py-8">
                            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
                                    <h2 className="text-xl font-bold">➕ Thêm Nhà Cung Cấp</h2>
                                    <button className="text-gray-500 hover:text-red-600 text-xl" onClick={() => setShowModal(false)}>✕</button>
                                </div>
                                <CreateSupplierForm
                                    onSuccess={handleAddSupplierSuccess}
                                    onCancel={() => setShowModal(false)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Modal Sửa */}
                {editSupplier && (
                    <div className="fixed inset-0 z-50 bg-white bg-opacity-50 overflow-y-auto" onClick={() => setEditSupplier(null)}>
                        <div className="min-h-screen flex items-center justify-center px-4 py-8">
                            <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
                                    <h2 className="text-xl font-bold">✏️ Chỉnh sửa Nhà Cung Cấp</h2>
                                    <button className="text-gray-500 hover:text-red-600 text-xl" onClick={() => setEditSupplier(null)}>✕</button>
                                </div>
                                <EditSupplier
                                    supplier={editSupplier}
                                    onSuccess={handleUpdateSupplierSuccess}
                                    onCancel={() => setEditSupplier(null)}
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Bảng danh sách */}
                <div className="table-responsive">
                    <table className="table table-bordered table-hover table-striped text-center align-middle">
                        <thead className="table-dark">
                            <tr>
                                <th>STT</th>
                                <th>Tên nhà cung cấp</th>
                                <th>Mã số Thuế</th>
                                <th>Website</th>
                                <th>Email</th>
                                <th>SĐT</th>
                                <th>Fax</th>
                                <th>Địa chỉ</th>
                                <th>Người đại diện</th>
                                <th>SDT đại diện</th>
                                <th>Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentSuppliers.length > 0 ? (
                                currentSuppliers.map((supplier, index) => (
                                    <tr key={supplier.suppliersId}>
                                        <td className="fw-bold">{indexOfFirstSupplier + index + 1}</td>
                                        <td>{supplier.name || "N/A"}</td>
                                        <td>{supplier.taxCode || "N/A"}</td>
                                        <td>{supplier.website ? <a href={supplier.website} target="_blank" rel="noopener noreferrer">🌐 Truy cập</a> : "N/A"}</td>
                                        <td>{supplier.email || "N/A"}</td>
                                        <td>{supplier.phone || "N/A"}</td>
                                        <td>{supplier.fax || "N/A"}</td>
                                        <td>{supplier.address || "N/A"}</td>
                                        <td>{supplier.contactPerson || "N/A"}</td>
                                        <td>{supplier.r_Phone || "N/A"}</td>
                                        <td>
                                            <button className="btn btn-sm btn-warning me-2" onClick={() => setEditSupplier(supplier)}>
                                                <FaEdit /> Sửa
                                            </button>
                                            <button className="btn btn-sm btn-info" onClick={() => navigate(`/supplierproducts/${supplier.suppliersId}`)}>
                                                📦 Xem sản phẩm
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="11" className="text-center text-muted">Không tìm thấy kết quả</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Phân trang */}
                <div className="d-flex justify-content-center mt-4">
                    <button className="btn btn-primary me-2" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                        « Trang trước
                    </button>
                    <span className="align-self-center">Trang {currentPage} / {totalPages}</span>
                    <button className="btn btn-primary ms-2" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                        Trang sau »
                    </button>
                </div>

                {/* Nút Thêm mới */}
                <button type="button" className="btn btn-success mt-3" onClick={() => setShowModal(true)}>
                    <FaPlusCircle /> Thêm mới
                </button>
            </div>
        </div>
    );
};

export default SupplierList;
