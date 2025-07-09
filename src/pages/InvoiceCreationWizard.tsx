import React, { useState, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import LogoIcon from '/images/Logo-sanoh.png';
import { GrSaRecord } from './InvoiceCreation';
import { API_Create_Inv_Header_Admin, API_Ppn } from '../api/api';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface InvoiceCreationWizardProps {
  selectedRecords: GrSaRecord[];
  onClose: () => void;
  onFinish: () => void;
}

const InvoiceCreationWizard: React.FC<InvoiceCreationWizardProps> = ({
  selectedRecords,
  onClose,
  onFinish,
}) => {
  // Invoice fields
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [taxCode, setTaxCode] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxDate, setTaxDate] = useState('');

  // Form validation
  const [taxNumberError, setTaxNumberError] = useState('');

  // Add file validation function
  const [invoiceFileError, setInvoiceFileError] = useState<string>('');
  const [fakturFileError, setFakturFileError] = useState<string>('');
  const [suratJalanFileError, setSuratJalanFileError] = useState<string>('');
  const [poFileError, setPoFileError] = useState<string>('');

  const validateFileType = (
    file: File | null,
    setError: React.Dispatch<React.SetStateAction<string>>
  ): boolean => {
    if (!file) { setError(''); return false; }
    // Check PDF
    if (!file.type.includes('pdf')) {
      setError('Only PDF files are allowed');
      return false;
    }
    // Check size <=5MB
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return false;
    }
    setError('');
    return true;
  };

  // Individual file references (one-by-one)
  const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
  const [fakturPajakFile, setFakturPajakFile] = useState<File | null>(null);
  const [suratJalanFile, setSuratJalanFile] = useState<File | null>(null);
  const [poFile, setPoFile] = useState<File | null>(null);

  // UI state
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  // PPN data
  const [ppnList, setPpnList] = useState<any[]>([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;
  const totalPages = Math.ceil(selectedRecords.length / rowsPerPage);

  // Load PPN
  useEffect(() => {
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const loadPPN = async () => {
      try {
        const response = await fetch(API_Ppn(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await response.json();
        setPpnList(data);
      } catch (err) {
        console.error('Error loading PPN:', err);
      }
    };
    loadPPN();
  }, []);

  const formatToIDR = (value: number) =>
    new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(value);

  // Submit
  const submitInvoice = async () => {
    try {
      const token = localStorage.getItem('access_token');
      if (!token) {
        alert('Please log in.');
        return;
      }

      // Compute amounts
      const computedTaxBase = selectedRecords.reduce(
        (acc, record) => acc + Number(record.receipt_amount),
        0
      );
      const ppnRate = 0.11;
      const computedTaxAmount = computedTaxBase * ppnRate;
      const computedTotalInvoiceAmount = computedTaxBase + computedTaxAmount;

      // Form data
      const formData = new FormData();
      formData.append('inv_no', invoiceNumber);
      formData.append('inv_date', invoiceDate);
      formData.append('inv_faktur', taxNumber);
      formData.append('inv_faktur_date', taxDate);
      formData.append('total_dpp', computedTaxBase.toString());
      formData.append('ppn_id', taxCode);
      formData.append('tax_base_amount', computedTaxBase.toString());
      formData.append('tax_amount', computedTaxAmount.toString());
      formData.append('total_amount', computedTotalInvoiceAmount.toString());
      formData.append('status', 'New');
      formData.append('created_by', '');

      // Lines
      selectedRecords.forEach((rec) => {
        if (rec.inv_line_id) {
          formData.append('inv_line_detail[]', rec.inv_line_id);
        }
      });

      // Files (one by one)
      if (invoiceFile) formData.append('invoice_file', invoiceFile);
      if (fakturPajakFile) formData.append('fakturpajak_file', fakturPajakFile);
      if (suratJalanFile) formData.append('suratjalan_file', suratJalanFile);
      if (poFile) formData.append('po_file', poFile);

      // Debug
      for (const pair of formData.entries()) {
        if (pair[1] instanceof File) {
          console.log(`FormData => ${pair[0]} => File: ${(pair[1] as File).name}`);
        } else {
          console.log(`FormData => ${pair[0]} => ${pair[1]}`);
        }
      }

      // Send
      const response = await fetch(API_Create_Inv_Header_Admin(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const responseText = await response.text();
      let parsedData: any;
      try {
        parsedData = JSON.parse(responseText);
      } catch {
        parsedData = responseText;
      }

      if (!response.ok) {
        throw new Error(
          `Invoice creation failed: ${response.status} => ${JSON.stringify(parsedData)}`
        );
      }

      onFinish();
    } catch (err: any) {
      console.error('Error creating invoice:', err);
    }
  };

  // Render items
  const renderSelectedRecords = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const displayed = selectedRecords.slice(startIndex, startIndex + rowsPerPage);

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Items</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-purple-800 text-white">
                <th className="border px-2 py-3">Gr No</th>
                <th className="border px-2 py-3">Item Description</th>
                <th className="border px-2 py-3">Receipt Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((record, idx) => (
                <tr key={idx}>
                  <td className="border px-3 py-2 text-center">{record.gr_no}</td>
                  <td className="border px-3 py-2 text-center">{record.item_desc}</td>
                  <td className="border px-3 py-2 text-center">{formatToIDR(record.receipt_amount)}</td>
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

  // Calculate taxes
  const computedTaxBase = selectedRecords.reduce(
    (acc, record) => acc + Number(record.receipt_amount),
    0
  );
  const computedTaxAmount = computedTaxBase * 0.11;
  const computedTotalInvoiceAmount = computedTaxBase + computedTaxAmount;

  const handleTaxCodeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setTaxCode(e.target.value);
  };
  
  const validateTaxNumber = (value: string) => {
    if (!value) {
      setTaxNumberError('');
      return;
    }
    
    if (value.length !== 16) {
      setTaxNumberError('Tax Number must be exactly 16 characters');
    } else {
      setTaxNumberError('');
    }
  };

  // Check if step 1 form is valid
  const isStep1Valid = () => {
    return (
      invoiceNumber.trim() !== '' &&
      taxCode !== '' &&
      invoiceDate.trim() !== '' &&
      taxNumber.trim() !== '' &&
      taxNumber.length === 16 &&
      taxDate.trim() !== ''
    );
  };

  // Step 1
  const renderMainForm = () => (
    <div className="space-y-4">
      <div className="space-y-4 pt-2 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Create Invoice</h2>
        <hr className="my-6 border-t-1 border-blue-900" />
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Invoice Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter Invoice Number"
              className="w-full p-2 border border-blue-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tax Code (PPN) <span className="text-red-500">*</span>
            </label>
            <select
              className="w-full p-2 border border-blue-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxCode}
              onChange={handleTaxCodeChange}
            >
              <option value="">Select PPN</option>
              {ppnList.map((item) => (
                <option key={item.ppn_id} value={item.ppn_id}>
                  {item.ppn_description}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Invoice Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2 border border-blue-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tax Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              placeholder="Enter Tax Number (16 digits)"
              className={`w-full p-2 border ${
                taxNumberError ? 'border-red-500' : 'border-blue-900'
              } rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500`}
              value={taxNumber}
              maxLength={16}
              onChange={(e) => {
                const value = e.target.value;
                setTaxNumber(value);
                validateTaxNumber(value);
              }}
            />
            {taxNumberError && (
              <p className="text-sm text-red-500 mt-1">{taxNumberError}</p>
            )}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Base Amount</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-blue-900 text-blue-900 rounded-md shadow-sm bg-blue-200"
              value={formatToIDR(computedTaxBase)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Tax Date <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              className="w-full p-2 border border-blue-900 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
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
              readOnly
              className="w-full p-2 border border-blue-900 text-blue-900 rounded-md shadow-sm bg-blue-200"
              value={taxCode ? formatToIDR(computedTaxAmount) : ''}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Total Invoice Amount</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-blue-900 text-blue-900 rounded-md shadow-sm bg-blue-200"
              value={taxCode ? formatToIDR(computedTotalInvoiceAmount) : ''}
            />
          </div>
        </div>
        {currentStep === 1 && selectedRecords.length > 0 && renderSelectedRecords()}
      </div>
    </div>
  );

  // Step 2: table design but handle docs individually
  const renderAttachDocuments = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Attach and Submit Document</h2>
      <div className="overflow-hidden rounded-lg border-y border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-purple-800">
            <tr>
              <th className="w-24 px-6 py-3 text-center text-xs font-medium text-white uppercase">
                Action
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">
                Document Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-white uppercase">
                File Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {/* Invoice row */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => document.getElementById('invoice_file')?.click()}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-800 hover:bg-purple-600 transition-colors"
                >
                  <Plus size={18} className="text-white font-bold stroke-[2.5]" />
                </button>
                <input
                  type="file"
                  id="invoice_file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (validateFileType(file, setInvoiceFileError)) setInvoiceFile(file);
                  }}
                />

                {/* Display file error if any */}
                {invoiceFileError && (
                  <p className="text-xs text-red-500 mt-1 text-center">{invoiceFileError}</p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-sm text-purple-800 font-medium">Invoice</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {invoiceFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">{invoiceFile.name}</span>
                    <button
                      onClick={() => {
                        setInvoiceFile(null);
                        (document.getElementById('invoice_file') as HTMLInputElement).value = '';
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  'No file selected'
                )}
              </td>
            </tr>
            {/* Faktur Pajak */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => document.getElementById('fakturpajak_file')?.click()}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-800 hover:bg-purple-600 transition-colors"
                >
                  <Plus size={18} className="text-white font-bold stroke-[2.5]" />
                </button>
                <input
                  type="file"
                  id="fakturpajak_file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (validateFileType(file, setFakturFileError)) setFakturPajakFile(file);
                  }}
                />
                {fakturFileError && (
                  <p className="text-xs text-red-500 mt-1 text-center">{fakturFileError}</p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-sm text-purple-800 font-medium">Tax Invoice</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {fakturPajakFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">{fakturPajakFile.name}</span>
                    <button
                      onClick={() => {
                        setFakturPajakFile(null);
                        (
                          document.getElementById('fakturpajak_file') as HTMLInputElement
                        ).value = '';
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  'No file selected'
                )}
              </td>
            </tr>
            {/* Surat Jalan */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => document.getElementById('suratjalan_file')?.click()}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-800 hover:bg-purple-600 transition-colors"
                >
                  <Plus size={18} className="text-white font-bold stroke-[2.5]" />
                </button>
                <input
                  type="file"
                  id="suratjalan_file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (validateFileType(file, setSuratJalanFileError)) setSuratJalanFile(file);
                  }}
                />
                {suratJalanFileError && (
                  <p className="text-xs text-red-500 mt-1 text-center">{suratJalanFileError}</p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-sm text-purple-800 font-medium">Delivery Note</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {suratJalanFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">{suratJalanFile.name}</span>
                    <button
                      onClick={() => {
                        setSuratJalanFile(null);
                        (
                          document.getElementById('suratjalan_file') as HTMLInputElement
                        ).value = '';
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  'No file selected'
                )}
              </td>
            </tr>
            {/* PO */}
            <tr>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => document.getElementById('po_file')?.click()}
                  className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-800 hover:bg-purple-600 transition-colors"
                >
                  <Plus size={18} className="text-white font-bold stroke-[2.5]" />
                </button>
                <input
                  type="file"
                  id="po_file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    if (validateFileType(file, setPoFileError)) setPoFile(file);
                  }}
                />
                {poFileError && (
                  <p className="text-xs text-red-500 mt-1 text-center">{poFileError}</p>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                <span className="text-sm text-purple-800 font-medium">Purchase Order</span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-center">
                {poFile ? (
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">{poFile.name}</span>
                    <button
                      onClick={() => {
                        setPoFile(null);
                        (document.getElementById('po_file') as HTMLInputElement).value = '';
                      }}
                      className="text-red-500 hover:text-red-600"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  'No file selected'
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <div className="mt-6">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={disclaimerAccepted}
            onChange={(e) => setDisclaimerAccepted(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="text-sm text-gray-700">Invoice Submission Disclaimer Statement</span>
        </label>
      </div>
    </div>
  );

  // Step 3
  const renderTermsAndConditions = () => (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Attach and Submit Document</h2>
          <button onClick={() => {}} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600">
            {Array(5)
              .fill(null)
              .map((_, idx) => (
                <li key={idx}>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
              ))}
          </ol>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={submitInvoice}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-2 rounded-md transition-colors"
          >
            I Agree
          </button>
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Preview</h2>
          <div className="flex items-center gap-4">
            <img src={LogoIcon} alt="Sanoh Logo" className="h-8" />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
        {/* Content */}
        <div className="p-6 bg-violet-100 rounded-lg">
          {currentStep < 3 ? (
            <>
              {renderCurrentStep()}
              <div className="mt-6 flex justify-end gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 &&
                    (!invoiceFile ||
                      !fakturPajakFile ||
                      !suratJalanFile ||
                      !poFile ||
                      !disclaimerAccepted))
                  }
                  className={`px-6 py-2 rounded-md transition-colors ${
                    (currentStep === 1 && !isStep1Valid()) ||
                    (currentStep === 2 &&
                    (!invoiceFile ||
                      !fakturPajakFile ||
                      !suratJalanFile ||
                      !poFile ||
                      !disclaimerAccepted))
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-900 hover:bg-blue-800 text-white'
                  }`}
                >
                  Next
                </button>
              </div>
            </>
          ) : (
            <div>
              <h2 className="text-lg font-medium text-gray-900 mb-4">Terms & Condition</h2>
              <p>By submitting this invoice and related documents, you agree to the following terms:</p>
              <ol>
                <li>All information provided is accurate and complete to the best of your knowledge.</li>
                <li>The submitted documents (Invoice, Tax Invoice, Delivery Note, Purchase Order) are authentic and correspond to the goods/services rendered.</li>
                <li>You understand that payment processing is subject to verification and approval by PT Sanoh Indonesia.</li>
                <li>Any discrepancies or missing required documents may result in payment delays or rejection.</li>
                <li>PT Sanoh Indonesia reserves the right to request additional information or clarification regarding this submission.</li>
                <li>Submission of this invoice constitutes agreement to PT Sanoh Indonesia's standard payment terms and conditions unless otherwise specified in a prior written agreement.</li>
              </ol>
              <p>Please ensure all required fields are filled and mandatory documents are attached before final submission.</p>
              <div className="mt-2 mb-2 flex justify-end gap-2">
                <button
                  onClick={() => setCurrentStep(2)}
                  className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
                >
                  Back
                </button>
                <button
                  onClick={submitInvoice}
                  className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-md transition-colors"
                >
                  I Agree
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceCreationWizard;