import { useEffect } from 'react';
import { HubConnectionBuilder } from '@microsoft/signalr';

const PayOSVoiceNotification = () => {
  useEffect(() => {
    const connection = new HubConnectionBuilder()
      .withUrl("https://yourdomain.com/paymentHub") // Đổi lại domain backend bạn
      .withAutomaticReconnect()
      .build();

    connection.start().then(() => {
      connection.on("paymentReceived", (data) => {
        const amount = data.amount.toLocaleString("vi-VN");
        const name = data.customerName || "khách hàng";
        const msg = new SpeechSynthesisUtterance(`Đã nhận ${amount} đồng từ ${name}`);
        speechSynthesis.speak(msg);
      });
    });

    return () => connection.stop();
  }, []);

  return null;
};

export default PayOSVoiceNotification;
