import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { API_Dashboard } from '../../../../api/api';
import CardDataStats from '../../../../components/CardDataStats';
import ListProgress from '../../../../components/ListProgress';
import {FaFileInvoice, FaHourglassHalf, FaTimesCircle, FaMoneyCheckAlt, FaMoneyBillWave} from 'react-icons/fa';

const DashboardAdminAccounting: React.FC = () => {
  // State for invoice stats
  const [newInvoice, setNewInvoice] = useState('0');
  const [inProcessInvoice, setInProcessInvoice] = useState('0');
  const [rejectedInvoice, setRejectedInvoice] = useState('0');
  const [readyToPaymentInvoice, setReadyToPaymentInvoice] = useState('0');
  const [paidInvoice, setPaidInvoice] = useState('0');

  // Fetch admin accounting dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Dashboard(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          // Adapt these keys based on your API’s actual response
          const data = result.data;
          setNewInvoice(data.new_invoices?.toString() || '0');
          setInProcessInvoice(data.in_process_invoices?.toString() || '0');
          setRejectedInvoice(data.rejected_invoices?.toString() || '0');
          setReadyToPaymentInvoice(data.ready_to_payment_invoices?.toString() || '0');
          setPaidInvoice(data.paid_invoices?.toString() || '0');
        } else {
          toast.error(`Error fetching dashboard data: ${result.message}`);
        }
      } else {
        toast.error(`Failed to fetch data: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } else {
        toast.error('Error fetching dashboard data');
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Optionally, you can refresh the data periodically:
    // const intervalId = setInterval(fetchDashboardData, 5000);
    // return () => clearInterval(intervalId);
  }, []);

  return (
<div className="flex flex-col gap-6">
      {/* Toast Container for error/success messages */}
      <ToastContainer position="top-right" />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CardDataStats
          title={<span className="text-sm font-font-medium text-blue-400">New Invoice</span>}
          total={<span className="text-2xl font-semibold text-blue-400">{newInvoice}</span>}
          rate=""
          levelUp={Number(newInvoice) > 0}
          levelDown={Number(newInvoice) <= 0}
        >
          <FaFileInvoice className="fill-blue-400 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={<span className="text-sm font-font-medium text-yellow-300">In Process Invoice</span>}
          total={<span className="text-2xl font-semibold text-yellow-300">{inProcessInvoice}</span>}
          rate=""
          levelUp={Number(inProcessInvoice) > 0}
          levelDown={Number(inProcessInvoice) <= 0}
        >
          <FaHourglassHalf className="fill-yellow-300 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={<span className="text-sm font-font-medium text-red-500">Reject Invoice</span>}
          total={<span className="text-2xl font-semibold text-red-500">{rejectedInvoice}</span>}
          rate=""
          levelUp={Number(rejectedInvoice) > 0}
          levelDown={Number(rejectedInvoice) <= 0}
        >
          <FaTimesCircle className="fill-red-500 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={<span className="text-sm font-font-medium text-green-500">Ready to Payment</span>}
          total={<span className="text-2xl font-semibold text-green-500">{readyToPaymentInvoice}</span>}
          rate=""
          levelUp={Number(readyToPaymentInvoice) > 0}
          levelDown={Number(readyToPaymentInvoice) <= 0}
        >
          <FaMoneyCheckAlt className="fill-green-500 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={<span className="text-sm font-medium text-blue-800">Paid Invoice</span>}
          total={<span className="text-2xl font-semibold text-blue-800">{paidInvoice}</span>}
          rate=""
          levelUp={Number(paidInvoice) > 0}
          levelDown={Number(paidInvoice) <= 0}
        >
          <FaMoneyBillWave className="fill-blue-800 dark:fill-white" size={24} />
        </CardDataStats>
      </div>

      {/* List Progress for Invoice */}
        <div className="bg-white p-4 md:p-4 rounded-lg shadow">
          <ListProgress />
        </div>
    </div>
  );
};

export default DashboardAdminAccounting;