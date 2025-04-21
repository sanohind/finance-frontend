import React, { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import {
  API_Inv_Header_Admin,
  API_List_Partner_Admin,
  API_Update_Status_To_In_Process_Finance,
  API_Upload_Payment_Admin,
} from '../api/api';
import InvoiceReportWizard from './InvoiceReportWizard'; // Import the wizard modal component

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

const PaymentUploadModal = ({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isUploading 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSubmit: (file: File) => void;
  isUploading: boolean;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = () => {
    if (selectedFile) {
      onSubmit(selectedFile);
    } else {
      toast.warning('Please select a PDF file');
    }
  };

  // Reset selected file when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedFile(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white p-6 rounded-md shadow-lg w-96">
        <h2 className="text-xl font-semibold mb-4">Upload Payment Document</h2>
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload PDF Document
          </label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".pdf"
            className="w-full border border-gray-300 rounded-md p-2"
            disabled={isUploading}
          />
          {selectedFile && (
            <p className="mt-1 text-sm text-gray-500">Selected: {selectedFile.name}</p>
          )}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
            disabled={isUploading}
            type="button"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={!selectedFile || isUploading}
            type="button"
          >
            {isUploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
};

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

  // Data states
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [rowsPerPage] = useState(10);

  // Allow multiple 'New' but only single 'In Process' or multiple 'Ready To Payment'
  const [selectedInvoices, setSelectedInvoices] = useState<Invoice[]>([]);
  
  // New state for payment upload modal
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const supplierOptions = businessPartners.map((bp) => ({
    value: bp.bp_code,
    label: `${bp.bp_code} | ${bp.bp_name}`,
  }));
  const selectedOption = supplierOptions.find((opt) => opt.value === searchSupplier) || null;

  useEffect(() => {
    const fetchBusinessPartners = async () => {
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

    fetchBusinessPartners();
  }, []);

  useEffect(() => {
    const fetchInvoiceData = async () => {
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

    fetchInvoiceData();
  }, []);

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
    setFilteredData(data);
    setCurrentPage(1);
    setSelectedInvoices([]);
  };

  // --- MODIFIED: Multi-record selection logic for Ready To Payment ---
  const handleRecordSelection = (invoice: Invoice) => {
    const exists = selectedInvoices.find((inv) => inv.inv_no === invoice.inv_no);
    const invoiceStatusLower = invoice.status?.toLowerCase();

    // If user clicks a row that's already selected, just toggle it off:
    if (exists) {
      setSelectedInvoices((prev) => prev.filter((inv) => inv.inv_no !== invoice.inv_no));
      return;
    }

    // Allow selecting multiple "Ready To Payment" if all selected are "Ready To Payment"
    if (invoiceStatusLower === 'ready to payment') {
      // If there are already selected invoices and any of them is not "Ready To Payment", replace selection
      if (
        selectedInvoices.length > 0 &&
        !selectedInvoices.every((inv) => inv.status?.toLowerCase() === 'ready to payment')
      ) {
        setSelectedInvoices([invoice]);
        return;
      }
      // Otherwise, add to selection
      setSelectedInvoices((prev) => [...prev, invoice]);
      return;
    }

    // If the invoice is 'New' but there's already an 'In Process' or 'Ready To Payment' selected, clear selection first
    if (
      invoiceStatusLower === 'new' &&
      (selectedInvoices.some((inv) => inv.status?.toLowerCase() === 'in process') ||
        selectedInvoices.some((inv) => inv.status?.toLowerCase() === 'ready to payment'))
    ) {
      setSelectedInvoices([invoice]);
      return;
    }

    // If the invoice is 'In Process' but there's already a 'New' or 'Ready To Payment' selected, clear selection first
    if (
      invoiceStatusLower === 'in process' &&
      (selectedInvoices.some((inv) => inv.status?.toLowerCase() === 'new') ||
        selectedInvoices.some((inv) => inv.status?.toLowerCase() === 'ready to payment'))
    ) {
      setSelectedInvoices([invoice]);
      return;
    }

    // Otherwise, add it
    setSelectedInvoices((prev) => [...prev, invoice]);
  };

  const handleVerify = async () => {
    if (selectedInvoices.length === 0) {
      toast.warning('Please select at least one invoice');
      return;
    }

    const newInvoices = selectedInvoices.filter((inv) => inv.status?.toLowerCase() === 'new');
    const inProcessInvoices = selectedInvoices.filter(
      (inv) => inv.status?.toLowerCase() === 'in process'
    );

    // If all selected are 'New', do a bulk update to 'In Process'
    if (newInvoices.length === selectedInvoices.length) {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) {
          toast.error('No access token found');
          return;
        }

        for (const invoice of newInvoices) {
          const response = await fetch(
            API_Update_Status_To_In_Process_Finance() + `/${invoice.inv_no}`,
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
            throw new Error(`Failed to update invoice ${invoice.inv_no}`);
          }
        }

        toast.success('All selected invoices updated to "In Process"!');
        // Update local data
        const updatedData = data.map((inv) => {
          if (selectedInvoices.find((selInv) => selInv.inv_no === inv.inv_no)) {
            return { ...inv, status: 'In Process' };
          }
          return inv;
        });
        setData(updatedData);
        setFilteredData(updatedData);
        setSelectedInvoices([]);
      } catch (err: any) {
        toast.error(err.message || 'Error updating invoice(s) status');
      }
    }
    // If all selected are 'In Process' and only one record is selected, open the wizard
    else if (
      inProcessInvoices.length === selectedInvoices.length &&
      selectedInvoices.length === 1
    ) {
      setModalInvoiceNumber(inProcessInvoices[0].inv_no);
      setWizardOpen(true);
    }
    // Otherwise, it's mixed or more than one 'In Process' selected
    else {
      toast.warning(
        'Mixed statuses selected or more than one "In Process" invoice selected. Please re-check.'
      );
    }
  };

  const handleCancelInvoice = () => {
    toast.info('Invoice cancelled');
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

  // NEW: Post Invoice handler
  const handlePostInvoice = () => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      inv => inv.status?.toLowerCase() === 'ready to payment'
    );
    
    if (readyToPaymentInvoices.length === 0) {
      toast.warning('Please select invoices with "Ready To Payment" status');
      return;
    }
    
    // Open the payment upload modal
    setPaymentModalOpen(true);
  };

  // NEW: Payment document upload handler
  const handlePaymentUpload = async (file: File) => {
    const readyToPaymentInvoices = selectedInvoices.filter(
      inv => inv.status?.toLowerCase() === 'ready to payment'
    );
  
    if (readyToPaymentInvoices.length === 0) {
      toast.error('No eligible invoices selected');
      return;
    }
  
    setIsUploading(true);
  
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        toast.error('Authentication token not found');
        return;
      }
  
      // Similar approach to InvoiceCreation - properly construct FormData for each invoice
      for (const invoice of readyToPaymentInvoices) {
        // Create a new FormData instance for each request
        const formData = new FormData();
        
        // Append the file with the correct field name expected by your backend
        formData.append('payment_file', file);
        
        // Construct the URL with the invoice number
        const url = API_Upload_Payment_Admin(invoice.inv_no);
        console.log('Upload URL:', url);
  
        // Use POST method for file uploads
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            // Do NOT set Content-Type when sending FormData
          },
          body: formData,
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Error response:', errorText);
          let errorMessage = 'Failed to upload payment document';
          
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            // If not JSON, use the text as is
            errorMessage = errorText || errorMessage;
          }
          
          throw new Error(errorMessage);
        }
      }
  
      toast.success('Payment document uploaded successfully!');
  
      // Update local state to show invoices as Paid
      const updatedData = data.map(inv => {
        if (readyToPaymentInvoices.some(selected => selected.inv_no === inv.inv_no)) {
          return { ...inv, status: 'Paid' };
        }
        return inv;
      });
  
      setData(updatedData);
      setFilteredData(updatedData);
      setSelectedInvoices([]);
      setPaymentModalOpen(false);
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || 'Error uploading payment document');
    } finally {
      setIsUploading(false);
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

  const formatCurrency = (amount: number | null) => {
    if (!amount) return '-';
    return `Rp ${amount.toLocaleString()},00`;
  };

  // --- MODIFIED: Checkbox visibility logic for Ready To Payment ---
  const inProcessSelected = selectedInvoices.find(
    (inv) => inv.status?.toLowerCase() === 'in process'
  );
  const hasSelectedNew = selectedInvoices.some((inv) => inv.status?.toLowerCase() === 'new');
  const readyToPaymentSelectedList = selectedInvoices.filter(
    (inv) => inv.status?.toLowerCase() === 'ready to payment'
  );

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
          className="bg-purple-900 text-sm text-white px-4 py-2 rounded hover:bg-purple-800"
          onClick={handleSearch}
          type="button"
        >
          Search
        </button>
        <button
          className="bg-white text-sm text-black px-4 py-2 rounded border border-violet-800 hover:bg-gray-100"
          onClick={handleClear}
          type="button"
        >
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
              Download Attachment
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

        <div className="overflow-x-auto shadow-md border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-4 py-2 text-gray-700 text-center border"></th>
                <th className="px-4 py-2 text-gray-700 text-center border">Invoice No</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Inv Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border" colSpan={2}>
                  Payment Date
                </th>
                <th className="px-4 py-2 text-gray-700 text-center border">Status</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Receipt No</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Supplier Code</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Supplier Name</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Tax Number</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Tax Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Total DPP</th>
                <th className="px-4 py-2 text-gray-700 text-center border">
                  Tax Base Amount
                </th>
                <th className="px-4 py-2 text-gray-700 text-center border">
                  Tax Amount (11%)
                </th>
                <th className="px-4 py-2 text-gray-700 text-center border">
                  PPh Base Amount
                </th>
                <th className="px-4 py-2 text-gray-700 text-center border">PPh Amount</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Total Amount</th>
              </tr>
              <tr className="bg-gray-100 border">
                <th colSpan={3}></th>
                <th className="px-4 py-2 text-md text-gray-600 text-center border">Plan</th>
                <th className="px-4 py-2 text-md text-gray-600 text-center border">Actual</th>
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
              ) : filteredData.length > 0 ? (
                paginatedData.map((invoice) => {
                  const isSelected = selectedInvoices.some(
                    (inv) => inv.inv_no === invoice.inv_no
                  );
                  const invoiceStatusLower = invoice.status?.toLowerCase();

                  let showCheckbox = false;

                  // --- MODIFIED LOGIC FOR CHECKBOX VISIBILITY ---
                  if (readyToPaymentSelectedList.length > 0) {
                    // Only show checkbox for "Ready To Payment" invoices if all selected are "Ready To Payment"
                    showCheckbox =
                      invoiceStatusLower === 'ready to payment' &&
                      (readyToPaymentSelectedList.length === 0 ||
                        readyToPaymentSelectedList.some((inv) => inv.inv_no === invoice.inv_no));
                  } else if (inProcessSelected) {
                    showCheckbox =
                      inProcessSelected.inv_no === invoice.inv_no &&
                      invoiceStatusLower === 'in process';
                  } else if (
                    hasSelectedNew &&
                    (invoiceStatusLower === 'in process' || invoiceStatusLower === 'ready to payment')
                  ) {
                    showCheckbox = false;
                  } else if (
                    invoiceStatusLower === 'new' ||
                    invoiceStatusLower === 'in process' ||
                    invoiceStatusLower === 'ready to payment'
                  ) {
                    showCheckbox = true;
                  }

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
                      {/* Clickable invoice number --> Open detail modal */}
                      <td className="px-4 py-2 text-center">
                        <button
                          onClick={() => handleShowDetail(invoice)}
                          className="text-blue-600 underline"
                        >
                          {invoice.inv_no || '-'}
                        </button>
                      </td>
                      <td className="px-4 py-2 text-center">{formatDate(invoice.inv_date)}</td>
                      <td className="px-4 py-2 text-center">{formatDate(invoice.plan_date)}</td>
                      <td className="px-4 py-2 text-center">{formatDate(invoice.actual_date)}</td>
                      <td className="px-4 py-2 text-center">{invoice.status || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        {invoice.receipt_number || '-'}
                      </td>
                      <td className="px-4 py-2 text-center">{invoice.bp_code || '-'}</td>
                      <td className="px-4 py-2 text-center">{invoice.bp_name || '-'}</td>
                      <td className="px-4 py-2 text-center">{invoice.inv_faktur || '-'}</td>
                      <td className="px-4 py-2 text-center">
                        {formatDate(invoice.inv_faktur_date)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatCurrency(invoice.total_dpp)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatCurrency(invoice.tax_base_amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatCurrency(
                          invoice.tax_base_amount ? invoice.tax_base_amount * 0.11 : 0
                        )}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatCurrency(invoice.pph_base_amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
                        {formatCurrency(invoice.pph_amount)}
                      </td>
                      <td className="px-4 py-2 text-center">
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
              {/* Add more fields as needed */}
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

      {/* Payment Upload Modal */}
      <PaymentUploadModal
        isOpen={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        onSubmit={handlePaymentUpload}
        isUploading={isUploading}
      />

      {/* Render the wizard modal here */}
      <InvoiceReportWizard
        isOpen={wizardOpen}
        onClose={() => setWizardOpen(false)}
        invoiceNumberProp={modalInvoiceNumber}
      />
    </div>
  );
};

export default InvoiceReport;