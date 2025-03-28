import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useParams } from "react-router-dom";
import Header from "../../headerComponent/header";
import axios from "axios";

const SalaryForm = () => {
  const { staffId } = useParams();
  const { register, handleSubmit, setValue, watch } = useForm();
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const currentMonth = currentDate.getMonth() + 1;

  const [selectedSalaryFormYear, setSelectedSalaryFormYear] =
    useState(currentYear);
  const [selectedSalaryFormMonth, setSelectedSalaryFormMonth] =
    useState(currentMonth);

  const [fixedSalary, setFixedSalary] = useState(0);
  const [bonusTime, setBonusTime] = useState(0);
  const [WorkDayNumber, setWorkDayNumber] = useState(0);
  const [totalShiftInMonth, setTotalShiftInMonth] = useState(0);
  const [salaryPerShift, setSalaryPerShift] = useState(0);
  const [message, setMessage] = useState("");

  const api_url = process.env.REACT_APP_API_URL;

  const bonusSalary = watch("bonusSalary", 0);
  const penalty = watch("penalty", 0);

  useEffect(() => {
    const calculatedSalaryPerShift = totalShiftInMonth
      ? Math.floor(Number(fixedSalary) / totalShiftInMonth)
      : 0;
    setSalaryPerShift(calculatedSalaryPerShift);

    const finalSalary =
      calculatedSalaryPerShift * Number(WorkDayNumber) +
      Number(bonusSalary || 0) -
      Number(penalty || 0);
    setValue("finalSalary", finalSalary);
  }, [
    fixedSalary,
    bonusSalary,
    penalty,
    WorkDayNumber,
    totalShiftInMonth,
    setValue,
  ]);

  const fetchPayrollData = async () => {
    try {
      let url = `${api_url}/Payroll/getAllPayroll?month=${selectedSalaryFormMonth}&year=${selectedSalaryFormYear}&staffId=${staffId}`;
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) throw new Error(`Lỗi HTTP: ${response.status}`);

      const data = await response.json();
      if (data.length > 0) {
        setFixedSalary(data[0].fixedSalary);
        setBonusTime(data[0].totalOvertimeHours);
        setWorkDayNumber(data[0].totalWorkDays);
        setTotalShiftInMonth(data[0].totalShiftInMonth);
      }
    } catch (err) {
      console.error("Lỗi khi gọi API:", err);
    }
  };

  useEffect(() => {
    fetchPayrollData();
  }, [selectedSalaryFormMonth, selectedSalaryFormYear]);

  const addSalaryRecords = async (salaryData) => {
    try {
      const response = await axios.post(
        `${api_url}/Payroll/add-to-salary-record`,
        salaryData
      );
      setMessage(response.data.Message || "Lưu thành công!");
    } catch (error) {
      setMessage(error.response?.data?.Message || "Lỗi không xác định");
    }
  };

  const onSubmit = (data) => {
    const salaryData = {
      staffId,
      fixedSalary,
      bonusSalary: Number(data.bonusSalary) || 0,
      penaltyAmount: Number(data.penalty) || 0,
      finalSalary: Number(data.finalSalary),
      month: selectedSalaryFormMonth,
      year: selectedSalaryFormYear,
    };
    addSalaryRecords(salaryData);
  };

  return (
    <>
      <Header />
      <div className="max-w-lg mx-auto p-6 bg-white shadow-lg rounded-lg mt-3">
        <h2 className="text-2xl font-bold text-gray-700 mb-4">
          Tính Lương Nhân Viên
        </h2>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-gray-600">Staff ID:</label>
            <input
              value={staffId}
              disabled
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
            />
          </div>

          <select
            value={selectedSalaryFormMonth}
            onChange={(e) =>
              setSelectedSalaryFormMonth(parseInt(e.target.value))
            }
            className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm"
          >
            {[...Array(12)].map((_, idx) => (
              <option key={idx} value={idx + 1}>
                Tháng {idx + 1}
              </option>
            ))}
          </select>

          <select
            value={selectedSalaryFormYear}
            onChange={(e) =>
              setSelectedSalaryFormYear(parseInt(e.target.value))
            }
            className="border border-gray-300 p-2 rounded w-32 text-center shadow-sm mx-5"
          >
            {[...Array(5)].map((_, idx) => (
              <option key={idx} value={currentYear - 2 + idx}>
                Năm {currentYear - 2 + idx}
              </option>
            ))}
          </select>

          <div>
            <label className="block text-gray-600">Lương Tháng Cố Định:</label>
            <input
              value={fixedSalary}
              onChange={(e) => setFixedSalary(parseInt(e.target.value) || 0)}
              type="number"
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-gray-600">Lương Một Công Làm</label>
            <input
              value={salaryPerShift}
              type="number"
              className="w-full px-4 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-600">Số công làm</label>
            <input
              value={WorkDayNumber}
              type="number"
              className="w-full px-4 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-600">Số giờ làm thêm</label>
            <input
              value={bonusTime}
              type="number"
              className="w-full px-4 py-2 border rounded-md"
              disabled
            />
          </div>

          <div>
            <label className="block text-gray-600">Tiền Thưởng:</label>
            <input
              {...register("bonusSalary")}
              min={0}
              type="number"
              onChange={(e) =>
                setValue("bonusSalary", parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-gray-600">Phạt:</label>
            <input
              {...register("penalty")}
              min={0}
              type="number"
              onChange={(e) =>
                setValue("penalty", parseInt(e.target.value) || 0)
              }
              className="w-full px-4 py-2 border rounded-md"
            />
          </div>

          <div>
            <label className="block text-gray-600">Lương Thực Nhận:</label>
            <input
              {...register("finalSalary")}
              type="number"
              disabled
              className="w-full px-4 py-2 border rounded-md bg-gray-100"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600"
          >
            Lưu Lương
          </button>
        </form>

        {message && (
          <p className="mt-3 text-center text-green-600">{message}</p>
        )}
      </div>
    </>
  );
};

export default SalaryForm;
