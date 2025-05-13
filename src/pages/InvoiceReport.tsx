import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import { Search, XCircle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import {
  API_Inv_Header_Admin,
  API_List_Partner_Admin,
  API_Update_Status_To_In_Process_Finance,
  API_Upload_Payment_Admin,
  API_Stream_File_Invoice,
  API_Stream_File_Faktur,
  API_Stream_File_Suratjalan,
  API_Stream_File_PO,
  API_Revert_Admin,
} from '../api/api';
import InvoiceReportWizard from './InvoiceReportWizard'; // Import the wizard modal component
import * as XLSX from 'xlsx';
import { AiFillFilePdf } from 'react-icons/ai';

interface Invoice {
  inv_no: string;
  receipt_number: string | null;
  receipt_path: string | null;
  bp_code: string | null;
  bp_name?: string;
  inv_date: string | null;
  plan_date: string | null;
  actual_date: string | null;
  inv_faktur: string | null;
  inv_faktur_date: string | null;
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

interface BusinessPartner {
  bp_code: string;
  bp_name: string;
  adr_line_1: string;
}

const InvoiceReport: React.FC = () => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [modalInvoiceNumber, setModalInvoiceNumber] = useState('');

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);

  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [searchSupplier, setSearchSupplier] = useState<string>('');

  // Filter states
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [verificationDate, setVerificationDate] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState('');
  const [paymentPlanningDate, setPaymentPlanningDate] = useState('');
  const [creationDate, setCreationDate] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');

  // Column filter states
  const [invoiceNoFilter, setInvoiceNoFilter] = useState('');
  const [invDateFilter, setInvDateFilter] = useState('');
  const [planDateFilter, setPlanDateFilter] = useState('');
  const [actualDateFilter, setActualDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [receiptNoFilter, setReceiptNoFilter] = useState('');
  const [supplierCodeFilter, setSupplierCodeFilter] = useState('');
  const [taxNumberFilter, setTaxNumberFilter] = useState('');
  const [taxDateFilter, setTaxDateFilter] = useState('');
  const [totalDppFilter, setTotalDppFilter] = useState('');
  const [taxBaseFilter, setTaxBaseFilter] = useState('');
  const [taxAmountFilter, setTaxAmountFilter] = useState('');
  const [pphBaseFilter, setPphBaseFilter] = useState('');
  const [pphAmountFilter, setPphAmountFilter] = useState('');
  const [totalAmountFilter, setTotalAmountFilter] = useState('');

  // Data states
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rowsPerPage] = useState(15);

  // Allow multiple 'New' but only single 'In Process' or multiple 'Ready To Payment'
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  
  // Reason popup state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);

  // --- Post Invoice Modal for Actual Date Input ---
  const [actualDate, setActualDate] = useState<string>("");
  const [postModalOpen, setPostModalOpen] = useState(false);

  const supplierOptions = businessPartners.map((bp) => ({
    value: bp.bp_code,
    label: `${bp.bp_code} | ${bp.bp_name}`,
  }));
  const selectedOption = supplierOptions.find((opt) => opt.value === searchSupplier) || null;

  // fetch business partners
  const fetchPartners = async () => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    try {
      const response = await fetch(API_List_Partner_Admin(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch business partners');
      }
      const result = await response.json();
      let partnersList: BusinessPartner[] = [];

      if (result && typeof result === 'object') {
        if (Array.isArray(result.data)) {
          partnersList = result.data.map((partner: any) => ({
            bp_code: partner.bp_code,
            bp_name: partner.bp_name,
            adr_line_1: partner.adr_line_1,
          }));
        } else if (result.data && typeof result.data === 'object') {
          partnersList = Object.values(result.data).map((partner: any) => ({
            bp_code: partner.bp_code,
            bp_name: partner.bp_name,
            adr_line_1: partner.adr_line_1,
          }));
        } else if (Array.isArray(result)) {
          partnersList = result;
        } else if (result.bp_code && result.bp_name) {
          partnersList = [
            {
              bp_code: result.bp_code,
              bp_name: result.bp_name,
              adr_line_1: result.adr_line_1 || '',
            },
          ];
        }
      }

      if (partnersList.length > 0) {
        setBusinessPartners(partnersList);
      } else {
        toast.warn('No business partners found');
      }
    } catch (error) {
      console.error('Error fetching business partners:', error);
      toast.error('Error fetching business partners');
    }
  };

  // fetch invoices
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }
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
      let invoiceList: Invoice[] = [];

      if (result && typeof result === 'object') {
        if (Array.isArray(result.data)) {
          invoiceList = result.data;
        } else if (result.data && typeof result.data === 'object') {
          invoiceList = Object.values(result.data);
        } else if (Array.isArray(result)) {
          invoiceList = result;
        }
      }

      if (invoiceList.length > 0) {
        setData(invoiceList);
        setFilteredData(invoiceList);
      } else {
        toast.warn('No invoice data found');
      }
    } catch (error) {
      console.error('Error fetching invoice data:', error);
      toast.error('Failed to fetch invoice data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, []);

  // Apply column filters
  useEffect(() => {
    let newFiltered = [...data];

    // Apply all column filters
    if (invoiceNoFilter) {
      newFiltered = newFiltered.filter(item => 
        item.inv_no?.toLowerCase().includes(invoiceNoFilter.toLowerCase())
      );
    }
    if (invDateFilter) {
      newFiltered = newFiltered.filter(item => 
        item.inv_date?.includes(invDateFilter)
      );
    }
    if (planDateFilter) {
      newFiltered = newFiltered.filter(item => 
        item.plan_date?.includes(planDateFilter)
      );
    }
    if (actualDateFilter) {
      newFiltered = newFiltered.filter(item => 
        item.actual_date?.includes(actualDateFilter)
      );
    }
    if (statusFilter) {
      newFiltered = newFiltered.filter(item => 
        item.status?.toLowerCase().includes(statusFilter.toLowerCase())
      );
    }
    if (receiptNoFilter) {
      newFiltered = newFiltered.filter(item => 
        item.receipt_number?.toLowerCase().includes(receiptNoFilter.toLowerCase())
      );
    }
    if (supplierCodeFilter) {
      newFiltered = newFiltered.filter(item => 
        item.bp_code?.toLowerCase().includes(supplierCodeFilter.toLowerCase())
      );
    }
    if (taxNumberFilter) {
      newFiltered = newFiltered.filter(item => 
        item.inv_faktur?.toLowerCase().includes(taxNumberFilter.toLowerCase())
      );
    }
    if (taxDateFilter) {
      newFiltered = newFiltered.filter(item => 
        item.inv_faktur_date?.includes(taxDateFilter)
      );
    }
    if (totalDppFilter) {
      const filterAmount = parseFloat(totalDppFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.total_dpp) return false;
          return Math.abs(item.total_dpp - filterAmount) < 0.01 ||
            item.total_dpp.toString().includes(totalDppFilter);
        });
      }
    }
    if (taxBaseFilter) {
      const filterAmount = parseFloat(taxBaseFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.tax_base_amount) return false;
          return Math.abs(item.tax_base_amount - filterAmount) < 0.01 ||
            item.tax_base_amount.toString().includes(taxBaseFilter);
        });
      }
    }
    if (taxAmountFilter) {
      const filterAmount = parseFloat(taxAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.tax_base_amount) return false;
          const taxAmount = item.tax_base_amount * 0.11;
          return Math.abs(taxAmount - filterAmount) < 0.01 ||
            taxAmount.toString().includes(taxAmountFilter);
        });
      }
    }
    if (pphBaseFilter) {
      const filterAmount = parseFloat(pphBaseFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.pph_base_amount) return false;
          return Math.abs(item.pph_base_amount - filterAmount) < 0.01 ||
            item.pph_base_amount.toString().includes(pphBaseFilter);
        });
      }
    }
    if (pphAmountFilter) {
      const filterAmount = parseFloat(pphAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.pph_base_amount) return false;
          const dbPphAmount = item.pph_amount || 0;
          const dbPphBaseAmount = item.pph_base_amount || 0;
          const calculatedPphAmount = dbPphAmount - dbPphBaseAmount;
          return Math.abs(calculatedPphAmount - filterAmount) < 0.01 ||
            calculatedPphAmount.toString().includes(pphAmountFilter);
        });
      }
    }
    if (totalAmountFilter) {
      const filterAmount = parseFloat(totalAmountFilter);
      if (!isNaN(filterAmount)) {
        newFiltered = newFiltered.filter(item => {
          if (!item.total_amount) return false;
          return Math.abs(item.total_amount - filterAmount) < 0.01 ||
            item.total_amount.toString().includes(totalAmountFilter);
        });
      }
    }

    setFilteredData(newFiltered);
    setCurrentPage(1);
  }, [
    data, 
    invoiceNoFilter, 
    invDateFilter, 
    planDateFilter, 
    actualDateFilter, 
    statusFilter, 
    receiptNoFilter, 
    supplierCodeFilter,
    taxNumberFilter,
    taxDateFilter,
    totalDppFilter,
    taxBaseFilter,
    taxAmountFilter,
    pphBaseFilter,
    pphAmountFilter,
    totalAmountFilter
  ]);

  const handleSearch = () => {
    let newFiltered = [...data];

    if (searchSupplier.trim()) {
      newFiltered = newFiltered.filter((row) => {
        const codeMatch = row.bp_code?.toLowerCase().includes(searchSupplier.toLowerCase());
        const nameMatch = row.bp_name?.toLowerCase().includes(searchSupplier.toLowerCase());
        return codeMatch || nameMatch;
      });
    }
    if (invoiceNumber.trim()) {
      newFiltered = newFiltered.filter((row) =>
        row.inv_no?.toLowerCase().includes(invoiceNumber.toLowerCase())
      );
    }
    if (verificationDate) {
      newFiltered = newFiltered.filter((row) => row.actual_date?.slice(0, 10) === verificationDate);
    }
    if (invoiceStatus.trim()) {
      newFiltered = newFiltered.filter((row) =>
        row.status?.toLowerCase().includes(invoiceStatus.toLowerCase())
      );
    }
    if (paymentPlanningDate) {
      newFiltered = newFiltered.filter((row) => row.plan_date?.slice(0, 10) === paymentPlanningDate);
    }
    if (creationDate) {
      newFiltered = newFiltered.filter((row) => row.created_at?.slice(0, 10) === creationDate);
    }
    if (invoiceDate) {
      newFiltered = newFiltered.filter((row) => row.inv_date?.slice(0, 10) === invoiceDate);
    }

    setFilteredData(newFiltered);
    setCurrentPage(1);
  };

  const handleClear = () => {
    setSearchSupplier('');
    setInvoiceNumber('');
    setVerificationDate('');
    setInvoiceStatus('');
    setPaymentPlanningDate('');
    setCreationDate('');
    setInvoiceDate('');
    
    // Clear column filters
    setInvoiceNoFilter('');
    setInvDateFilter('');
    setPlanDateFilter('');
    setActualDateFilter('');
    setStatusFilter('');
    setReceiptNoFilter('');
    setSupplierCodeFilter('');
    setTaxNumberFilter('');
    setTaxDateFilter('');
    setTotalDppFilter('');
    setTaxBaseFilter('');
    setTaxAmountFilter('');
    setPphBaseFilter('');
    setPphAmountFilter('');
    setTotalAmountFilter('');
    
    setFilteredData(data);
    setCurrentPage(1);
    setSelectedInvoices([]);
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

  // --- MODIFIED: Multi-record selection logic ---
  const handleRecordSelection = (invoice: Invoice) => {
    const exists = selectedInvoices.find((inv) => inv.inv_no === invoice.inv_no);
    const invoiceStatusLower = invoice.status?.toLowerCase();

    // If user clicks a row that's already selected, just toggle it off:
    if (exists) {
      setSelectedInvoices([]);
      return;
    }

    // For "New", "In Process", or "Ready To Payment" status, only allow selecting ONE at a time
    if (
      invoiceStatusLower === 'new' ||
      invoiceStatusLower === 'in process' ||
      invoiceStatusLower === 'ready to payment'
    ) {
      setSelectedInvoices([invoice]);
    }
  };

  const handleVerify = async () => {
    if (selectedInvoices.length === 0) {
      toast.warning('Please select one invoice');
      return;
    }

    const selectedInvoice = selectedInvoices[0];
    const selectedStatus = selectedInvoice.status?.toLowerCase();

    // If the selected invoice is 'New' or 'In Process', open the wizard
    if (selectedStatus === 'new' || selectedStatus === 'in process') {
      // If 'New', update to 'In Process' first (keep your previous logic)
      if (selectedStatus === 'new') {
        try {
          const token = localStorage.getItem('access_token');
          if (!token) {
            toast.error('No access token found');
            return;
          }

          const response = await fetch(
            API_Update_Status_To_In_Process_Finance() + `/${selectedInvoice.inv_no}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'In Process' }),
            }
          );

          if (!response.ok) {
            throw new Error(`Failed to update invoice ${selectedInvoice.inv_no}`);
          }

          toast.success('Invoice updated to "In Process"!');

          // Update local data
          const updatedData = data.map((inv) => {
            if (inv.inv_no === selectedInvoice.inv_no) {
              return { ...inv, status: 'In Process' };
            }
            return inv;
          });

          setData(updatedData);
          setFilteredData(updatedData);
        } catch (err: any) {
          toast.error(err.message || 'Error updating invoice status');
          return;
        }
      }
      // Open the wizard with the invoice number (for both 'new' and 'in process')
      setModalInvoiceNumber(selectedInvoice.inv_no);
      setWizardOpen(true);
      return;
    }
    // If selected invoice is 'Ready To Payment', allow posting it
    else if (selectedStatus === 'ready to payment') {
      // This will be handled by the Post Invoice button
    } else {
      toast.warning('Selected invoice status cannot be processed');
    }
  };

  const handleCancelInvoice = () => {
    toast.info('Invoice cancelled');
    fetchInvoices();
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
      'PPh Amount', // Header remains the same
      'Total Amount',
    ];
    const bpAdrMap = businessPartners.reduce((acc, bp) => {
      acc[bp.bp_code] = bp.adr_line_1;
      return acc;
    }, {} as Record<string, string>);

    // Helper to format as Rp string
    const formatRp = (amount: number | null | undefined) => {
      if (amount === null || amount === undefined || isNaN(Number(amount))) return '-';
      return Number(amount).toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
    };

    const rows = filteredData.map((inv) => {
      const dbPphAmountExcel = inv.pph_amount || 0;
      const dbPphBaseAmountExcel = inv.pph_base_amount || 0;
      const calculatedPphAmountExcel = dbPphAmountExcel - dbPphBaseAmountExcel;

      return [
        inv.inv_no || '-',
        inv.inv_date || '-',
        inv.plan_date || '-',
        inv.actual_date || '-',
        inv.status || '-',
        inv.receipt_number || '-',
        inv.bp_code || '-',
        bpAdrMap[inv.bp_code || ''] || '-',
        inv.inv_faktur || '-',
        inv.inv_faktur_date || '-',
        inv.total_dpp != null ? formatRp(inv.total_dpp) : '-',
        inv.tax_base_amount != null ? formatRp(inv.tax_base_amount) : '-',
        inv.tax_base_amount != null ? formatRp(inv.tax_base_amount * 0.11) : '0',
        inv.pph_base_amount != null ? formatRp(inv.pph_base_amount) : '-',
        formatRp(calculatedPphAmountExcel),
        inv.total_amount != null ? formatRp(inv.total_amount) : '-',
      ];
    });

    const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
    ws['!cols'] = [
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 40 },
      { wch: 22 },
      { wch: 18 },
      { wch: 22 },
      { wch: 22 },
      { wch: 26 },
      { wch: 22 },
      { wch: 22 },
      { wch: 22 },
    ];

    // Apply currency format to relevant columns (Total DPP, Tax Base Amount, Tax Amount, PPh Base Amount, PPh Amount, Total Amount)
    // These are columns 11-16 (0-based: 10-15)
    for (let r = 1; r <= filteredData.length; r++) {
      for (let c of [10, 11, 12, 13, 14, 15]) {
        const cellRef = XLSX.utils.encode_cell({ r, c });
        if (ws[cellRef]) {
          ws[cellRef].z = '\"Rp\" #,##0.00'; // Custom format string
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
    XLSX.writeFile(wb, 'Invoice_Report.xlsx');
  };

  // --- Post Invoice handler ---
  const handlePostInvoice = () => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      inv => inv.status?.toLowerCase() === 'ready to payment'
    );
    if (readyToPaymentInvoices.length === 0) {
      toast.warning('Please select invoices with "Ready To Payment" status');
      return;
    }
    setPostModalOpen(true);
  };

  const handleSubmitActualDate = async () => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      inv => inv.status?.toLowerCase() === 'ready to payment'
    );
    if (!actualDate) {
      toast.error('Please select an Actual Date');
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
      for (const invoice of readyToPaymentInvoices) {
        const response = await fetch(API_Upload_Payment_Admin(invoice.inv_no), {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ actual_date: actualDate }),
        });
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to update actual date');
        }
      }
      toast.success('Actual date updated successfully!');
      setPostModalOpen(false);
      setSelectedInvoices([]);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.message || 'Error updating actual date');
    }
  };

  // Revert paid invoices back to Ready To Payment
  const handleRevertInvoice = async (invNo: string) => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) throw new Error('No token');
      const res = await fetch(`${API_Revert_Admin()}/${invNo}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to revert');
      toast.success('Invoice reverted to Ready To Payment');
      fetchInvoices();
    } catch (err: any) {
      toast.error('Error reverting invoice: ' + (err.message || ''));
    }
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

  const formatCurrency = (amount: number | null | undefined) => {
    if (amount === null || amount === undefined || isNaN(Number(amount))) {
      return '-';
    }
    return Number(amount).toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Click handler for showing invoice detail modal
  const handleShowDetail = (invoice: Invoice) => {
    setDetailInvoice(invoice);
    setDetailModalOpen(true);
  };

  // Close detail modal
  const closeDetailModal = () => {
    setDetailInvoice(null);
    setDetailModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Report" />
      <ToastContainer />

      <div className="space-y-2">
        <div className="w-1/3 items-center">
          <Select
            options={supplierOptions}
            value={selectedOption}
            onChange={(option) => setSearchSupplier(option?.value ?? '')}
            className="w-full text-xs"
            styles={{
              control: (base) => ({
                ...base,
                borderColor: '#9867C5',
                padding: '1px',
                borderRadius: '6px',
                fontSize: '14px',
              }),
            }}
            isLoading={isLoading}
            placeholder="Select Supplier"
          />
        </div>
      </div>

      <form className="space-y-4">
        <div className="flex space-x-4">
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

      <h3 className="text-xl font-semibold text-gray-700">Invoice List</h3>
      <div className="bg-white p-6 space-y-6 mt-8">
        <div className="flex justify-between mb-8">
          <div style={{ display: 'flex', gap: '1rem' }}>
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
            <button
              className="bg-green-600 text-sm text-white px-4 py-2 rounded hover:bg-green-500 ml-4"
              onClick={handleVerify}
              type="button"
            >
              Verify
            </button>
            <button
              className={`text-sm text-white px-4 py-2 rounded ml-4 ${
                selectedInvoices.some(inv => inv.status?.toLowerCase() === 'ready to payment')
                  ? 'bg-blue-900 hover:bg-blue-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={handlePostInvoice}
              type="button"
              disabled={!selectedInvoices.some(inv => inv.status?.toLowerCase() === 'ready to payment')}
            >
              Post Invoice
            </button>
          </div>
        </div>

        {/* Updated Table Design */}
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
                {/* Document column with 4 sub-columns */}
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[300px]" colSpan={4}>
                  Document
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[180px]">Status</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Receipt No</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Supplier Code</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[130px]">Tax Number</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[120px]">Tax Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Total DPP</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[180px]">
                  Tax Base Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[190px]">
                  Tax Amount (11%)
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[180px]">
                  PPh Base Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">PPh Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">Total Amount</th>
              </tr>
              <tr className="bg-gray-100 border">
                <th colSpan={3}></th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">Plan</th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[120px]">Actual</th>
                {/* Document sub-columns */}
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">INVOICE</th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">FAKTUR</th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">SURAT JALAN</th>
                <th className="px-3 py-2 text-md text-gray-600 text-center border min-w-[75px]">PO</th>
                <th colSpan={11}></th>
              </tr>
              {/* Filter inputs row (skip Document columns) */}
              <tr className="bg-gray-50 border">
                <td className="px-2 py-1 border"></td>
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
                    value={supplierCodeFilter}
                    onChange={(e) => setSupplierCodeFilter(e.target.value)}
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
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
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
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
                    <input
                      type="number"
                      placeholder="-"
                      value={taxBaseFilter}
                      onChange={(e) => setTaxBaseFilter(e.target.value)}
                      className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                    />
                  </div>
                </td>
                <td className="px-2 py-1 border">
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
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
                  <div className="relative flex items-center">
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
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
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
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
                    <span className="absolute left-2 text-gray-500 text-xs">Rp.</span>
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
                  <td colSpan={20} className="px-4 py-4 text-center text-gray-500"> {/* Adjusted colSpan if needed */}
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                paginatedData.map((invoice) => {
                  const isSelected = selectedInvoices.some(
                    (inv) => inv.inv_no === invoice.inv_no
                  );
                  const invoiceStatusLower = invoice.status?.toLowerCase();
                  const statusColor = getStatusColor(invoice.status);

                  let showCheckbox = false;

                  if (invoiceStatusLower === 'new' || invoiceStatusLower === 'in process') {
                    const hasSelected = selectedInvoices.some(
                      inv => inv.status?.toLowerCase() === invoiceStatusLower
                    );
                    showCheckbox = !hasSelected || isSelected;
                  } else if (invoiceStatusLower === 'ready to payment') {
                    const hasSelectedReadyToPayment = selectedInvoices.some(
                      inv => inv.status?.toLowerCase() === 'ready to payment'
                    );
                    showCheckbox = !hasSelectedReadyToPayment || isSelected;
                  } else {
                    showCheckbox = false;
                  }

                  const dbPphAmount = invoice.pph_amount || 0;
                  const dbPphBaseAmount = invoice.pph_base_amount || 0;
                  const calculatedPphAmount = dbPphAmount - dbPphBaseAmount;

                  return (
                    <tr key={invoice.inv_no} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-2 text-center">
                        {showCheckbox ? (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRecordSelection(invoice)}
                          />
                        ) : null}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleShowDetail(invoice)}
                          className="text-blue-600 underline"
                        >
                          {invoice.inv_no}
                        </button>
                      </td>
                      <td className="px-6 py-4 text-center">{formatDate(invoice.inv_date)}</td>
                      <td className="px-6 py-4 text-center">{formatDate(invoice.plan_date)}</td>
                      <td className="px-6 py-4 text-center">{formatDate(invoice.actual_date)}</td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() => window.open(`${API_Stream_File_Invoice()}/INVOICE_${invoice.inv_no}.pdf`, '_blank', 'noopener,noreferrer')}
                            title="View Invoice PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() => window.open(`${API_Stream_File_Faktur()}/FAKTURPAJAK_${invoice.inv_no}.pdf`, '_blank', 'noopener,noreferrer')}
                            title="View Faktur Pajak PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() => window.open(`${API_Stream_File_Suratjalan()}/SURATJALAN_${invoice.inv_no}.pdf`, '_blank', 'noopener,noreferrer')}
                            title="View Surat Jalan PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() => window.open(`${API_Stream_File_PO()}/PO_${invoice.inv_no}.pdf`, '_blank', 'noopener,noreferrer')}
                            title="View Purchase Order PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${statusColor} ${
                            invoice.status?.toLowerCase() === 'rejected' || invoice.status?.toLowerCase() === 'paid' ? 'cursor-pointer hover:underline' : ''
                          }`}
                          onClick={() => {
                            if (invoice.status?.toLowerCase() === 'rejected') handleShowRejectedReason(invoice.reason);
                            if (invoice.status?.toLowerCase() === 'paid') handleRevertInvoice(invoice.inv_no);
                          }}
                          title={
                            invoice.status?.toLowerCase() === 'rejected'
                              ? 'View rejection reason'
                              : invoice.status?.toLowerCase() === 'paid'
                              ? 'Click to revert to Ready To Payment'
                              : ''
                          }
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">{invoice.receipt_number || '-'}</td>
                      <td className="px-6 py-4 text-center">{invoice.bp_code || '-'}</td>
                      <td className="px-6 py-4 text-center">{invoice.inv_faktur || '-'}</td>
                      <td className="px-6 py-4 text-center">{formatDate(invoice.inv_faktur_date)}</td>
                      <td className="px-6 py-4 text-center">{formatCurrency(invoice.total_dpp)}</td>
                      <td className="px-6 py-4 text-center">{formatCurrency(invoice.tax_base_amount)}</td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(invoice.tax_base_amount ? invoice.tax_base_amount * 0.11 : null)}
                      </td>
                      <td className="px-6 py-4 text-center">{formatCurrency(invoice.pph_base_amount)}</td>
                      <td className="px-6 py-4 text-center">
                        {formatCurrency(calculatedPphAmount)}
                      </td>
                      <td className="px-6 py-4 text-center">{formatCurrency(invoice.total_amount)}</td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={20} className="px-4 py-4 text-center text-gray-500"> {/* Adjusted colSpan if needed */}
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
          <div className="bg-white p-6 rounded-md shadow-lg max-w-3xl w-full">
            <h2 className="text-xl font-semibold mb-4">
              Invoice Detail - {detailInvoice.inv_no}
            </h2>
            <div className="space-y-2 mb-4">
              {(() => {
                const partner = businessPartners.find(bp => bp.bp_code === detailInvoice.bp_code);
                return (
                  <p>
                    <strong>Supplier:</strong> {detailInvoice.bp_code} — {partner ? partner.adr_line_1 : "-"}
                  </p>
                );
              })()}
              <p>
                <strong>Date:</strong> {formatDate(detailInvoice.inv_date)}
              </p>
              <p>
                <strong>Status:</strong> {detailInvoice.status}
              </p>
              <p>
                <strong>Total Amount:</strong> {formatCurrency(detailInvoice.total_amount)}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Invoice Lines</h3>
              {Array.isArray((detailInvoice as any).inv_lines) && (detailInvoice as any).inv_lines.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-gray-200 text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 border">GR No</th>
                        <th className="px-3 py-2 border">PO No</th>
                        <th className="px-3 py-2 border">Part No</th>
                        <th className="px-3 py-2 border">Item Description</th>
                        <th className="px-3 py-2 border">Receipt Amount</th>
                        <th className="px-3 py-2 border">Unit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(detailInvoice as any).inv_lines.map((line: any) => (
                        <tr key={line.inv_line_id}>
                          <td className="px-3 py-2 border text-center">{line.gr_no}</td>
                          <td className="px-3 py-2 border text-center">{line.po_no}</td>
                          <td className="px-3 py-2 border text-center">{line.part_no}</td>
                          <td className="px-3 py-2 border">{line.item_desc}</td>
                          <td className="px-3 py-2 border text-right">{line.receipt_amount}</td>
                          <td className="px-3 py-2 border text-center">{line.unit}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center text-gray-500">No line items found.</div>
              )}
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

      {/* Render the wizard modal here */}
      <InvoiceReportWizard
        isOpen={wizardOpen}
        onClose={() => {
          setWizardOpen(false);
          fetchInvoices();
        }}
        invoiceNumberProp={modalInvoiceNumber}
      />
      
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

      {/* Post Invoice Modal for Actual Date */}
      {postModalOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-96">
            <h2 className="text-xl font-semibold mb-4">Set Actual Date</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Actual Date</label>
              <input
                type="date"
                value={actualDate}
                onChange={e => setActualDate(e.target.value)}
                className="w-full border border-gray-300 rounded-md p-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setPostModalOpen(false)}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                type="button"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitActualDate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                type="button"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InvoiceReport;