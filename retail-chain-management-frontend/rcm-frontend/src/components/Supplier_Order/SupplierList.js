import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaSearch, FaPlusCircle } from "react-icons/fa";
import Header from "../../headerComponent/header";

const SupplierList = () => {
    const [suppliers, setSuppliers] = useState([]);
    const [filteredSuppliers, setFilteredSuppliers] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const suppliersPerPage = 10; // 🔥 Giới hạn 10 nhà cung cấp trên mỗi trang
    const navigate = useNavigate();

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
        if (!suppliers || suppliers.length === 0) return;

        const filtered = suppliers.filter(supplier =>
            supplier.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.contactPerson?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplier.phone?.includes(searchTerm) ||
            supplier.taxCode?.includes(searchTerm) ||
            supplier.email?.toLowerCase().includes(searchTerm) ||
            supplier.address?.toLowerCase().includes(searchTerm)
        );

        setFilteredSuppliers(filtered);
        setCurrentPage(1); // 🔥 Reset về trang đầu khi tìm kiếm
    }, [searchTerm, suppliers]);

    // 🔥 Xử lý phân trang
    const totalPages = Math.ceil(filteredSuppliers.length / suppliersPerPage);
    const indexOfLastSupplier = currentPage * suppliersPerPage;
    const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage;
    const currentSuppliers = filteredSuppliers.slice(indexOfFirstSupplier, indexOfLastSupplier);

    return (
        <div>
            <Header/>
            <div className="container mt-4">
            <h2 className="mb-4 text-center">
                📋 Danh Sách Nhà Cung Cấp
            </h2>

            {/* Ô tìm kiếm */}
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

            {/* Hiển thị dữ liệu */}
            <div className="table-responsive">
                <table className="table table-bordered table-hover table-striped text-center align-middle">
                    <thead className="table-dark sticky-top">
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
                                    <td>
                                        {supplier.website ? (
                                            <a href={supplier.website} target="_blank" rel="noopener noreferrer">
                                                🌐 Truy cập
                                            </a>
                                        ) : "N/A"}
                                    </td>
                                    <td>{supplier.email || "N/A"}</td>
                                    <td>{supplier.phone || "N/A"}</td>
                                    <td>{supplier.fax || "N/A"}</td>
                                    <td>{supplier.address || "N/A"}</td>
                                    <td>{supplier.contactPerson || "N/A"}</td>
                                    <td>{supplier.r_Phone || "N/A"}</td>
                                    <td>
                                        <button
                                            className="btn btn-sm btn-warning me-2"
                                            onClick={() => navigate(`/editsupplier/${supplier.suppliersId}`)}
                                        >
                                            <FaEdit /> Sửa
                                        </button>

                                        <button
                                            className="btn btn-sm btn-info"
                                            onClick={() => navigate(`/supplierproducts/${supplier.suppliersId}`)}
                                        >
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

            {/* 🔥 Thanh phân trang */}
            <div className="d-flex justify-content-center mt-4">
                <button
                    className="btn btn-primary me-2"
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                >
                    « Trang trước
                </button>

                <span className="align-self-center">
                    Trang {currentPage} / {totalPages}
                </span>

                <button
                    className="btn btn-primary ms-2"
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                >
                    Trang sau »
                </button>
            </div>

            {/* Nút "Thêm mới" */}
            <button type="button" className="btn btn-success mt-3" onClick={() => navigate("/AddSupplier")}>
                <FaPlusCircle /> Thêm mới
            </button>
        </div>
        </div>
    );
};

export default SupplierList;
