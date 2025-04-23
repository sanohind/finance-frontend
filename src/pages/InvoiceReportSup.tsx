import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Header_Admin } from '../api/api';

interface Invoice {
  inv_no: string;
  receipt_number: string | null;
  receipt_path: string | null;
  bp_code: string | null;
  bp_name?: string;
  inv_date: string | null;
  plan_date: string | null;
  actual_date: string | null;
  inv_faktur: string | null; // "Tax Number"
  inv_faktur_date: string | null; // "Tax Date"
  total_dpp: number | null;
  ppn_id: number | null;
  tax_base_amount: number | null;
  tax_amount: number | null;
  pph_id: number | null;
  pph_base_amount: number | null;
  pph_amount: number | null;
  created_by: string | null;
  updated_by: string | null;
  total_amount: number | null;
  status: string | null;
  reason: string | null;
  created_at: string;
  updated_at: string;
}

const InvoiceReportSup = () => {
  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  // Filter states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [verificationDate, setVerificationDate] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [paymentPlanningDate, setPaymentPlanningDate] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  // Data states
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rowsPerPage] = useState(15);

  // Selection tracking
  const [selectedRecords, setSelectedRecords] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);

  // Reason popup state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);

  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
        const response = await fetch(API_Inv_Header_Admin(), {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch invoice data');
        }

        const result = await response.json();
        if (result && typeof result === 'object') {
          let invoiceList: Invoice[] = [];

          if (Array.isArray(result.data)) {
            invoiceList = result.data;
          } else if (result.data && typeof result.data === 'object') {
            invoiceList = Object.values(result.data);
          } else if (Array.isArray(result)) {
            invoiceList = result;
          }

          if (invoiceList.length > 0) {
            setData(invoiceList);
            setFilteredData(invoiceList);
          } else {
            toast.warn('No invoice data found');
          }
        }
      } catch (error) {
        console.error('Error fetching invoice data:', error);
        toast.error('Failed to fetch invoice data');
      } finally {
        setIsLoading(false);
      }
    };

    fetchInvoiceData();
  }, []);

  const handleSearch = () => {
    let newFiltered = [...data];

    if (invoiceNumber.trim()) {
      newFiltered = newFiltered.filter((row) =>
        row.inv_no?.toLowerCase().includes(invoiceNumber.toLowerCase())
      );
    }
    if (verificationDate) {
      newFiltered = newFiltered.filter(
        (row) => row.actual_date?.slice(0, 10) === verificationDate
      );
    }
    if (invoiceStatus.trim()) {
      newFiltered = newFiltered.filter((row) =>
        row.status?.toLowerCase().includes(invoiceStatus.toLowerCase())
      );
    }
    if (paymentPlanningDate) {
      newFiltered = newFiltered.filter(
        (row) => row.plan_date?.slice(0, 10) === paymentPlanningDate
      );
    }
    if (creationDate) {
      newFiltered = newFiltered.filter(
        (row) => row.created_at?.slice(0, 10) === creationDate
      );
    }
    if (invoiceDate) {
      newFiltered = newFiltered.filter(
        (row) => row.inv_date?.slice(0, 10) === invoiceDate
      );
    }

    setFilteredData(newFiltered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setInvoiceNumber('');
    setVerificationDate('');
    setInvoiceStatus('');
    setPaymentPlanningDate('');
    setCreationDate('');
    setInvoiceDate('');
    setFilteredData(data);
    setCurrentPage(1);
  };

  const handleRecordSelection = (record: Invoice) => {
    setSelectedRecords((prev) => prev + 1);
    setTotalAmount((prev) => prev + (record.total_amount || 0));
  };

  const handleDownloadAttachment = () => {
    if (!filteredData.length) {
      toast.warn('No data available to download');
      return;
    }

    toast.info('Preparing Excel file, please wait...');

    const headers = [
      'Invoice No',
      'Inv Date',
      'Plan Date',
      'Actual Date',
      'Status',
      'Receipt No',
      'Supplier Code',
      'Supplier Name',
      'Tax Number',
      'Tax Date',
      'Total DPP',
      'Tax Base Amount',
      'Tax Amount (Preview 11%)',
      'PPh Base Amount',
      'PPh Amount',
      'Total Amount',
    ];
    const rows = filteredData.map((inv) => [
      inv.inv_no || '-',
      inv.inv_date || '-',
      inv.plan_date || '-',
      inv.actual_date || '-',
      inv.status || '-',
      inv.receipt_number || '-',
      inv.bp_code || '-',
      inv.bp_name || '-',
      inv.inv_faktur || '-',
      inv.inv_faktur_date || '-',
      inv.total_dpp?.toString() || '-',
      inv.tax_base_amount?.toString() || '-',
      inv.tax_base_amount ? (inv.tax_base_amount * 0.11).toString() : '0',
      inv.pph_base_amount?.toString() || '-',
      inv.pph_amount?.toString() || '-',
      inv.total_amount?.toString() || '-',
    ]);

    const csvHeader = headers.join(',') + '\n';
    const csvBody = rows.map((row) => row.join(',')).join('\n');
    const csvContent = csvHeader + csvBody;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'Invoice_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return `Rp ${amount.toLocaleString()},00`;
  };

  function handleCancelInvoice(): void {
    toast.info('Invoice cancelled');
  }

  // Show detail
  const handleShowDetail = (invoice: Invoice) => {
    setDetailInvoice(invoice);
    setDetailModalOpen(true);
  };

  // Close modal
  const closeDetailModal = () => {
    setDetailInvoice(null);
    setDetailModalOpen(false);
  };

  // Status color helper (same as ListProgress)
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-blue-300";
    const s = status.toLowerCase();
    if (s === "ready to payment") return "bg-green-600";
    if (s === "rejected") return "bg-red-500";
    if (s === "paid") return "bg-blue-800";
    if (s === "in process") return "bg-yellow-300";
    return "bg-blue-400";
  };

  // Show rejected reason popup
  const handleShowRejectedReason = (reason: string | null) => {
    if (!reason) return;
    setRejectedReason(reason);
    setShowReasonModal(true);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Report" />
      <ToastContainer />

      {/* Filters */}
      <form className="space-y-4">
        <div className="flex space-x-4">
          {/* Invoice Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Number
            </label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ---------"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Verification Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Verification Date
            </label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={verificationDate}
              onChange={(e) => setVerificationDate(e.target.value)}
            />
          </div>

          {/* Invoice Status */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Status
            </label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ----------"
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
            />
          </div>
        </div>

        <div className="flex space-x-4">
          {/* Payment Planning Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Payment Planning Date
            </label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={paymentPlanningDate}
              onChange={(e) => setPaymentPlanningDate(e.target.value)}
            />
          </div>

          {/* Creation Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Creation Date
            </label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={creationDate}
              onChange={(e) => setCreationDate(e.target.value)}
            />
          </div>

          {/* Invoice Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Date
            </label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
        </div>
      </form>

      {/* Buttons */}
      <div className="flex justify-end items-center gap-4">
        <button
          className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800"
          onClick={handleSearch}
          type="button"
        >
          Search
        </button>
        <button
          className="bg-white text-sm text-black px-8 py-2 rounded border border-violet-800 hover:bg-gray-100"
          onClick={handleClear}
          type="button"
        >
          Clear
        </button>
      </div>

      {/* Table */}
      <h3 className="text-xl font-semibold text-gray-700">Invoice List</h3>
      <div className="bg-white p-6 space-y-6 mt-8">
        <div className="flex justify-between mb-8">
          <div>
            <button
              className="bg-red-600 text-sm text-white px-4 py-2 rounded hover:bg-red-500"
              onClick={handleCancelInvoice}
              type="button"
            >
              Cancel Invoice
            </button>
          </div>
          <div>
            <button
              className="bg-purple-900 text-sm text-white px-4 py-2 rounded hover:bg-purple-800"
              onClick={handleDownloadAttachment}
              type="button"
            >
              Download Attachment
            </button>
            <button
              className="bg-blue-900 text-sm text-white px-4 py-2 rounded hover:bg-blue-800 ml-4"
              onClick={handleCancelInvoice}
              type="button"
            >
              Post Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto shadow-md border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-3 py-2 text-gray-700 text-center border w-10"></th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[150px]">Invoice No</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">Inv Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]" colSpan={2}>
                  Payment Date
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[160px]">Status</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Receipt No</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Supplier Code</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Tax Number</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">Tax Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Total DPP</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Tax Base Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Tax Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">PPh Base Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">PPh Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Total Amount</th>
              </tr>
              <tr className="bg-gray-100 border">
                <th colSpan={3}></th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">Plan</th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">Actual</th>
                <th colSpan={11}></th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={17} className="px-4 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((invoice, index) => {
                  const status = invoice.status || "New";
                  const statusColor = getStatusColor(status);
                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">
                        <input
                          type="checkbox"
                          onChange={() => handleRecordSelection(invoice)}
                        />
                      </td>
                      {/* Clickable invoice number to open detail modal */}
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleShowDetail(invoice)}
                          className="text-blue-600 underline"
                        >
                          {invoice.inv_no || '-'}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.inv_date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.plan_date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.actual_date)}
                      </td>
                      {/* Status with color and popup for Rejected */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-white text-xs font-medium ${statusColor} ${
                            status.toLowerCase() === "rejected" ? "cursor-pointer" : ""
                          }`}
                          onClick={() => {
                            if (status.toLowerCase() === "rejected") {
                              handleShowRejectedReason(invoice.reason);
                            }
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.receipt_number || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.bp_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_faktur || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.inv_faktur_date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.total_dpp)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.tax_base_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(
                          invoice.tax_base_amount ? invoice.tax_base_amount * 0.11 : 0
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.pph_base_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.pph_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.total_amount)}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={17} className="px-4 py-4 text-center text-gray-500">
                    No data available.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          totalRows={filteredData.length}
          rowsPerPage={rowsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      </div>

      {/* Detail Modal */}
      {detailModalOpen && detailInvoice && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg max-w-lg w-full">
            <h2 className="text-xl font-semibold mb-4">
              Invoice Detail - {detailInvoice.inv_no}
            </h2>
            <div className="space-y-2">
              <p>
                <strong>Supplier:</strong> {detailInvoice.bp_code} — {detailInvoice.bp_name}
              </p>
              <p>
                <strong>Date:</strong> {formatDate(detailInvoice.inv_date)}
              </p>
              <p>
                <strong>Status:</strong> {detailInvoice.status}
              </p>
              <p>
                <strong>Total Amount:</strong> {formatCurrency(detailInvoice.total_amount)}
              </p>
              {/* Add any other fields needed */}
            </div>
            <div className="flex justify-end mt-4">
              <button
                onClick={closeDetailModal}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Popup for showing Rejected reason */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-md text-center">
            <p className="mb-4">Reason: {rejectedReason || '-'}</p>
            <button
              className="bg-purple-900 text-white px-4 py-2 rounded hover:bg-purple-800"
              onClick={() => setShowReasonModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceReportSup;