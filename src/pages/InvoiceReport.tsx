import React, { useState, useEffect, ReactNode } from 'react';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import { Search, XCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import {
  API_Inv_Header_Admin,
  API_Inv_Header_By_Inv_No_Admin,
  API_List_Partner_Admin,
  API_Update_Status_To_In_Process_Finance,
  API_Upload_Payment_Admin,
  API_Stream_File_Invoice,
  API_Stream_File_Faktur,
  API_Stream_File_Suratjalan,
  API_Stream_File_PO,
  API_Stream_File_Receipt,
  API_Revert_Invoice_Admin,
  API_Revert_Invoice_In_Process_Admin,
} from '../api/api';
import InvoiceReportWizard from './InvoiceReportWizard'; // Import the wizard modal component
import * as XLSX from 'xlsx';
import { AiFillFilePdf } from 'react-icons/ai';
import { MdUndo } from 'react-icons/md';

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

const InvoiceReport: React.FC = (): ReactNode => {
  const [wizardOpen, setWizardOpen] = useState(false);
  const [modalInvoiceNumber, setModalInvoiceNumber] = useState('');

  // Detail modal states
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailInvoice, setDetailInvoice] = useState<Invoice | null>(null);
  const [detailInvoiceLines, setDetailInvoiceLines] = useState<any[]>([]);
  const [detailLinesLoading, setDetailLinesLoading] = useState(false);
  const [detailCurrentPage, setDetailCurrentPage] = useState(1);
  const [detailRowsPerPage] = useState(7);

  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>(
    [],
  );
  const [searchSupplier, setSearchSupplier] = useState<string>('');
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

  // Allow multiple 'New' but only single 'In Process' or multiple 'Ready To Payment'
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);

  // Reason popup state
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);

  // --- Post Invoice Modal for Actual Date Input ---
  const [actualDate, setActualDate] = useState<string>('');
  const [postModalOpen, setPostModalOpen] = useState(false);

  const supplierOptions = businessPartners.map((bp) => ({
    value: bp.bp_code,
    label: `${bp.bp_code} | ${bp.bp_name}`,
  }));
  const selectedOption =
    supplierOptions.find((opt) => opt.value === searchSupplier) || null;

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
  const [totalItems, setTotalItems] = useState(0);

  // fetch invoices - no pagination params, get all data
  const fetchInvoices = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        throw new Error('No access token found');
      }

      // Construct URL with query parameters (no page/per_page)
      const queryParams = new URLSearchParams();

      if (searchSupplier) queryParams.append('bp_code', searchSupplier);
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
      let invoiceList: Invoice[] = [];

      // Handle new API response format with data and filter_info
      if (result && typeof result === 'object') {
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
          // Handle legacy response if any
          invoiceList = result;
          setTotalItems(result.length);
        }
      }

      setData(invoiceList);
      setFilteredData(invoiceList);
      setCurrentPage(1); // Reset to first page when data changes

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

  // Apply column filters (client-side on the current page)
  useEffect(() => {
    let newFiltered = [...data];

    // Apply all column filters
    if (invoiceNoFilter) {
      newFiltered = newFiltered.filter(
        (item) =>
          item.inv_no?.toLowerCase().includes(invoiceNoFilter.toLowerCase()),
      );
    }
    // ... (other column filters remain same, operating on current page data)
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
    
    // Also apply valid client-side search (like invoiceNumber which is not on backend yet for this task) - REMOVED since it is now on backend
    /* if (invoiceNumber.trim()) {
       newFiltered = newFiltered.filter(
        (row) =>
          row.inv_no?.toLowerCase().includes(invoiceNumber.toLowerCase()),
      );
    } */


    setFilteredData(newFiltered);
    // Do NOT reset currentPage here as we are on a specific server page
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
    invoiceNumber, // Added invoiceNumber here as client side filter on top of server page
  ]);

  const handleSearch = () => {
      fetchInvoices();
  };
  const handleClear = () => {
    setSearchSupplier('');
    setInvoiceNumber('');
    setInvoiceStatus('');
    setPaymentPlanningDate('');
    setInvoiceDateFrom('');
    setInvoiceDateTo('');

    // Clear column filters
    setInvoiceNoFilter('');
    setInvDateFilter('');
    setSubmitDateFilter('');
    setPlanDateFilter('');
    setActualDateFilter('');
    setStatusFilter('');
    setReceiptNoFilter('');
    setSupplierCodeFilter('');
    setTaxNumberFilter('');
    setTaxDateFilter('');
    setTotalDppFilter('');
    setTaxAmountFilter('');
    setPphDescFilter('');
    setPphBaseFilter('');
    setPphAmountFilter('');
    setTotalAmountFilter('');

    setFilteredData([]); // Use empty or data, but fetchInvoices will refill it
    // Reset to first page without filters
    fetchInvoices();
    setSelectedInvoices([]);
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
  const handleRecordSelection = (invoice: Invoice) => {
    const { status } = invoice;
    const statusLower = status?.toLowerCase();

    setSelectedInvoices((prevSelectedInvoices) => {
      let newSelectedInvoices: Invoice[] = [];
      const isCurrentlySelected = prevSelectedInvoices.some(
        (inv) => inv.inv_id === invoice.inv_id,
      );

      if (statusLower === 'new' || statusLower === 'in process') {
        // Single select logic for 'New' or 'In Process'
        if (isCurrentlySelected) {
          newSelectedInvoices = [];
        } else {
          newSelectedInvoices = [invoice];
        }
      } else if (statusLower === 'ready to payment' || statusLower === 'paid') {
        // Multi-select logic for 'Ready To Payment' or 'Paid'
        if (isCurrentlySelected) {
          newSelectedInvoices = prevSelectedInvoices.filter(
            (inv) => inv.inv_id !== invoice.inv_id,
          );
        } else {
          const hasNewOrInProcessSelected = prevSelectedInvoices.some(
            (inv) =>
              inv.status?.toLowerCase() === 'new' ||
              inv.status?.toLowerCase() === 'in process',
          );

          if (hasNewOrInProcessSelected) {
            newSelectedInvoices = [invoice]; // Start fresh if 'New' or 'In Process' was selected
          } else {
            const currentSelectionType =
              prevSelectedInvoices.length > 0
                ? prevSelectedInvoices[0].status?.toLowerCase()
                : null;
            // If there's an existing selection and its type is different from the clicked item's type
            // (and both are multi-selectable types like 'ready to payment' or 'paid')
            // then start a new selection with the clicked item.
            if (
              currentSelectionType &&
              currentSelectionType !== statusLower &&
              (currentSelectionType === 'ready to payment' ||
                currentSelectionType === 'paid') &&
              (statusLower === 'ready to payment' || statusLower === 'paid')
            ) {
              newSelectedInvoices = [invoice];
            } else {
              // Otherwise, add to the current selection (or start a new one if no prior selection)
              newSelectedInvoices = [...prevSelectedInvoices, invoice];
            }
          }
        }
      } else {
        // For other statuses (e.g., 'Rejected'), or if status is undefined, clicking does not change selection.
        newSelectedInvoices = [...prevSelectedInvoices];
      }
      return newSelectedInvoices;
    });
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
            API_Update_Status_To_In_Process_Finance() +
              `/${selectedInvoice.inv_id}`,
            {
              method: 'PUT',
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ status: 'In Process' }),
            },
          );

          if (!response.ok) {
            throw new Error(
              `Failed to update invoice ${selectedInvoice.inv_no}`,
            );
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
      // Open the wizard with the invoice ID (for both 'new' and 'in process')
      setModalInvoiceNumber(selectedInvoice.inv_id.toString());
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
      'Supplier Name',
      'Tax Number',
      'Tax Date',
      'Total DPP',
      'Tax Amount (Preview 11%)',
      'PPh Description',
      'PPh Base Amount',
      'PPh Amount', // Header remains the same
      'Total Amount',
    ];
    const bpAdrMap = businessPartners.reduce(
      (acc, bp) => {
        acc[bp.bp_code] = bp.adr_line_1;
        return acc;
      },
      {} as Record<string, string>,
    );

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
        bpAdrMap[inv.bp_code || ''] || '',
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
      { wch: 20 }, // Supplier Code
      { wch: 20 }, // Invoice No
      { wch: 18 }, // Inv Date
      { wch: 18 }, // Submit Date
      { wch: 18 }, // Plan Date
      { wch: 18 }, // Actual Date
      { wch: 20 }, // Status
      { wch: 20 }, // Receipt Doc
      { wch: 40 }, // Supplier Name
      { wch: 22 }, // Tax Number
      { wch: 18 }, // Tax Date
      { wch: 22 }, // Total DPP
      { wch: 26 }, // Tax Amount (11%)
      { wch: 20 }, // PPh Description
      { wch: 22 }, // PPh Base Amount
      { wch: 22 }, // PPh Amount
      { wch: 22 }, // Total Amount
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Invoice Report');
    XLSX.writeFile(wb, 'Invoice_Report.xlsx');
  };

  // --- Post Invoice handler ---
  const handlePostInvoice = () => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      (inv) => inv.status?.toLowerCase() === 'ready to payment',
    );
    if (readyToPaymentInvoices.length === 0) {
      toast.warning('Please select invoices with "Ready To Payment" status');
      return;
    }
    setPostModalOpen(true);
  };
  const handleSubmitActualDate = async () => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      (inv) => inv.status?.toLowerCase() === 'ready to payment',
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
      // Use inv_id for individual invoice updates (only selected invoices)
      const invNos = readyToPaymentInvoices.map((inv) => inv.inv_id);
      const response = await fetch(API_Upload_Payment_Admin(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inv_ids: invNos, actual_date: actualDate }),
      });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to update actual dates');
      }
      toast.success('Actual date updated successfully!');
      setPostModalOpen(false);
      setSelectedInvoices([]);
      fetchInvoices();
    } catch (error: any) {
      toast.error(error.message || 'Error updating actual date');
    }
  }; // NEW: Bulk revert method for multiple "Paid" invoices
  const handleBulkRevertInvoices = async () => {
    const paidInvoices = selectedInvoices.filter(
      (inv) => inv.status?.toLowerCase() === 'paid',
    );

    if (paidInvoices.length === 0) {
      toast.warning('Please select invoices with "Paid" status to revert');
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token)
        throw new Error('No access token found. Please log in again.');

      // Use inv_id (invoice IDs) to revert only the specifically selected invoices
      const invoiceNumbers = paidInvoices.map((inv) => inv.inv_id);
      const response = await fetch(API_Revert_Invoice_Admin(), {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ invoice_numbers: invoiceNumbers }),
      });

      if (response.ok) {
        let successMessage = `${invoiceNumbers.length} invoice(s) reverted to Ready To Payment status.`;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const result = await response.json();
            successMessage = result.message || successMessage;
          }
        } catch (jsonError) {
          console.warn('Could not parse success response as JSON:', jsonError);
        }

        toast.success(successMessage);
        fetchInvoices();
        setSelectedInvoices([]);
      } else {
        let errorMessage = `Failed to revert invoices. Status: ${response.status}`;

        try {
          const contentType = response.headers.get('content-type');
          if (contentType && contentType.includes('application/json')) {
            const errorResult = await response.json();
            errorMessage = errorResult.message || errorMessage;

            // If there are specific invoices that weren't found, show them
            if (errorResult.not_found && Array.isArray(errorResult.not_found)) {
              errorMessage += `\nInvoices not found or not in Paid status: ${errorResult.not_found.join(
                ', ',
              )}`;
            }
          }
        } catch (jsonError) {
          console.warn('Could not parse error response as JSON:', jsonError);
        }

        toast.error(errorMessage);
      }
    } catch (err: any) {
      console.error('Error reverting invoices:', err);
      toast.error(`Error reverting invoices: ${err.message}`);
    }
  };

  // NEW: Individual revert method for "Ready To Payment" invoices back to "In Process"
  const handleRevertToInProcess = async (invoice: Invoice) => {
    if (invoice.status?.toLowerCase() !== 'ready to payment') {
      toast.warning(
        'Only invoices with "Ready To Payment" status can be reverted',
      );
      return;
    }

    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('No access token found. Please log in again.');
        return;
      }

      const response = await fetch(
        API_Revert_Invoice_In_Process_Admin() + `/${invoice.inv_id}`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `Failed to revert invoice ${invoice.inv_no} to In Process`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.message || errorMessage;
        } catch (parseError) {
          // If not JSON, use the raw text or default message
          errorMessage = errorText || errorMessage;
        }

        throw new Error(errorMessage);
      }

      // Parse success response
      const result = await response.json();
      const successMessage =
        result.message ||
        `Invoice ${invoice.inv_no} reverted to "In Process" successfully!`;

      toast.success(successMessage);

      // Update local data - the API clears PPH data and resets total_amount
      const updatedData = data.map((inv) => {
        if (inv.inv_id === invoice.inv_id) {
          return {
            ...inv,
            status: 'In Process',
            plan_date: null,
            receipt_path: null,
            receipt_number: null,
            pph_id: null,
            pph_base_amount: null,
            pph_amount: null,
            // API calculates original total_amount (tax_base_amount + tax_amount)
            total_amount: (inv.tax_base_amount || 0) + (inv.tax_amount || 0),
          };
        }
        return inv;
      });

      setData(updatedData);
      setFilteredData(updatedData);
    } catch (err: any) {
      toast.error(err.message || 'Error reverting invoice to In Process');
    }
  };

  // Client-side pagination: slice filteredData based on currentPage
  const startIndex = (currentPage - 1) * rowsPerPage;
  const endIndex = startIndex + rowsPerPage;
  const paginatedData = filteredData.slice(startIndex, endIndex);

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

  // Get PPh Description based on pph_id (same logic as InvoiceReportWizard)
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

  // Click handler for showing invoice detail modal - fetches invoice lines from API
  const handleShowDetail = async (invoice: Invoice) => {
    setDetailInvoice(invoice);
    setDetailInvoiceLines([]);
    setDetailModalOpen(true);
    setDetailLinesLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const res = await fetch(
        API_Inv_Header_By_Inv_No_Admin() + invoice.inv_id,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) {
        const json = await res.json();
        setDetailInvoiceLines(json.data?.inv_lines || []);
      } else {
        toast.error('Failed to fetch invoice lines');
      }
    } catch {
      toast.error('Error fetching invoice lines');
    } finally {
      setDetailLinesLoading(false);
    }
  };

  // Close detail modal
  const closeDetailModal = () => {
    setDetailInvoice(null);
    setDetailInvoiceLines([]);
    setDetailModalOpen(false);
    setDetailCurrentPage(1);
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
      </div>{' '}
      <form className="space-y-4">
        <div className="flex space-x-4">
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
          </div>{' '}
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
      <h3 className="text-xl font-semibold text-gray-700">Invoice List</h3>{' '}
      <div className="bg-white p-6 space-y-6 mt-8">
        {' '}
        <div className="flex justify-between mb-8">
          <div style={{ display: 'flex', gap: '1rem' }}>
            {/* New bulk revert button for Paid invoices */}
            <button
              className={`text-sm text-white px-4 py-2 rounded ${
                selectedInvoices.some(
                  (inv) => inv.status?.toLowerCase() === 'paid',
                )
                  ? 'bg-orange-600 hover:bg-orange-700'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={handleBulkRevertInvoices}
              type="button"
              disabled={
                !selectedInvoices.some(
                  (inv) => inv.status?.toLowerCase() === 'paid',
                )
              }
              title="Revert selected Paid invoices back to Ready To Payment status"
            >
              Revert Invoices
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
                selectedInvoices.some(
                  (inv) => inv.status?.toLowerCase() === 'ready to payment',
                )
                  ? 'bg-blue-900 hover:bg-blue-800'
                  : 'bg-gray-400 cursor-not-allowed'
              }`}
              onClick={handlePostInvoice}
              type="button"
              disabled={
                !selectedInvoices.some(
                  (inv) => inv.status?.toLowerCase() === 'ready to payment',
                )
              }
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
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[180px]">
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
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[190px]">
                  Tax Amount (11%)
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[160px]">
                  PPh Description
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[180px]">
                  PPh Base Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  PPh Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[170px]">
                  Total Amount
                </th>
                <th className="px-3 py-2 text-gray-700 text-center border min-w-[100px]">
                  Action
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
                <td className="px-2 py-1 border"></td>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td
                    colSpan={22}
                    className="px-4 py-4 text-center text-gray-500"
                  >
                    {' '}
                    {/* Adjusted colSpan to 22 */}
                    Loading...
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                paginatedData.map((invoice) => {
                  const isSelected = selectedInvoices.some(
                    (inv) => inv.inv_id === invoice.inv_id,
                  );
                  const currentInvoiceStatusLower =
                    invoice.status?.toLowerCase();
                  let showCheckbox = false;

                  if (
                    currentInvoiceStatusLower === 'new' ||
                    currentInvoiceStatusLower === 'in process' ||
                    currentInvoiceStatusLower === 'ready to payment' ||
                    currentInvoiceStatusLower === 'paid'
                  ) {
                    if (selectedInvoices.length === 0) {
                      // Case 1: Nothing is selected. Show checkbox for any selectable type.
                      showCheckbox = true;
                    } else {
                      // Case 2: Something is selected.
                      const firstSelectedInvoice = selectedInvoices[0];
                      const firstSelectedStatusLower =
                        firstSelectedInvoice.status?.toLowerCase();
                      if (
                        firstSelectedStatusLower === 'new' ||
                        firstSelectedStatusLower === 'in process'
                      ) {
                        // Subcase 2a: A 'New' or 'In Process' invoice is selected.
                        // Show checkbox ONLY for that specific selected invoice.
                        if (invoice.inv_id === firstSelectedInvoice.inv_id) {
                          showCheckbox = true;
                        }
                      } else if (
                        firstSelectedStatusLower === 'ready to payment'
                      ) {
                        // Subcase 2b: 'Ready to Payment' invoice(s) are selected.
                        // Show checkbox ONLY for other 'Ready to Payment' invoices.
                        if (currentInvoiceStatusLower === 'ready to payment') {
                          showCheckbox = true;
                        }
                      } else if (firstSelectedStatusLower === 'paid') {
                        // Subcase 2c: 'Paid' invoice(s) are selected.
                        // Show checkbox ONLY for other 'Paid' invoices.
                        if (currentInvoiceStatusLower === 'paid') {
                          showCheckbox = true;
                        }
                      }
                    }
                  }

                  return (
                    <tr
                      key={invoice.inv_id}
                      className="border-b hover:bg-gray-50"
                    >
                      <td className="px-4 py-2 text-center">
                        {showCheckbox && (
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleRecordSelection(invoice)}
                            className="form-checkbox h-5 w-5 text-blue-600"
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.bp_code || '-'}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => handleShowDetail(invoice)}
                          className="text-blue-600 underline"
                        >
                          {invoice.inv_no}
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
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() =>
                              window.open(
                                `${API_Stream_File_Invoice()}/INVOICE_${
                                  invoice.inv_id
                                }.pdf`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="View Invoice PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() =>
                              window.open(
                                `${API_Stream_File_Faktur()}/FAKTURPAJAK_${
                                  invoice.inv_id
                                }.pdf`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="View Faktur Pajak PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() =>
                              window.open(
                                `${API_Stream_File_Suratjalan()}/SURATJALAN_${
                                  invoice.inv_id
                                }.pdf`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="View Surat Jalan PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_no && (
                          <button
                            onClick={() =>
                              window.open(
                                `${API_Stream_File_PO()}/PO_${
                                  invoice.inv_id
                                }.pdf`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="View Purchase Order PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>{' '}
                      <td className="px-6 py-4 text-center">
                        {' '}
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded-full text-white ${getStatusColor(
                            invoice.status,
                          )} ${
                            invoice.status?.toLowerCase() === 'rejected'
                              ? 'cursor-pointer hover:underline'
                              : ''
                          }`}
                          onClick={() => {
                            if (invoice.status?.toLowerCase() === 'rejected') {
                              handleShowRejectedReason(invoice.reason);
                            }
                          }}
                          title={
                            invoice.status?.toLowerCase() === 'rejected'
                              ? 'View rejection reason'
                              : ''
                          }
                        >
                          {invoice.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {invoice.inv_id && (
                          <button
                            onClick={() =>
                              window.open(
                                `${API_Stream_File_Receipt()}/RECEIPT_${
                                  invoice.inv_id
                                }.pdf`,
                                '_blank',
                                'noopener,noreferrer',
                              )
                            }
                            title="View Receipt PDF"
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
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
                      <td className="px-6 py-4 text-center">
                        {invoice.status?.toLowerCase() ===
                          'ready to payment' && (
                          <button
                            onClick={() => handleRevertToInProcess(invoice)}
                            className="text-orange-600 hover:text-orange-800 transition-colors"
                            title="Revert to In Process"
                          >
                            <MdUndo className="text-xl" />
                          </button>
                        )}
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
                    {' '}
                    {/* Adjusted colSpan to 22 */}
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
          const invoiceLines = detailInvoiceLines;

          // Pagination logic for detail modal
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
              <div className="bg-white p-6 rounded-md shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <h2 className="text-xl font-semibold mb-4">
                  Invoice Detail - {detailInvoice.inv_no}
                </h2>
                <div className="space-y-2 mb-4">
                  {(() => {
                    const partner = businessPartners.find(
                      (bp) => bp.bp_code === detailInvoice.bp_code,
                    );
                    return (
                      <p>
                        <strong>Supplier:</strong> {detailInvoice.bp_code} —{' '}
                        {partner ? partner.adr_line_1 : '-'}
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
                  {detailLinesLoading ? (
                    <p className="text-gray-500 text-sm">Loading invoice lines...</p>
                  ) : Array.isArray(invoiceLines) && invoiceLines.length > 0 ? (
                    <div>
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
                              <th className="px-3 py-2 border">
                                Receipt Amount
                              </th>
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
                                    ? Number(
                                        line.receipt_amount,
                                      ).toLocaleString('id-ID', {
                                        style: 'currency',
                                        currency: 'IDR',
                                        minimumFractionDigits: 2,
                                      })
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

                      {/* Pagination Controls for Detail Modal - InvoiceCreationWizard Style */}
                      {invoiceLines.length > detailRowsPerPage && (
                        <div className="flex items-center justify-center gap-3 mt-4">
                          <button
                            onClick={handleDetailPrevious}
                            disabled={detailCurrentPage === 1}
                            className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <span className="text-gray-700 font-medium text-sm">
                            Page {detailCurrentPage} of {totalPages}
                          </span>
                          <button
                            onClick={handleDetailNext}
                            disabled={detailCurrentPage === totalPages}
                            className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                      )}
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
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Actual Date
              </label>
              <input
                type="date"
                value={actualDate}
                onChange={(e) => setActualDate(e.target.value)}
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
