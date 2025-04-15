import React, { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import LogoIcon from '/images/Logo-sanoh.png';
import { toast } from 'react-toastify';
import {
  API_Update_Inv_Header_Admin,
  API_Inv_Line_By_Inv_No_Admin,
  API_Pph,
  API_Inv_Header_By_Inv_No_Admin, // <-- Add this import
} from '../api/api';

// Interface(s)
interface InvoiceReportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish?: () => void;
  invoiceNumberProp?: string;
}

interface InvoiceLineItem {
  id: string | number;
  gr_no: string;
  item_desc: string;
  receipt_amount: number;
}

const InvoiceReportWizard: React.FC<InvoiceReportWizardProps> = ({
  isOpen,
  onClose,
  onFinish,
  invoiceNumberProp,
}) => {
  if (!isOpen) return null;

  // Steps
  const [currentStep, setCurrentStep] = useState(1);

  // ---------- State for invoice data ----------
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxDate, setTaxDate] = useState('');
  const [taxBaseAmount, setTaxBaseAmount] = useState<number>(0);
  const [taxCode, setTaxCode] = useState('');
  const [taxAmount, setTaxAmount] = useState<number>(0);
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState<number>(0);
  const [planDate, setPlanDate] = useState('');

  // ---------- State related to PPh ----------
  const [pphList, setPphList] = useState<any[]>([]);
  const [pphCode, setPphCode] = useState<string>('');
  const [pphBaseAmount, setPphBaseAmount] = useState<string>('');
  const [pphAmount, setPphAmount] = useState<string>('');

  // ---------- Invoice line items ----------
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
  const [invLineRemove, setInvLineRemove] = useState<(string | number)[]>([]);

  // Pagination for line items
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(lineItems.length / rowsPerPage);

  // Attach Documents (dummy)
  const [documents, setDocuments] = useState([
    { type: 'Invoice *', fileName: 'Invoice.pdf', required: true },
    { type: 'Tax Invoice *', fileName: 'FakturPajak.pdf', required: true },
    { type: 'Delivery Note *', fileName: 'SuratJalan.pdf', required: true },
    { type: 'Purchase Order *', fileName: 'PurchaseOrder.pdf', required: true },
  ]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const [rejectMode, setRejectMode] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // Fetch PPh list once or when invoiceNumberProp changes
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;

    const loadPphList = async () => {
      try {
        const response = await fetch(API_Pph(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          setPphList(Array.isArray(data) ? data : []);
        }
      } catch (err) {
        toast.error('Failed to load PPh data');
      }
    };

    if (isOpen) {
      loadPphList();
    }
  }, [invoiceNumberProp, isOpen]);

  // Fetch invoice data when invoiceNumberProp changes
  useEffect(() => {
    if (!invoiceNumberProp) return;

    const fetchInvoiceData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // --- Fetch header data from new API ---
        const headerRes = await fetch(
          API_Inv_Header_By_Inv_No_Admin() + `${invoiceNumberProp}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (headerRes.ok) {
          const headerData = await headerRes.json();
          const data = headerData.data || {};
          setInvoiceNumber(data.inv_no || '');
          setInvoiceDate(data.inv_date || '');
          setTaxNumber(data.tax_no || '');
          setTaxDate(data.tax_date || '');
          setTaxCode(data.tax_code || '');
          setTaxBaseAmount(data.tax_base_amount || 0);
          setTaxAmount(data.tax_amount || 0);
          setTotalInvoiceAmount(data.total_invoice_amount || 0);
          setPlanDate(data.plan_date || '');
          setPphBaseAmount(data.pph_base_amount ? String(data.pph_base_amount) : '');
          setPphAmount(data.pph_amount ? String(data.pph_amount) : '');
          // DO NOT setPphCode here (leave it for user selection)
        } else {
          toast.error('Failed to fetch invoice header');
        }

        // --- Fetch line items as before ---
        const response = await fetch(
          API_Inv_Line_By_Inv_No_Admin() + invoiceNumberProp,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        if (response.ok) {
          const result = await response.json();
          if (Array.isArray(result.data)) {
            setLineItems(result.data);
          }
        }
      } catch (err) {
        toast.error('Failed to fetch invoice data');
      }
    };
    fetchInvoiceData();
  }, [invoiceNumberProp]);

  // Number formatting
  const formatNumber = (val: string | number) => {
    if (!val) return '';
    const num = Number(String(val).replace(/[^0-9]/g, ''));
    if (isNaN(num)) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  };

  // Remove a line from the local UI list and store ID
  const handleRemoveLine = (lineId: string | number) => {
    setLineItems((old) => old.filter((item) => item.id !== lineId));
    setInvLineRemove((prev) => [...prev, lineId]);
  };

  // Render table for line items
  const renderLineItemsTable = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const displayed = lineItems.slice(startIndex, startIndex + rowsPerPage);

    return (
      <div className="mb-6 mt-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Invoice Line Items</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-purple-800 text-white">
                <th className="border px-2 py-3 text-sm font-semibold uppercase">Gr No</th>
                <th className="border px-2 py-3 text-sm font-semibold uppercase">
                  Item Description
                </th>
                <th className="border px-2 py-3 text-sm font-semibold uppercase">
                  Receipt Amount
                </th>
                <th className="border px-2 py-3 text-sm font-semibold uppercase">Action</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2 text-center">{item.gr_no}</td>
                  <td className="border px-3 py-2 text-center">{item.item_desc}</td>
                  <td className="border px-3 py-2 text-center">{formatNumber(item.receipt_amount)}</td>
                  <td className="border px-3 py-2 text-center">
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded"
                      onClick={() => handleRemoveLine(item.id)}
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 mt-2 mb-2">
              <button
                type="button"
                onClick={() => setCurrentPage(Math.max(currentPage - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <span className="text-gray-700 font-medium text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage(Math.min(currentPage + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  // Step 1: Main Form
  const renderMainForm = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Invoice Data Update Form</h2>
      <hr className="my-4 border-t-1 border-blue-900" />

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tax Code (PPN)</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={taxCode}
            onChange={(e) => setTaxCode(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Invoice Date</label>
          <input
            type="date"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={invoiceDate}
            onChange={(e) => setInvoiceDate(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tax Number</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tax Base Amount</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
            readOnly
            value={taxBaseAmount.toLocaleString('id-ID')}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tax Date</label>
          <input
            type="date"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={taxDate}
            onChange={(e) => setTaxDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Tax Amount</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
            readOnly
            value={taxAmount.toLocaleString('id-ID')}
          />
        </div>
        {/* Updated PPh Code select: now uses pphList */}
        <div className="space-y-2">
          <label htmlFor="pphCode" className="text-sm font-medium text-gray-700">
            PPh Code
          </label>
          <select
            id="pphCode"
            className="w-full p-2 border border-blue-900 rounded-md bg-white"
            value={pphCode}
            onChange={(e) => setPphCode(e.target.value)}
          >
            <option value="">Select PPh Code...</option>
            {pphList.map((item) => (
              <option key={item.pph_id} value={item.pph_id}>
                {item.pph_description}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor="pphBaseAmount" className="text-sm font-medium text-gray-700">
            PPh Base Amount
          </label>
          <input
            id="pphBaseAmount"
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={pphBaseAmount}
            onChange={(e) => setPphBaseAmount(e.target.value)}
            placeholder="Masukkan PPh Base Amount"
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Plan Date</label>
          <input
            type="date"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={planDate}
            onChange={(e) => setPlanDate(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label htmlFor="pphAmount" className="text-sm font-medium text-gray-700">
            PPh Amount
          </label>
          <input
            id="pphAmount"
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md bg-blue-100 text-blue-900"
            value={formatNumber(pphAmount)}
            readOnly
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Total Invoice Amount</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
            readOnly
            value={totalInvoiceAmount.toLocaleString('id-ID')}
          />
        </div>
      </div>

      {/* Render line items table */}
      {lineItems.length > 0 && renderLineItemsTable()}
    </div>
  );

  // Step 2: Attach Documents (Dummy, no changes)
  const renderAttachDocuments = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Attach Documents (Dummy)</h2>
      <div className="overflow-hidden rounded-lg border-y border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-800">
            <tr>
              <th className="w-24 px-6 py-3 text-center text-sm font-semibold text-white uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase">
                Document Type
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase">
                File Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc, index) => (
              <tr key={index}>
                <td className="px-6 py-4 text-center">
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[index]?.click()}
                    className="bg-blue-800 text-white px-2 py-1 rounded"
                  >
                    {doc.fileName ? 'Change' : 'Upload'}
                  </button>
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    style={{ display: 'none' }}
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        const updatedDocs = [...documents];
                        updatedDocs[index] = {
                          ...updatedDocs[index],
                          fileName: e.target.files[0].name,
                        };
                        setDocuments(updatedDocs);
                      }
                    }}
                    accept=".pdf,.jpg,.jpeg,.png"
                  />
                </td>
                <td className="px-6 py-4 text-center">
                  {doc.type}
                  {doc.required && !doc.fileName && (
                    <span className="text-red-500 ml-1">(Required)</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center italic text-gray-600">
                  {doc.fileName || 'No file selected'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:ring-blue-500"
          />
          <span className="text-sm text-gray-800">Invoice Submission Disclaimer Statement</span>
        </label>
        {!disclaimerAccepted && currentStep === 2 && (
          <p className="text-xs text-red-500 mt-1">
            You must accept the disclaimer to proceed.
          </p>
        )}
      </div>
    </div>
  );

  // Step 3: Terms & Conditions plus final submission
  const renderTermsAndConditions = () => (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions (Dummy)</h2>
      <div className="prose prose-sm max-w-none text-gray-700 max-h-60 overflow-y-auto border p-4 rounded bg-gray-50">
        <p>By submitting this invoice and related documents, you agree to the following terms:</p>
        <ol>
          <li>All information provided is accurate...</li>
          <li>The submitted documents match the goods/services rendered.</li>
          <li>Any missing docs may cause delays, etc.</li>
        </ol>
      </div>
      <div className="mt-4 flex flex-col items-end gap-2">
        {/* Show reason input if in reject mode */}
        {rejectMode && (
          <div className="w-full flex flex-col items-end mb-2">
            <label className="text-sm font-medium text-gray-700 mb-1" htmlFor="rejectReason">
              Reason for Rejection <span className="text-red-500">*</span>
            </label>
            <textarea
              id="rejectReason"
              className="w-full p-2 border border-red-400 rounded-md mb-2"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Please provide a reason for rejection"
              rows={3}
            />
          </div>
        )}
        <div className="flex gap-2">
          {/* Ready To Payment Button */}
          <button
            onClick={async () => {
              const token = localStorage.getItem('access_token');
              if (!token) {
                toast.error('No access token found');
                return;
              }
              try {
                const pph_id = parseInt(pphCode, 10) || 0;
                const numericPphBase = parseFloat(pphBaseAmount.replace(/[^0-9.]/g, '')) || 0;
                const bodyData = {
                  pph_id,
                  pph_base_amount: numericPphBase,
                  inv_line_remove: invLineRemove,
                  status: 'Ready To Payment',
                  plan_date: planDate,
                  reason: '',
                };
  
                const response = await fetch(
                  API_Update_Inv_Header_Admin() + `${invoiceNumber}`,
                  {
                    method: 'PUT',
                    headers: {
                      Authorization: `Bearer ${token}`,
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(bodyData),
                  }
                );
                if (!response.ok) {
                  if (response.status === 422) {
                    const errorRes = await response.json();
                    toast.error(errorRes.message || 'Validation Error');
                    return;
                  }
                  if (response.status === 404) {
                    toast.error('Invoice not found or PPH Rate not found');
                    return;
                  }
                  toast.error('Failed to update invoice');
                  return;
                }
                toast.success('Invoice status updated to Ready To Payment!');
                if (onFinish) onFinish();
                onClose();
              } catch (err) {
                toast.error('Error updating invoice');
              }
            }}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md"
          >
            I Agree And Update The Status to Ready To Payment
          </button>
          {/* Reject Button */}
          {!rejectMode ? (
            <button
              onClick={() => setRejectMode(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
            >
              Reject
            </button>
          ) : (
            <button
              onClick={async () => {
                if (!rejectReason.trim()) {
                  toast.error('Please provide a reason for rejection.');
                  return;
                }
                const token = localStorage.getItem('access_token');
                if (!token) {
                  toast.error('No access token found');
                  return;
                }
                try {
                  const pph_id = parseInt(pphCode, 10) || 0;
                  const numericPphBase = parseFloat(pphBaseAmount.replace(/[^0-9.]/g, '')) || 0;
                  const bodyData = {
                    pph_id,
                    pph_base_amount: numericPphBase,
                    inv_line_remove: invLineRemove,
                    status: 'Rejected',
                    plan_date: planDate,
                    reason: rejectReason,
                  };
  
                  const response = await fetch(
                    API_Update_Inv_Header_Admin() + `${invoiceNumber}`,
                    {
                      method: 'PUT',
                      headers: {
                        Authorization: `Bearer ${token}`,
                        'Content-Type': 'application/json',
                      },
                      body: JSON.stringify(bodyData),
                    }
                  );
                  if (!response.ok) {
                    if (response.status === 422) {
                      const errorRes = await response.json();
                      toast.error(errorRes.message || 'Validation Error');
                      return;
                    }
                    if (response.status === 404) {
                      toast.error('Invoice not found or PPH Rate not found');
                      return;
                    }
                    toast.error('Failed to update invoice');
                    return;
                  }
                  toast.success('Invoice status updated to Rejected!');
                  if (onFinish) onFinish();
                  onClose();
                } catch (err) {
                  toast.error('Error updating invoice');
                }
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md"
            >
              Reject
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // Step renderer
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return renderMainForm();
      case 2:
        return renderAttachDocuments();
      case 3:
        return renderTermsAndConditions();
      default:
        return null;
    }
  };

  // Checks for Step 2
  const requiredDocsUploaded = documents
    .filter((doc) => doc.required)
    .every((doc) => !!doc.fileName);
  const canProceedFromStep2 = requiredDocsUploaded && disclaimerAccepted;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] flex flex-col shadow-xl">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center sticky top-0 bg-white z-10">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Wizard (Preview)</h2>
          <div className="flex items-center gap-4">
            <img src={LogoIcon} alt="Sanoh Logo" className="h-8" />
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 bg-violet-100 rounded-b-lg overflow-y-auto flex-grow">
          {renderCurrentStep()}
        </div>

        {/* Footer with navigation */}
        {currentStep < 3 && (
          <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-gray-50 z-10 rounded-b-lg">
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md text-sm"
              >
                Previous
              </button>
            )}
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={currentStep === 2 && !canProceedFromStep2}
              className={`px-6 py-2 rounded-md text-sm ${
                currentStep === 2 && !canProceedFromStep2
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-900 hover:bg-blue-800 text-white'
              }`}
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InvoiceReportWizard;