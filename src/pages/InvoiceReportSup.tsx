import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Search, XCircle } from 'lucide-react';
import { AiFillFilePdf } from 'react-icons/ai';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import {
  API_Inv_Header_Admin,
  API_Update_Inv_Header_Rejected,
  API_Stream_File_Invoice,
  API_Stream_File_Faktur,
  API_Stream_File_Suratjalan,
  API_Stream_File_PO,
  API_Stream_File_Receipt,
} from '../api/api';
import * as XLSX from 'xlsx';

interface Invoice {
  inv_id: number;
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
  // Detail modal pagination states
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailRowsPerPage] = useState(7);
  // Filter states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [paymentPlanningDate, setPaymentPlanningDate] = useState('');
  // Date range states for invoice date filter
  const [invoiceDateFrom, setInvoiceDateFrom] = useState<string>('');
  const [invoiceDateTo, setInvoiceDateTo] = useState<string>('');

  // Column filter states
  const [invoiceNoFilter, setInvoiceNoFilter] = useState('');
  const [invDateFilter, setInvDateFilter] = useState('');
  const [submitDateFilter, setSubmitDateFilter] = useState('');
  const [planDateFilter, setPlanDateFilter] = useState('');
  const [actualDateFilter, setActualDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [receiptNoFilter, setReceiptNoFilter] = useState('');
  const [supplierCodeFilter, setSupplierCodeFilter] = useState('');
  const [taxNumberFilter, setTaxNumberFilter] = useState('');
  const [taxDateFilter, setTaxDateFilter] = useState('');
  const [totalDppFilter, setTotalDppFilter] = useState('');
  const [taxAmountFilter, setTaxAmountFilter] = useState('');
  const [pphDescFilter, setPphDescFilter] = useState('');
  const [pphBaseFilter, setPphBaseFilter] = useState('');
  const [pphAmountFilter, setPphAmountFilter] = useState('');
  const [totalAmountFilter, setTotalAmountFilter] = useState('');

  // Data states
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rowsPerPage] = useState(20); // Client-side pagination: 20 items per page
  const [filterInfo, setFilterInfo] = useState<any>(null);

  // Reason popup state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);
  // State for selected invoice (only one allowed)
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(
    null,
  );
  // State for reason input modal
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);

  const [totalItems, setTotalItems] = useState(0);

  const fetchInvoiceData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      
      const queryParams = new URLSearchParams();

      if (invoiceNumber) queryParams.append('inv_no', invoiceNumber);
      
      if (invoiceDateFrom) queryParams.append('invoice_date_from', invoiceDateFrom);
      if (invoiceDateTo) queryParams.append('invoice_date_to', invoiceDateTo);
      if (invoiceStatus) queryParams.append('status', invoiceStatus);
      if (paymentPlanningDate) queryParams.append('plan_date', paymentPlanningDate);
      
      const url = `${API_Inv_Header_Admin()}?${queryParams.toString()}`;

      const response = await fetch(url, {
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
          // Store filter info from backend
          if (result.filter_info) {
            setFilterInfo(result.filter_info);
            setTotalItems(result.filter_info.total_records || result.data.length);
          } else {
            setTotalItems(result.data.length);
          }
        } else if (result.data && typeof result.data === 'object') {
          invoiceList = Object.values(result.data);
          setTotalItems(invoiceList.length);
        } else if (Array.isArray(result)) {
           // fallback
          invoiceList = result;
          setTotalItems(result.length);
        }

        setData(invoiceList);
        setFilteredData(invoiceList);
        setCurrentPage(1); // Reset to first page when data changes
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to fetch invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Apply column filters
  useEffect(() => {
    let newFiltered = [...data];
    if (invoiceNoFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.inv_no?.toLowerCase().includes(invoiceNoFilter.toLowerCase()),
      );
    }
    if (invDateFilter) {
      newFiltered = newFiltered.filter(
        (item) => item.inv_date?.includes(invDateFilter),
      );
    }
    if (submitDateFilter) {
      newFiltered = newFiltered.filter(
        (item) => item.created_at?.includes(submitDateFilter),
      );
    }
    if (planDateFilter) {
      newFiltered = newFiltered.filter(
        (item) => item.plan_date?.includes(planDateFilter),
      );
    }
    if (actualDateFilter) {
      newFiltered = newFiltered.filter(
        (item) => item.actual_date?.includes(actualDateFilter),
      );
    }
    if (statusFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.status?.toLowerCase().includes(statusFilter.toLowerCase()),
      );
    }
    if (receiptNoFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.receipt_number
            ?.toLowerCase()
            .includes(receiptNoFilter.toLowerCase()),
      );
    }
    if (supplierCodeFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.bp_code
            ?.toLowerCase()
            .includes(supplierCodeFilter.toLowerCase()),
      );
    }
    if (taxNumberFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.inv_faktur
            ?.toLowerCase()
            .includes(taxNumberFilter.toLowerCase()),
      );
    }
    if (taxDateFilter) {
      newFiltered = newFiltered.filter(
        (item) => item.inv_faktur_date?.includes(taxDateFilter),
      );
    }
    if (totalDppFilter) {
      const filterAmount = parseFloat(totalDppFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter((item) => {
          if (!item.total_dpp) return false;
          return (
            Math.abs(item.total_dpp - filterAmount) < 0.01 ||
            item.total_dpp.toString().includes(totalDppFilter)
          );
        });
      }
    }
    if (taxAmountFilter) {
      const filterAmount = parseFloat(taxAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter((item) => {
          const taxAmount = item.tax_amount || 0;
          return (
            Math.abs(taxAmount - filterAmount) < 0.01 ||
            taxAmount.toString().includes(taxAmountFilter)
          );
        });
      }
    }
    if (pphDescFilter) {
      newFiltered = newFiltered.filter((item) => {
        const pphDesc = getPphDescription(item.pph_id, item);
        return pphDesc.toLowerCase().includes(pphDescFilter.toLowerCase());
      });
    }
    if (pphBaseFilter) {
      const filterAmount = parseFloat(pphBaseFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter((item) => {
          if (!item.pph_base_amount) return false;
          return (
            Math.abs(item.pph_base_amount - filterAmount) < 0.01 ||
            item.pph_base_amount.toString().includes(pphBaseFilter)
          );
        });
      }
    }
    if (pphAmountFilter) {
      const filterAmount = parseFloat(pphAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter((item) => {
          const pphAmount = item.pph_amount || 0;
          return (
            Math.abs(pphAmount - filterAmount) < 0.01 ||
            pphAmount.toString().includes(pphAmountFilter)
          );
        });
      }
    }
    if (totalAmountFilter) {
      const filterAmount = parseFloat(totalAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter((item) => {
          if (!item.total_amount) return false;
          return (
            Math.abs(item.total_amount - filterAmount) < 0.01 ||
            item.total_amount.toString().includes(totalAmountFilter)
          );
        });
      }
    }
    setFilteredData(newFiltered);
    setCurrentPage(1);
  }, [
    data,
    invoiceNoFilter,
    invDateFilter,
    submitDateFilter,
    planDateFilter,
    actualDateFilter,
    statusFilter,
    receiptNoFilter,
    supplierCodeFilter,
    taxNumberFilter,
    taxDateFilter,
    totalDppFilter,
    taxAmountFilter,
    pphDescFilter,
    pphBaseFilter,
    pphAmountFilter,
    totalAmountFilter,
  ]);
  /* Updated to trigger server fetch */
  const handleSearch = () => {
      fetchInvoiceData();
  };

  const handleClear = () => {
    setInvoiceNumber('');
    setInvoiceStatus('');
    setPaymentPlanningDate('');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');
    
    // Reset to first page without filters
    fetchInvoiceData();
  };

  const handleDownloadAttachment = () => {
    if (!filteredData.length) {
      toast.warn('No data available to download');
      return;
    }

    toast.info('Preparing Excel file, please wait...');

    const headers = [
      'Supplier Code',
      'Invoice No',
      'Inv Date',
      'Submit Date',
      'Plan Date',
      'Actual Date',
      'Status',
      'Receipt Doc',
      'Tax Number',
      'Tax Date',
      'Total DPP',
      'Tax Amount (Preview 11%)',
      'PPh Description',
      'PPh Base Amount',
      'PPh Amount',
      'Total Amount',
    ];
    const rows = filteredData.map((inv) => {
      return [
        inv.bp_code || '',
        inv.inv_no || '',
        inv.inv_date || '',
        inv.created_at || '',
        inv.plan_date || '',
        inv.actual_date || '',
        inv.status || '',
        inv.receipt_number || '',
        inv.inv_faktur || '',
        inv.inv_faktur_date || '',
        inv.total_dpp || '',
        inv.tax_amount || '',
        getPphDescription(inv.pph_id, inv),
        inv.pph_base_amount || '',
        inv.pph_amount || '',
        inv.total_amount || '',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 20 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
    XLSX.writeFile(wb, 'Invoice_Report.xlsx');
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('id-ID');
    } catch {
      return dateString;
    }
  };

  const formatDateTime = (dateString: string | null) => {
    if (!dateString) return '-';
    try {
      const date = new Date(dateString);
      return (
        date.toLocaleDateString('id-ID') +
        ' ' +
        date.toLocaleTimeString('en-GB')
      );
    } catch {
      return dateString;
    }
  };
  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return `Rp ${amount.toLocaleString('id-ID')},00`;
  };

  // Get PPh Description based on pph_id (same logic as InvoiceReport)
  const getPphDescription = (
    pphId: string | number | null | undefined,
    invoice?: any,
  ): string => {
    if (pphId === null || pphId === undefined) {
      // Check if there are PPh amounts even when pph_id is null
      if (invoice && (invoice.pph_amount > 0 || invoice.pph_base_amount > 0)) {
        return 'PPh Applied (ID Missing)';
      }
      return '-';
    }
    const id = Number(pphId);
    switch (id) {
      case 1:
        return 'Pph 23';
      case 2:
        return 'Pph 21';
      case 3:
        return 'Pasal 4(2) - 10%';
      case 4:
        return 'Pasal 4(2) - 1.75%';
      case 5:
        return 'Pasal 26 - 10%';
      case 6:
        return 'Pasal 26 - 0%';
      case 7:
        return 'Pasal 26 - 20%';
      default:
        return '-';
    }
  };
  // Cancel/Reject Invoice logic
  const handleCancelInvoice = () => {
    if (!selectedInvoiceId) {
      toast.warning('Please select one invoice with status "New" to cancel.');
      return;
    }
    setShowRejectInput(true);
  };

  // Submit rejection
  const handleSubmitReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Please provide a reason for rejection.');
      return;
    }
    setRejectLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(
        API_Update_Inv_Header_Rejected() + `/${selectedInvoiceId}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: 'Rejected', reason: rejectReason }),
        },
      );
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to reject invoice');
      }
      toast.success('Invoice Cancel successfully!');
      // Update local data
      const updatedData = data.map((inv) =>
        inv.inv_id === selectedInvoiceId
          ? { ...inv, status: 'Rejected', reason: rejectReason }
          : inv,
      );
      setData(updatedData);
      setFilteredData(updatedData);
      setSelectedInvoiceId(null);
      setShowRejectInput(false);
      setRejectReason('');
    } catch (err: any) {
      toast.error(err.message || 'Error rejecting invoice');
    } finally {
      setRejectLoading(false);
    }
  };

  // Status color helper (same as ListProgress)
  const getStatusColor = (status: string | null) => {
    if (!status) return 'bg-blue-300';
    const s = status.toLowerCase();
    if (s === 'ready to payment') return 'bg-green-600';
    if (s === 'rejected') return 'bg-red-500';
    if (s === 'paid') return 'bg-blue-800';
    if (s === 'in process') return 'bg-yellow-300';
    return 'bg-blue-400';
  };

  // Show rejected reason popup
  const handleShowRejectedReason = (reason: string | null) => {
    if (!reason) return;
    setRejectedReason(reason);
    setShowReasonModal(true);
  };

  // Client-side pagination: slice filteredData based on currentPage
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  // Show detail modal for invoice
  const handleShowDetail = (invoice: Invoice) => {
    setDetailInvoice(invoice);
    setDetailModalOpen(true);
  };
  // Close detail modal
  const closeDetailModal = () => {
    setDetailInvoice(null);
    setDetailModalOpen(false);
    setDetailCurrentPage(1); // Reset pagination when closing modal
  };

  // Date range handlers
  const handleInvoiceDateFromChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInvoiceDateFrom(e.target.value);
  };

  const handleInvoiceDateToChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    setInvoiceDateTo(e.target.value);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Report" />
      <ToastContainer /> {/* Filters */}
      <form className="space-y-4">
        <div className="flex space-x-4">
          {/* Invoice Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Supplier Number
            </label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ---------"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          {/* Invoice Date Range */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Date
            </label>
            <div className="flex w-3/4 space-x-2 items-center">
              <div className="relative w-1/2">
                <input
                  type="date"
                  className="input w-full border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="From Date"
                  value={invoiceDateFrom}
                  onChange={handleInvoiceDateFromChange}
                />
                {invoiceDateFrom && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setInvoiceDateFrom('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="text-sm">to</span>
              <div className="relative w-1/2">
                <input
                  type="date"
                  className="input w-full border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="To Date"
                  value={invoiceDateTo}
                  onChange={handleInvoiceDateToChange}
                />
                {invoiceDateTo && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setInvoiceDateTo('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
          {/* Invoice Status */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">
              Invoice Status
            </label>
            <select
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={invoiceStatus}
              onChange={(e) => setInvoiceStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="new">New</option>
              <option value="in process">In Process</option>
              <option value="ready to payment">Ready To Payment</option>
              <option value="paid">Paid</option>
              <option value="rejected">Rejected</option>
            </select>
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
          <div className="flex w-1/3 items-center gap-2">
            {/* Empty space for layout consistency */}
          </div>
          <div className="flex w-1/3 items-center gap-2">
            {/* Empty space for layout consistency */}
          </div>
        </div>
      </form>
      {/* Buttons */}
      <div className="flex justify-end items-center gap-4">
        <button
          type="button"
          onClick={handleSearch}
          className="flex items-center gap-2 bg-purple-900 text-sm text-white px-6 py-2 rounded shadow-md hover:bg-purple-800 disabled:opacity-50 transition"
        >
          <Search className="w-4 h-4" />
          Search
        </button>

        <button
          type="button"
          onClick={handleClear}
          className="flex items-center gap-2 bg-red-700 text-sm text-white px-6 py-2 rounded border border-red-700 hover:bg-red-800 shadow-sm transition"
        >
          <XCircle className="w-4 h-4 text-white" />
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
              Download Report
            </button>
          </div>
        </div>

        <div className="overflow-x-auto shadow-md border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-3 py-2 text-gray-700 text-center border w-10"></th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">
                  Supplier Code
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[150px]">
                  Invoice No
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">
                  Inv Date
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">
                  Submit Date
                </th>
                <th
                  className="px-3 py-2 text-gray-700 text-center border min-w-[120px]"
                  colSpan={2}
                >
                  Payment Date
                </th>
                {/* Document column with 4 sub-columns */}
                <th
                  className="px-3 py-2 text-gray-700 text-center border min-w-[300px]"
                  colSpan={4}
                >
                  Document
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[190px]">
                  Status
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">
                  Receipt Doc
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">
                  Tax Number
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">
                  Tax Date
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  Total DPP
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  Tax Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[160px]">
                  PPh Description
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  PPh Base Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  PPh Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  Total Amount
                </th>
              </tr>
              <tr className="bg-gray-100 border">
                <th colSpan={5}></th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">
                  Plan
                </th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">
                  Actual
                </th>
                {/* Document sub-columns */}
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">
                  INVOICE
                </th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">
                  FAKTUR
                </th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">
                  SURAT JALAN
                </th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">
                  PO
                </th>
                <th colSpan={11}></th>
              </tr>
              {/* Filter inputs row (skip Document columns) */}
              <tr className="bg-gray-50 border">
                <td className="px-2 py-1 border"></td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={supplierCodeFilter}
                    onChange={(e) => setSupplierCodeFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={invoiceNoFilter}
                    onChange={(e) => setInvoiceNoFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="date"
                    value={invDateFilter}
                    onChange={(e) => setInvDateFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="date"
                    value={submitDateFilter}
                    onChange={(e) => setSubmitDateFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="date"
                    value={planDateFilter}
                    onChange={(e) => setPlanDateFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="date"
                    value={actualDateFilter}
                    onChange={(e) => setActualDateFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                {/* No filter inputs for Document columns */}
                <td className="px-2 py-1 border"></td>
                <td className="px-2 py-1 border"></td>
                <td className="px-2 py-1 border"></td>
                <td className="px-2 py-1 border"></td>
                <td className="px-2 py-1 border">
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  >
                    <option value="">All</option>
                    <option value="new">New</option>
                    <option value="in process">In Process</option>
                    <option value="ready to payment">Ready to Payment</option>
                    <option value="paid">Paid</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={receiptNoFilter}
                    onChange={(e) => setReceiptNoFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={taxNumberFilter}
                    onChange={(e) => setTaxNumberFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="date"
                    value={taxDateFilter}
                    onChange={(e) => setTaxDateFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">
                      Rp.
                    </span>
                    <input
                      type="number"
                      placeholder="-"
                      value={totalDppFilter}
                      onChange={(e) => setTotalDppFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">
                      Rp.
                    </span>
                    <input
                      type="number"
                      placeholder="-"
                      value={taxAmountFilter}
                      onChange={(e) => setTaxAmountFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={pphDescFilter}
                    onChange={(e) => setPphDescFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center"
                  />
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">
                      Rp.
                    </span>
                    <input
                      type="number"
                      placeholder="-"
                      value={pphBaseFilter}
                      onChange={(e) => setPphBaseFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">
                      Rp.
                    </span>
                    <input
                      type="number"
                      placeholder="-"
                      value={pphAmountFilter}
                      onChange={(e) => setPphAmountFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">
                      Rp.
                    </span>
                    <input
                      type="number"
                      placeholder="-"
                      value={totalAmountFilter}
                      onChange={(e) => setTotalAmountFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={22}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((invoice: Invoice, index: number) => {
                  const status = invoice.status || 'New';
                  const statusColor = getStatusColor(status); // Only show checkbox for 'New' status
                  const isNew = status.toLowerCase() === 'new';
                  const isChecked = selectedInvoiceId === invoice.inv_id;
                  // Only show checkbox if no selection or this is the selected one
                  const showCheckbox =
                    isNew && (!selectedInvoiceId || isChecked);

                  return (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="px-6 py-4 text-center">
                        {' '}
                        {showCheckbox ? (
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() =>
                              isChecked
                                ? setSelectedInvoiceId(null)
                                : setSelectedInvoiceId(invoice.inv_id)
                            }
                          />
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.bp_code || '-'}
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
                        {formatDateTime(invoice.created_at)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.plan_date)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {formatDate(invoice.actual_date)}
                      </td>
                      {/* Document sub-columns (PDF icon with streaming using API_Stream_File_* variables, no token needed) */}
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${API_Stream_File_Invoice()}/INVOICE_${
                              invoice.inv_id
                            }.pdf`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="View Invoice PDF"
                        >
                          <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${API_Stream_File_Faktur()}/FAKTURPAJAK_${
                              invoice.inv_id
                            }.pdf`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="View Faktur PDF"
                        >
                          <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${API_Stream_File_Suratjalan()}/SURATJALAN_${
                              invoice.inv_id
                            }.pdf`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="View Surat Jalan PDF"
                        >
                          <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          type="button"
                          onClick={() => {
                            const url = `${API_Stream_File_PO()}/PO_${
                              invoice.inv_id
                            }.pdf`;
                            window.open(url, '_blank', 'noopener,noreferrer');
                          }}
                          title="View PO PDF"
                        >
                          <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                        </button>
                      </td>
                      {/* Status with color and popup for Rejected */}
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-white text-xs font-medium ${statusColor} ${
                            status.toLowerCase() === 'rejected'
                              ? 'cursor-pointer'
                              : ''
                          }`}
                          onClick={() => {
                            if (status.toLowerCase() === 'rejected') {
                              handleShowRejectedReason(invoice.reason);
                            }
                          }}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.receipt_number ? (
                          <button
                            type="button"
                            onClick={() => {
                              const url = `${API_Stream_File_Receipt()}/RECEIPT_${
                                invoice.inv_id
                              }.pdf`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            title="View Receipt PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        ) : (
                          '-'
                        )}
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
                        {formatCurrency(invoice.tax_amount)}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {getPphDescription(invoice.pph_id, invoice)}
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
                  <td
                    colSpan={22}
                    className="px-4 py-4 text-center text-gray-500"
                  >
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
          onPageChange={(page) => setCurrentPage(page)}
        />
      </div>
      {/* Detail Modal */}
      {detailModalOpen &&
        detailInvoice &&
        (() => {
          // Pagination logic for detail modal
          const invoiceLines = Array.isArray((detailInvoice as any).inv_lines)
            ? (detailInvoice as any).inv_lines
            : [];
          const totalPages = Math.ceil(invoiceLines.length / detailRowsPerPage);
          const startIndex = (detailCurrentPage - 1) * detailRowsPerPage;
          const endIndex = startIndex + detailRowsPerPage;
          const currentItems = invoiceLines.slice(startIndex, endIndex);

          const handleDetailPrevious = () => {
            setDetailCurrentPage((prev) => Math.max(prev - 1, 1));
          };

          const handleDetailNext = () => {
            setDetailCurrentPage((prev) => Math.min(prev + 1, totalPages));
          };

          return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg max-w-3xl w-full">
                <h2 className="text-xl font-semibold mb-4">
                  Invoice Detail - {detailInvoice.inv_no}
                </h2>
                <div className="space-y-2 mb-4">
                  {/* Supplier address if available */}
                  {(() => {
                    // Try to find supplier address from bp_code if available in data
                    // If you have businessPartners data, you can use it here. Otherwise, fallback to bp_name.
                    return (
                      <p>
                        <strong>Supplier:</strong> {detailInvoice.bp_code} —{' '}
                        {detailInvoice.bp_name || '-'}
                      </p>
                    );
                  })()}
                  <p>
                    <strong>Date:</strong> {formatDate(detailInvoice.inv_date)}
                  </p>
                  <p>
                    <strong>Submit Date:</strong>{' '}
                    {formatDateTime(detailInvoice.created_at)}
                  </p>
                  <p>
                    <strong>Status:</strong> {detailInvoice.status}
                  </p>
                  <p>
                    <strong>Total Amount:</strong>{' '}
                    {formatCurrency(detailInvoice.total_amount)}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Invoice Lines</h3>
                  {invoiceLines.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="min-w-full border border-gray-200 text-sm">
                        <thead className="bg-gray-100">
                          <tr>
                            <th className="px-3 py-2 border">GR No</th>
                            <th className="px-3 py-2 border">PO No</th>
                            <th className="px-3 py-2 border">Part No</th>
                            <th className="px-3 py-2 border">
                              Item Description
                            </th>
                            <th className="px-3 py-2 border">Qty Receipt</th>
                            <th className="px-3 py-2 border">Unit Price</th>
                            <th className="px-3 py-2 border">Receipt Amount</th>
                            <th className="px-3 py-2 border">Unit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {currentItems.map((line: any) => (
                            <tr key={line.inv_line_id}>
                              <td className="px-3 py-2 border text-center">
                                {line.gr_no}
                              </td>
                              <td className="px-3 py-2 border text-center">
                                {line.po_no}
                              </td>
                              <td className="px-3 py-2 border text-center">
                                {line.part_no}
                              </td>
                              <td className="px-3 py-2 border">
                                {line.item_desc}
                              </td>
                              <td className="px-3 py-2 border text-right">
                                {line.actual_receipt_qty?.toLocaleString()}
                              </td>
                              <td className="px-3 py-2 border text-right">
                                {line.receipt_unit_price != null
                                  ? Number(
                                      line.receipt_unit_price,
                                    ).toLocaleString('id-ID', {
                                      style: 'currency',
                                      currency: 'IDR',
                                      minimumFractionDigits: 2,
                                    })
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 border text-right">
                                {line.receipt_amount != null
                                  ? Number(line.receipt_amount).toLocaleString(
                                      'id-ID',
                                      {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                      },
                                    )
                                  : '-'}
                              </td>
                              <td className="px-3 py-2 border text-center">
                                {line.unit}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="text-center text-gray-500">
                      No line items found.
                    </div>
                  )}
                </div>
                <div className="flex justify-end mt-6">
                  <button
                    onClick={closeDetailModal}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
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
      {/* Reject Reason Modal */}
      {showRejectInput && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h2 className="text-lg font-semibold mb-4">Reject Invoice</h2>
            <label className="block mb-2 text-sm font-medium text-gray-700">
              Reason for rejection
            </label>
            <textarea
              className="w-full border border-gray-300 rounded p-2 mb-4"
              rows={3}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Enter reason..."
              disabled={rejectLoading}
            />
            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                onClick={() => setShowRejectInput(false)}
                disabled={rejectLoading}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={handleSubmitReject}
                disabled={rejectLoading}
              >
                {rejectLoading ? 'Rejecting...' : 'Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceReportSup;
