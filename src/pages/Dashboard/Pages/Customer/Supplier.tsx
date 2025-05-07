import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { API_Dashboard, API_Get_News } from '../../../../api/api';
import CardDataStats from '../../../../components/CardDataStats';
import ListProgress from '../../../../components/ListProgress';
import { FaFileInvoice, FaHourglassHalf, FaTimesCircle, FaMoneyCheckAlt, FaMoneyBillWave } from "react-icons/fa";
import Calendar from '../../../../components/Calender';
import moment from 'moment'; // Import moment

// Define the structure of an event for the Calendar
interface CalendarEvent {
  title: string;
  description: string;
  start_date: Date;
  end_date: Date;
  document: string;
}

const DashboardSupplier: React.FC = () => {
  // State for invoice stats
  const [newInvoice, setNewInvoice] = useState('0');
  const [inProcessInvoice, setInProcessInvoice] = useState('0');
  const [rejectedInvoice, setRejectedInvoice] = useState('0');
  const [readyToPaymentInvoice, setReadyToPaymentInvoice] = useState('0');
  const [paidInvoice, setPaidInvoice] = useState('0');
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]); // State for calendar events

  // Fetch supplier dashboard data
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
          // Adapt these keys to match your actual API response
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
        toast.error(`Gagal mengambil data: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } else {
        toast.error('Error fetching dashboard data');
      }
    }
  };

  // Fetch news events for the calendar
  const fetchNewsEvents = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Get_News(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('API_Get_News response result:', JSON.stringify(result, null, 2)); // Added for debugging

        let newsDataArray: any[] | null = null;

        if (Array.isArray(result)) {
          newsDataArray = result;
        } else if (result && Array.isArray(result.data)) {
          newsDataArray = result.data;
        }

        if (newsDataArray) {
          const fetchedEvents = newsDataArray.map((newsItem: any) => {
            const rawStartDateString = newsItem.start_date;
            const rawEndDateString = newsItem.end_date;

            let startDate: Date;
            let endDate: Date;

            if (rawStartDateString && moment(rawStartDateString).isValid()) {
              startDate = moment(rawStartDateString).toDate();
            } else {
              console.warn('Invalid or missing start_date from API:', rawStartDateString, 'for item:', newsItem.title);
              startDate = moment().toDate(); // Fallback to now
            }

            if (rawEndDateString && moment(rawEndDateString).isValid()) {
              endDate = moment(rawEndDateString).toDate();
            } else {
              console.warn('Invalid or missing end_date from API:', rawEndDateString, 'for item:', newsItem.title);
              endDate = moment(startDate).add(1, 'days').toDate(); // Fallback to start_date + 1 day
            }

            if (moment(endDate).isBefore(moment(startDate))) {
              console.warn('End_date was before start_date for item:', newsItem.title, 'Adjusting end_date.');
              endDate = moment(startDate).add(1, 'days').toDate();
            }

            return {
              title: newsItem.title || 'No Title',
              description: newsItem.description || 'No Description',
              start_date: startDate,
              end_date: endDate,
              document: newsItem.document || newsItem.id?.toString() || '',
            };
          });
          console.log('Processed calendar events:', fetchedEvents); // Added for debugging
          setCalendarEvents(fetchedEvents);
        } else {
          const errorMessage = result?.message || 'News data is not in the expected format or is empty.';
          toast.error(`Error processing news events: ${errorMessage}`);
          setCalendarEvents([]);
        }
      } else {
        let errorMessage = `Failed to fetch news events: ${response.status}`;
        try {
          const errorResult = await response.json();
          if (errorResult && errorResult.message) {
            errorMessage = errorResult.message;
          }
        } catch (e) {
          // Ignore if parsing error response fails
        }
        toast.error(errorMessage);
        setCalendarEvents([]);
      }
    } catch (error) {
      console.error('Catch block error fetching news:', error); // Added for debugging
      if (error instanceof Error) {
        toast.error(`Error fetching news events: ${error.message}`);
      } else {
        toast.error('An unknown error occurred while fetching news events');
      }
      setCalendarEvents([]);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    fetchNewsEvents(); // Fetch news events
    // Optionally, you can refresh the data periodically:
    // const intervalId = setInterval(fetchDashboardData, 5000);
    // return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="space-y-4">
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

      {/* Calendar before ListProgress */}
      <Calendar events={calendarEvents} />

      {/* List Progress untuk Invoice */}
      <div className="bg-white p-4 md:p-2 rounded-lg shadow">
        <ListProgress />
      </div>
    </div>
  );
};

export default DashboardSupplier;