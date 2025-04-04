import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Header from "../../headerComponent/header";
import * as XLSX from 'xlsx';
import { saveAs } from 'file-saver';

const FinancialReport = () => {
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [branchId, setBranchId] = useState(0);
    const [branches, setBranches] = useState([]);
    const [report, setReport] = useState(null);

    useEffect(() => {
        fetchBranches();
    }, []);
    const exportToExcel = () => {
        const wb = XLSX.utils.book_new();

        const sheetData = [];
        const branchName = branchId === 0
            ? "Toàn bộ chuỗi"
            : (branches.find(b => b.id === branchId)?.name || "Chi nhánh không xác định");

        // 1. Tiêu đề & thông tin chung
        sheetData.push(["BÁO CÁO TÀI CHÍNH TỔNG HỢP"]);
        sheetData.push([]);
        sheetData.push(["Tên cửa hàng:", "Tạp Hóa RCM"]);
        sheetData.push(["Chi nhánh:", branchName]);

        sheetData.push(["Kỳ báo cáo:", `Tháng ${month.toString().padStart(2, '0')}/${year}`]);
        sheetData.push([]);

        // 2. Doanh thu POS
        sheetData.push(["1. Doanh thu bán hàng (POS)"]);
        sheetData.push(["Tổng đơn hàng", "Tiền mặt", "Chuyển khoản", "Tổng doanh thu"]);
        sheetData.push([
            report.totalOrders,
            report.totalCash,
            report.totalBank,
            report.totalRevenue
        ]);
        sheetData.push([]);

        // 3. Hoàn tiền
        sheetData.push(["2. Hoàn tiền / trả hàng"]);
        sheetData.push(["Số đơn", "Tiền hoàn"]);
        sheetData.push([
            report.totalRefunds,
            report.totalRefundAmount
        ]);
        sheetData.push([]);

        // 4. Chi phí nhân sự
        sheetData.push(["3. Chi phí nhân sự"]);
        sheetData.push(["Tên nhân viên", "Chức vụ", "Tổng lương"]);
        report.salaries.forEach(s =>
            sheetData.push([s.name, s.position, s.totalSalary])
        );
        sheetData.push(["Tổng", "", report.totalSalary]);
        sheetData.push([]);

        // 5. Chi phí nhập hàng
        sheetData.push(["4. Chi phí nhập hàng"]);
        sheetData.push(["Tổng chi phí nhập hàng", report.totalPurchaseCost]);
        sheetData.push([]);

        // 6. Lợi nhuận gộp
        sheetData.push(["5. Lợi nhuận gộp"]);
        sheetData.push(["Doanh thu", report.totalRevenue]);
        sheetData.push(["Hoàn tiền", -report.totalRefundAmount]);
        sheetData.push(["Chi phí nhân sự", -report.totalSalary]);
        sheetData.push(["Chi phí nhập hàng", -report.totalPurchaseCost]);
        sheetData.push(["Lợi nhuận tạm tính", report.estimatedProfit]);

        // Tạo sheet
        const ws = XLSX.utils.aoa_to_sheet(sheetData);
        ws['!cols'] = [
            { wch: 35 }, // Cột 1: tiêu đề
            { wch: 30 }, // Cột 2: nội dung dài
            { wch: 20 },
            { wch: 20 },
        ];
        const boldRows = [0, 7, 10, 14, 24, 26]; // Chỉ số dòng của các đề mục chính

        boldRows.forEach(rowIndex => {
            const row = sheetData[rowIndex];
            for (let colIndex = 0; colIndex < row.length; colIndex++) {
                const cellRef = XLSX.utils.encode_cell({ r: rowIndex, c: colIndex });
                if (!ws[cellRef]) continue;
                ws[cellRef].s = {
                    font: {
                        bold: true,
                        sz: 16,
                    }
                };
            }
        });
        XLSX.utils.book_append_sheet(wb, ws, 'Báo Cáo Tài Chính');

        // Xuất file
        const fileName = `BaoCao_TaiChinh_Thang_${month}_${year}.xlsx`;
        const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        saveAs(new Blob([excelBuffer], { type: 'application/octet-stream' }), fileName);
    };

    useEffect(() => {
        fetchReport();
    }, [month, year, branchId]);

    const fetchBranches = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/FinancialReport/branches');

            setBranches(res.data);
        } catch (err) {
            console.error('Lỗi khi load chi nhánh:', err);
        }
    };

    const fetchReport = async () => {
        try {
            const res = await axios.get('https://localhost:5000/api/FinancialReport/api/financialreport', {
                params: { month, year, branchId }
            });

            setReport(res.data);
        } catch (err) {
            console.error('Lỗi khi load báo cáo:', err);
        }
    };

    const formatCurrency = (val) =>
        val?.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' }) || '0₫';

    return (
        <div>
            <Header />
            <div className="p-6">
                <div className="flex justify-between items-center mb-4">
                    <h1 className="text-2xl font-bold">BÁO CÁO TÀI CHÍNH TỔNG HỢP</h1>
                    <button
                        onClick={exportToExcel}
                        className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                    >
                        Xuất Excel
                    </button>
                </div>

                {/* Bộ lọc */}
                <div className="flex gap-4 mb-6">
                    <select value={month} onChange={e => setMonth(Number(e.target.value))} className="border p-2 rounded">
                        {[...Array(12)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                        ))}
                    </select>

                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="border p-2 rounded">
                        {[2023, 2024, 2025].map(y => (
                            <option key={y} value={y}>Năm {y}</option>
                        ))}
                    </select>

                    <select value={branchId} onChange={e => setBranchId(Number(e.target.value))} className="border p-2 rounded">
                        {branches.map(b => (
                            <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                    </select>
                </div>

                {!report ? (
                    <p>Đang tải báo cáo...</p>
                ) : (
                    <div className="space-y-8">
                        {/* 1. Doanh thu POS */}
                        <section>
                            <h2 className="text-xl font-semibold mb-2">1. Doanh thu bán hàng (POS)</h2>
                            <table className="w-full border-collapse border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border px-3 py-2">Tổng đơn hàng</th>
                                        <th className="border px-3 py-2">Tiền mặt</th>
                                        <th className="border px-3 py-2">Chuyển khoản</th>
                                        <th className="border px-3 py-2">Tổng doanh thu</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border px-3 py-2">{report.totalOrders}</td>
                                        <td className="border px-3 py-2">{formatCurrency(report.totalCash)}</td>
                                        <td className="border px-3 py-2">{formatCurrency(report.totalBank)}</td>
                                        <td className="border px-3 py-2 font-bold">{formatCurrency(report.totalRevenue)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 2. Hoàn tiền */}
                        <section>
                            <h2 className="text-xl font-semibold mb-2">2. Hoàn tiền / trả hàng</h2>
                            <table className="w-full border-collapse border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border px-3 py-2">Số đơn</th>
                                        <th className="border px-3 py-2">Tiền hoàn</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr>
                                        <td className="border px-3 py-2">{report.totalRefunds}</td>
                                        <td className="border px-3 py-2">{formatCurrency(report.totalRefundAmount)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 3. Chi phí nhân sự */}
                        <section>
                            <h2 className="text-xl font-semibold mb-2">3. Chi phí nhân sự</h2>
                            <table className="w-full border-collapse border">
                                <thead className="bg-gray-100">
                                    <tr>
                                        <th className="border px-3 py-2">Nhân viên</th>
                                        <th className="border px-3 py-2">Chức vụ</th>
                                        <th className="border px-3 py-2">Tổng lương</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.salaries.map((s, i) => (
                                        <tr key={i}>
                                            <td className="border px-3 py-2">{s.name}</td>
                                            <td className="border px-3 py-2">{s.position}</td>
                                            <td className="border px-3 py-2">{formatCurrency(s.totalSalary)}</td>
                                        </tr>
                                    ))}
                                    <tr>
                                        <td className="border px-3 py-2 font-bold" colSpan={2}>Tổng</td>
                                        <td className="border px-3 py-2 font-bold">{formatCurrency(report.totalSalary)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 4. Chi phí nhập hàng */}
                        <section>
                            <h2 className="text-xl font-semibold mb-2">4. Chi phí nhập hàng</h2>
                            <table className="w-full border-collapse border">
                                <tbody>
                                    <tr>
                                        <td className="border px-3 py-2">Tổng chi phí nhập hàng</td>
                                        <td className="border px-3 py-2 font-bold">{formatCurrency(report.totalPurchaseCost)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                        {/* 5. Lợi nhuận gộp */}
                        <section>
                            <h2 className="text-xl font-semibold mb-2">5. Lợi nhuận gộp</h2>
                            <table className="w-full border-collapse border">
                                <tbody>
                                    <tr>
                                        <td className="border px-3 py-2">Doanh thu</td>
                                        <td className="border px-3 py-2">{formatCurrency(report.totalRevenue)}</td>
                                    </tr>
                                    <tr>
                                        <td className="border px-3 py-2">Hoàn tiền</td>
                                        <td className="border px-3 py-2">({formatCurrency(report.totalRefundAmount)})</td>
                                    </tr>
                                    <tr>
                                        <td className="border px-3 py-2">Chi phí nhân sự</td>
                                        <td className="border px-3 py-2">({formatCurrency(report.totalSalary)})</td>
                                    </tr>
                                    <tr>
                                        <td className="border px-3 py-2">Chi phí nhập hàng</td>
                                        <td className="border px-3 py-2">({formatCurrency(report.totalPurchaseCost)})</td>
                                    </tr>
                                    <tr>
                                        <td className="border px-3 py-2 font-bold">Lợi nhuận tạm tính</td>
                                        <td className="border px-3 py-2 font-bold">{formatCurrency(report.estimatedProfit)}</td>
                                    </tr>
                                </tbody>
                            </table>
                        </section>

                    </div>
                )}
            </div>
        </div>
    );
};

export default FinancialReport;
