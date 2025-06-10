import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { AiFillFilePdf } from 'react-icons/ai';
import LogoIcon from '/images/Logo-sanoh.png';
import { toast } from 'react-toastify';
import {
  API_Update_Inv_Header_Admin,
  API_Pph,
  API_Inv_Header_By_Inv_No_Admin,
  API_Stream_File_Invoice,
  API_Stream_File_Faktur,
  API_Stream_File_Suratjalan,
  API_Stream_File_PO,
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
  // Tax code is fixed to id=1, description="11%"
  const TAX_CODE_DESC = '11%';
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

  // Pagination for line items
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(lineItems.length / rowsPerPage);

  // Attach Documents (dummy)
  const [documents] = useState([
    { type: 'Invoice *', fileName: 'Invoice.pdf', required: true },
    { type: 'Tax Invoice *', fileName: 'FakturPajak.pdf', required: true },
    { type: 'Delivery Note *', fileName: 'SuratJalan.pdf', required: true },
    { type: 'Purchase Order *', fileName: 'PurchaseOrder.pdf', required: true },
  ]);
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

  // Calculate tax amount as 11% of tax base amount
  useEffect(() => {
    setTaxAmount(Math.round(taxBaseAmount * 0.11));
  }, [taxBaseAmount]);

  // Effect to calculate PPh Amount and update Total Invoice Amount for preview
  useEffect(() => {
    const numericPphBaseAmount = parseFloat(String(pphBaseAmount).replace(/[^0-9.]/g, '')) || 0;
    let pphRate = 0;
    const pphId = Number(pphCode);

    // Determine PPh rate based on pph_id
    if (pphId === 1) pphRate = 0.0200;
    else if (pphId === 2) pphRate = 0.0250;
    else if (pphId === 3) pphRate = 0.1000;
    else if (pphId === 4) pphRate = 0.0175;
    else if (pphId === 5) pphRate = 0.1000;
    else if (pphId === 6) pphRate = 0.00;
    else if (pphId === 7) pphRate = 0.2000;
    // else, pphRate remains 0, or you could fetch from pphList if it contained rates

    const calculatedPphAmount = numericPphBaseAmount * pphRate;
    setPphAmount(calculatedPphAmount.toFixed(2)); // Store as string with 2 decimal places

    // Recalculate total invoice amount for preview: (DPP + PPN) - PPh
    // taxBaseAmount is DPP, taxAmount is PPN (calculated as 11% of taxBaseAmount)
    const newTotalInvoiceAmount = taxBaseAmount + taxAmount - calculatedPphAmount;
    setTotalInvoiceAmount(newTotalInvoiceAmount);
  }, [pphCode, pphBaseAmount, taxBaseAmount, taxAmount, pphList]);

  // Fetch invoice data when invoiceNumberProp changes
  useEffect(() => {
    if (!invoiceNumberProp) return;

    const fetchInvoiceData = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (!token) return;

        // --- Fetch header data using inv_id instead of inv_no ---
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
          setTaxNumber(data.inv_faktur || '');
          setTaxDate(data.inv_faktur_date || '');
          setTaxBaseAmount(data.tax_base_amount || 0);
          setTotalInvoiceAmount(data.total_invoice_amount || 0); // Initial total from API
          setPlanDate(data.plan_date || '');
          // Set PPh Code if available from data
          if (data.pph_id) {
            setPphCode(String(data.pph_id));
          } else {
            setPphCode(''); // Reset if not in data
          }
          setPphBaseAmount(data.pph_base_amount ? String(data.pph_base_amount) : '');
          // pphAmount and final totalInvoiceAmount will be set by the calculation useEffect

          // Set line items from inv_lines in header response
          setLineItems(
            Array.isArray(data.inv_lines)
              ? data.inv_lines.map((item: any) => ({
                  id: item.inv_line_id || item.id || '',
                  gr_no: item.gr_no || '',
                  item_desc: item.item_desc || '',
                  receipt_amount: item.receipt_amount || 0,
                }))
              : []
          );
        } else {
          toast.error('Failed to fetch invoice header');
        }
      } catch (err) {
        toast.error('Failed to fetch invoice data');
      }
    };
    fetchInvoiceData();
  }, [invoiceNumberProp]);

  // Number formatting
  const formatRupiah = (val: string | number) => {
    if (val === null || val === undefined || val === '') return ''; // Handle empty, null, or undefined
    let num: number;

    if (typeof val === 'string') {
      // Clean the string: allow digits and one decimal point.
      // This regex keeps only digits and the first decimal point encountered.
      const cleanedString = val.replace(/[^\d.]/g, '');
      num = parseFloat(cleanedString);
    } else {
      num = val; // It's already a number
    }

    if (isNaN(num)) return ''; // If parsing failed or was already NaN

    // Format as IDR currency, always showing two decimal places
    return num.toLocaleString('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  // Render table for line items
  const renderLineItemsTable = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const displayed = lineItems.slice(startIndex, startIndex + rowsPerPage);

    function formatNumber(receipt_amount: number): React.ReactNode {
      return receipt_amount.toLocaleString('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 2,
      });
    }

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
              </tr>
            </thead>
            <tbody>
              {displayed.map((item) => (
                <tr key={item.id}>
                  <td className="border px-3 py-2 text-center">{item.gr_no}</td>
                  <td className="border px-3 py-2 text-center">{item.item_desc}</td>
                  <td className="border px-3 py-2 text-center">
                    {formatNumber(item.receipt_amount)}
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

  // Validation for required fields (move to component scope)
  const pphBaseAmountError =
    pphBaseAmount.trim() !== '' &&
    isNaN(parseFloat(pphBaseAmount.replace(/[^\d.]/g, ''))); // Error only if provided and not a number
  const planDateError = !planDate;
  const disclaimerError = !disclaimerAccepted;
  const isFormValid = !pphBaseAmountError && !planDateError && !disclaimerError; // pphCode is no longer checked for form validity here

  // Step 1: Main Form (now includes all sections in order)
  const renderMainForm = () => {
    const getPphDescription = (pphId: string | number): string => {
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
          // Fallback to original description if no match or find from pphList
          const pphItem = pphList.find(
            (item) => item.pph_id.toString() === pphId.toString()
          );
          return pphItem ? pphItem.pph_description : 'Unknown PPh Code';
      }
    };

    return (
      <div className="space-y-4">
        <h2 className="text-lg font-medium text-gray-900">Invoice Data Update Form</h2>
        <hr className="my-4 border-t-1 border-blue-900" />

        {/* Main Form Fields */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-900 rounded-md"
              value={invoiceNumber}
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Code (PPN)</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
              value={TAX_CODE_DESC}
              readOnly
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
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Number</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-900 rounded-md"
              value={taxNumber}
              readOnly
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
              value={formatRupiah(taxBaseAmount)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Date</label>
            <input
              type="date"
              className="w-full p-2 border border-blue-900 rounded-md"
              value={taxDate}
              readOnly
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
              value={formatRupiah(taxAmount)}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="pphCode" className="text-sm font-medium text-gray-700">
              Income Tax
            </label>
            <select
              id="pphCode"
              className="w-full p-2 border border-blue-900 rounded-md bg-white"
              value={pphCode}
              onChange={(e) => setPphCode(e.target.value)}
            >
              <option value="">Select Income Tax...</option>
              {pphList.map((item) => (
                <option key={item.pph_id} value={item.pph_id}>
                  {getPphDescription(item.pph_id)}
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
              className={`w-full p-2 border rounded-md ${
                pphBaseAmountError ? 'border-red-500' : 'border-blue-900'
              }`}
              value={pphBaseAmount}
              onChange={(e) => setPphBaseAmount(e.target.value)}
              placeholder="Masukkan PPh Base Amount"
            />
            {pphBaseAmountError && (
              <span className="text-xs text-red-500">
                PPh Base Amount must be a valid number if provided.
              </span>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Plan Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className={`w-full p-2 border rounded-md ${
                planDateError ? 'border-red-500' : 'border-blue-900'
              }`}
              value={planDate}
              onChange={(e) => setPlanDate(e.target.value)}
            />
            {planDateError && (
              <span className="text-xs text-red-500">Plan Date is required.</span>
            )}
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
              value={formatRupiah(pphAmount)} // Display calculated PPh Amount
              readOnly
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Total Invoice Amount</label>
            <input
              type="text"
              className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
              readOnly
              value={formatRupiah(totalInvoiceAmount)} // Display recalculated Total Invoice Amount
            />
          </div>
        </div>

        {/* Divider before line items table */}
        <hr className="my-6 border-t-2 border-purple-300" />

        {/* Render line items table */}
        {lineItems.length > 0 && renderLineItemsTable()}

        {/* Divider before document section */}
        <hr className="my-6 border-t-2 border-purple-300" />

        {/* Document upload section (inline, not as a function) */}
        <div className="space-y-6">
          <h2 className="text-lg font-medium text-gray-900">Attach Documents</h2>
          <div className="overflow-hidden rounded-lg border-y border-gray-200">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-purple-800">
                <tr>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase">
                    Document Type
                  </th>
                  <th className="px-6 py-3 text-center text-sm font-semibold text-white uppercase">
                    File
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {documents.map((doc, index) => {
                  let apiFn = null;
                  let filePrefix = '';
                  if (doc.type.toLowerCase().includes('invoice')) {
                    apiFn = API_Stream_File_Invoice;
                    filePrefix = 'INVOICE_';
                  } else if (doc.type.toLowerCase().includes('tax')) {
                    apiFn = API_Stream_File_Faktur;
                    filePrefix = 'FAKTURPAJAK_';
                  } else if (doc.type.toLowerCase().includes('delivery')) {
                    apiFn = API_Stream_File_Suratjalan;
                    filePrefix = 'SURATJALAN_';
                  } else if (doc.type.toLowerCase().includes('purchase')) {
                    apiFn = API_Stream_File_PO;
                    filePrefix = 'PO_';
                  }
                  return (
                    <tr key={index}>
                      <td className="px-6 py-4 text-center">
                        {doc.type}
                        {doc.required && !doc.fileName && (
                          <span className="text-red-500 ml-1">(Required)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {apiFn && (
                          <button
                            type="button"
                            onClick={() => {
                              if (!invoiceNumberProp) return;
                              const url = `${apiFn()}/${filePrefix}${invoiceNumberProp}.pdf`;
                              window.open(url, '_blank', 'noopener,noreferrer');
                            }}
                            title={`View ${doc.type} PDF`}
                          >
                            <AiFillFilePdf className="inline text-red-600 text-xl cursor-pointer" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
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
              <span className="text-sm text-gray-800">
                Invoice Submission Disclaimer Statement{' '}
                <span className="text-red-500">*</span>
              </span>
            </label>
            {disclaimerError && (
              <span className="text-xs text-red-500">
                You must accept the disclaimer to proceed.
              </span>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Step 2: Terms & Conditions plus final submission
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
                // Prepare pph_id for payload
                const parsedPphId = parseInt(pphCode, 10);
                const finalPphId = pphCode && !isNaN(parsedPphId) ? parsedPphId : null;

                // Prepare pph_base_amount for payload
                const cleanedPphBaseAmount = pphBaseAmount.replace(/[^0-9.]/g, '');
                const parsedPphBaseAmount = parseFloat(cleanedPphBaseAmount);
                const finalPphBaseAmount = cleanedPphBaseAmount.trim() !== '' && !isNaN(parsedPphBaseAmount) ? parsedPphBaseAmount : null;

                const bodyData = {
                  pph_id: finalPphId,
                  pph_base_amount: finalPphBaseAmount,                  
                  status: 'Ready To Payment',
                  plan_date: planDate,
                  reason: '', // Reason is empty for "Ready To Payment"
                };

                const response = await fetch(
                  API_Update_Inv_Header_Admin() + `${invoiceNumberProp}`,
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
                  // No pph_id, pph_base_amount, or plan_date for Rejected
                  const bodyData = {
                    status: 'Rejected',
                    reason: rejectReason,
                  };

                  const response = await fetch(
                    API_Update_Inv_Header_Admin() + `${invoiceNumberProp}`,
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
        return renderTermsAndConditions();
      default:
        return null;
    }
  };

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
        {currentStep < 2 && (
          <div className="p-4 border-t flex justify-end gap-3 sticky bottom-0 bg-gray-50 z-10 rounded-b-lg">
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              className={`px-6 py-2 rounded-md text-sm bg-blue-900 hover:bg-blue-800 text-white ${
                !isFormValid ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={!isFormValid}
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