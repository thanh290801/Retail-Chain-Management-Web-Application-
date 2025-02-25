import React, { useState } from 'react';
import { RadioGroup } from '@headlessui/react';
import { CalendarIcon } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

const Card = ({ children, className }) => (
    <div className={`bg-white shadow-md rounded p-4 ${className}`}>
        {children}
    </div>
);

const TransactionFilter = () => {
    const [transactionType, setTransactionType] = useState('Tiền mặt,Ngân hàng');
    const [moneyType, setMoneyType] = useState('Chi');
    const [timeRange, setTimeRange] = useState('Tháng này');
    const [startDate, setStartDate] = useState(null);
    const [endDate, setEndDate] = useState(null);

    const handleTransactionTypeChange = (type) => {
        if (type === 'Tất cả') {
            setTransactionType('Tiền mặt,Ngân hàng'); // Chọn cả Tiền mặt và Ngân hàng
        } else {
            setTransactionType(type);
        }
    };

    const handleMoneyTypeChange = (type) => {
        if (type === 'Tất cả') {
            setMoneyType('Chi,Thu'); // Chọn cả Chi và Thu
        } else {
            setMoneyType(type);
        }
    };

    const predefinedTimeRanges = ['Hôm nay', 'Tuần này', 'Tháng này', 'Lựa chọn khác'];

    return (
        <div className="space-y-4 p-4">
            <Card>
                <h2 className="text-lg font-semibold mb-2">Loại giao dịch</h2>
                <RadioGroup value={transactionType} onChange={handleTransactionTypeChange}>
                    <RadioGroup.Option value="Tiền mặt" className="flex items-center mb-2">
                        <input type="radio" checked={transactionType.includes('Tiền mặt')} readOnly className="mr-2" />
                        Tiền mặt
                    </RadioGroup.Option>
                    <RadioGroup.Option value="Ngân hàng" className="flex items-center mb-2">
                        <input type="radio" checked={transactionType.includes('Ngân hàng')} readOnly className="mr-2" />
                        Ngân hàng
                    </RadioGroup.Option>
                    <RadioGroup.Option value="Tất cả" className="flex items-center">
                        <input type="radio" checked={transactionType === 'Tiền mặt,Ngân hàng'} readOnly className="mr-2" />
                        Tất cả
                    </RadioGroup.Option>
                </RadioGroup>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Loại tiền</h2>
                <div className="flex space-x-4">
                    {['Chi', 'Thu', 'Tất cả'].map((type) => (
                        <label key={type} className="flex items-center">
                            <input
                                type="radio"
                                name="moneyType"
                                value={type}
                                checked={moneyType.includes(type) || (type === 'Tất cả' && moneyType === 'Chi,Thu')}
                                onChange={() => handleMoneyTypeChange(type)}
                                className="mr-2"
                            />
                            {type}
                        </label>
                    ))}
                </div>
            </Card>

            <Card>
                <h2 className="text-lg font-semibold mb-2">Thời gian</h2>
                <div className="mb-4">
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(e.target.value)}
                        className="border border-gray-300 rounded-md p-2 w-full"
                    >
                        {predefinedTimeRanges.map((option) => (
                            <option key={option} value={option}>
                                {option}
                            </option>
                        ))}
                    </select>
                </div>
                {timeRange === 'Lựa chọn khác' && (
                    <div className="flex space-x-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Từ ngày</label>
                            <DatePicker
                                selected={startDate}
                                onChange={(date) => setStartDate(date)}
                                dateFormat="dd/MM/yyyy"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                placeholderText="Chọn ngày bắt đầu"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Đến ngày</label>
                            <DatePicker
                                selected={endDate}
                                onChange={(date) => setEndDate(date)}
                                dateFormat="dd/MM/yyyy"
                                className="border border-gray-300 rounded-md p-2 w-full"
                                placeholderText="Chọn ngày kết thúc"
                                minDate={startDate}
                            />
                        </div>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TransactionFilter;
