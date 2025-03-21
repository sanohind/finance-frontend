import React, { useState, useRef, useEffect } from 'react';
import { X, Plus } from 'lucide-react';
import LogoIcon from '../images/logo-sanoh.png';
import { GrSaRecord } from './InvoiceCreation';
import { API_Create_Inv_Header_Admin, API_Ppn, API_Pph } from '../api/api';

interface InvoiceCreationWizardProps {
  selectedRecords: GrSaRecord[];
  onClose: () => void;
  onFinish: () => void;
}

const InvoiceCreationWizard: React.FC<InvoiceCreationWizardProps> = ({ selectedRecords, onClose, onFinish }) => {
  // Invoice state (all fields start empty)
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  // taxCode will hold the chosen PPN id via the select; its description is shown in the select options.
  const [taxCode, setTaxCode] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [taxBaseAmount, setTaxBaseAmount] = useState('');
  const [taxAmount, setTaxAmount] = useState('');
  const [taxDate, setTaxDate] = useState('');
  // whtCode will hold the chosen PPH id via the select; its description is shown in the select options.
  const [whtCode, setWhtCode] = useState('');
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState('');

  // Document state remains (no dummy fileName preset)
  const [documents, setDocuments] = useState([
    { type: 'Invoice *', fileName: '', required: true },
    { type: 'Tax Invoice *', fileName: '', required: true },
    { type: 'Delivery Note *', fileName: '', required: true },
    { type: 'Purchase Order *', fileName: '', required: true },
  ]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // New state for PPN and PPH lists; their descriptions will be used in the form select.
  const [ppnList, setPpnList] = useState<any[]>([]);
  const [pphList, setPphList] = useState<any[]>([]);

  // Pagination for selected records table
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 3;
  const totalPages = Math.ceil(selectedRecords.length / rowsPerPage);

  // File input refs
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      const updatedDocuments = [...documents];
      updatedDocuments[index] = { ...updatedDocuments[index], fileName: file.name };
      setDocuments(updatedDocuments);
    }
  };

  const handlePlusClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const formatToIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  // Load PPN and PPH options on mount and include the token in headers.
  useEffect(() => {
    const token = localStorage.getItem('access_token'); // Adjust as needed.
    const loadPPN = async () => {
      try {
        const res = await fetch(API_Ppn(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPpnList(data);
      } catch (error) {
        console.error('Error loading PPN', error);
      }
    };
    const loadPPH = async () => {
      try {
        const res = await fetch(API_Pph(), {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setPphList(data);
      } catch (error) {
        console.error('Error loading PPH', error);
      }
    };
    loadPPN();
    loadPPH();
  }, []);

  // Render selected records preview (only on Main Form)
  const renderSelectedRecords = () => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    const displayedRecords = selectedRecords.slice(startIndex, startIndex + rowsPerPage);

    return (
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Selected Items</h3>
        <div className="overflow-x-auto bg-white rounded-lg shadow-sm">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border px-3 py-2">Gr No</th>
                <th className="border px-3 py-2">Item Description</th>
                <th className="border px-3 py-2">Receipt Amount</th>
              </tr>
            </thead>
            <tbody>
              {displayedRecords.map((record, index) => (
                <tr key={index}>
                  <td className="border px-3 py-2">{record.gr_no}</td>
                  <td className="border px-3 py-2">{record.item_desc}</td>
                  <td className="border px-3 py-2">{formatToIDR(record.receipt_amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-2">
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
              >
                &lt;
              </button>
              <span className="text-gray-800 font-medium">
                {currentPage} / {totalPages}
              </span>
              <button
                type="button"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="bg-white border border-gray-300 rounded-full p-2 hover:bg-gray-100 disabled:opacity-50"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderMainForm = () => (
    <div className="space-y-4">
      {currentStep === 1 && selectedRecords.length > 0 && renderSelectedRecords()}
      <div className="space-y-4 pt-2 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Create Invoice</h2>
        {/* Row 1 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              placeholder="Enter Invoice Number"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Code (PPN)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxCode}
              onChange={(e) => setTaxCode(e.target.value)}
            >
              <option value="">Select PPN</option>
              {ppnList.map((ppn) => (
                <option key={ppn.id} value={ppn.id}>
                  {ppn.ppn_description}
                </option>
              ))}
            </select>
          </div>
        </div>
        {/* Row 2 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Invoice Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={invoiceDate}
              onChange={(e) => setInvoiceDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Number</label>
            <input
              type="text"
              placeholder="Enter Tax Number"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxNumber}
              onChange={(e) => setTaxNumber(e.target.value)}
            />
          </div>
        </div>
        {/* Row 3 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Base Amount</label>
            <input
              type="text"
              placeholder="Enter Tax Base Amount"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxBaseAmount}
              onChange={(e) => setTaxBaseAmount(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Amount</label>
            <input
              type="text"
              placeholder="Enter Tax Amount"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxAmount}
              onChange={(e) => setTaxAmount(e.target.value)}
            />
          </div>
        </div>
        {/* Row 4 */}
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">WHT Code (PPH)</label>
            <select
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={whtCode}
              onChange={(e) => setWhtCode(e.target.value)}
            >
              <option value="">Select PPH</option>
              {pphList.map((pph) => (
                <option key={pph.id} value={pph.id}>
                  {pph.pph_description}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Tax Date</label>
            <input
              type="date"
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
              value={taxDate}
              onChange={(e) => setTaxDate(e.target.value)}
            />
          </div>
        </div>
        {/* Row 5 */}
        <div className="grid grid-cols-2 gap-8">
          <div>
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Total Invoice Amount</label>
            <input
              type="text"
              readOnly
              className="w-full p-2 border border-gray-300 rounded-md shadow-sm bg-gray-100"
              value={totalInvoiceAmount}
            />
          </div>
        </div>
      </div>
    </div>
  );

  const renderAttachDocuments = () => (
    <div className="space-y-6">
      <h2 className="text-lg font-medium text-gray-900">Attach and Submit Document</h2>
      <div className="overflow-hidden rounded-lg border-y border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="w-24 px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                Document Type
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                File Name
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {documents.map((doc, index) => (
              <tr key={index}>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <button
                    onClick={() => handlePlusClick(index)}
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-800 hover:bg-purple-600 transition-colors"
                  >
                    <Plus size={18} className="text-white font-bold stroke-[2.5]" />
                  </button>
                  <input
                    type="file"
                    ref={(el) => (fileInputRefs.current[index] = el)}
                    className="hidden"
                    onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                  />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className="text-sm text-purple-800 font-medium">{doc.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-500">
                      {doc.fileName || 'No file selected'}
                    </span>
                    {doc.fileName && (
                      <button
                        onClick={() => {
                          const updatedDocuments = [...documents];
                          updatedDocuments[index] = { ...updatedDocuments[index], fileName: '' };
                          setDocuments(updatedDocuments);
                        }}
                        className="text-red-500 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
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
            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
          />
          <span className="text-sm text-gray-700">Invoice Submission Disclaimer Statement</span>
        </label>
      </div>
    </div>
  );

  const renderTermsAndConditions = () => (
    <div className="fixed inset-0 flex items-center justify-center z-[9999]">
      <div className="bg-white rounded-lg w-full max-w-2xl p-6 shadow-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-900">Attach and Submit Document</h2>
          <button onClick={() => setShowTermsModal(false)} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="space-y-4">
          <ol className="list-decimal pl-4 space-y-2 text-sm text-gray-600">
            {Array(9)
              .fill(null)
              .map((_, index) => (
                <li key={index}>
                  Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.
                </li>
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

  // Invoice submission handled via API_Create_Inv_Header_Admin
  const submitInvoice = async () => {
    try {
      const totalDPP = selectedRecords.reduce((acc, record) => acc + Number(record.receipt_amount), 0);
      setTotalInvoiceAmount(taxAmount);

      const formData = new FormData();
      formData.append('inv_no', invoiceNumber);
      formData.append('inv_date', invoiceDate);
      formData.append('inv_faktur', invoiceNumber);
      formData.append('inv_faktur_date', invoiceDate);
      formData.append('inv_supplier', '');
      formData.append('total_dpp', totalDPP.toString());
      formData.append('ppn_id', taxCode);
      formData.append('pph_id', whtCode);
      formData.append('tax_base_amount', taxBaseAmount);
      formData.append('tax_amount', taxAmount);
      formData.append('total_amount', totalInvoiceAmount);
      formData.append('status', 'New');
      formData.append('created_by', '');

      selectedRecords.forEach((record) => {
        formData.append('inv_line_detail[]', record.gr_no);
      });

      documents.forEach((doc, index) => {
        const fileInput = fileInputRefs.current[index];
        if (fileInput && fileInput.files && fileInput.files[0]) {
          if (doc.type.includes('Invoice')) {
            formData.append('invoice_file', fileInput.files[0]);
          } else if (doc.type.includes('Tax Invoice')) {
            formData.append('fakturpajak_file', fileInput.files[0]);
          } else if (doc.type.includes('Delivery Note')) {
            formData.append('suratjalan_file', fileInput.files[0]);
          } else if (doc.type.includes('Purchase Order')) {
            formData.append('po_file', fileInput.files[0]);
          }
        }
      });

      const response = await fetch(API_Create_Inv_Header_Admin(), {
        method: 'POST',
        body: formData,
      });
      if (!response.ok) {
        throw new Error('Invoice creation failed');
      }
      await response.json();
      onFinish();
    } catch (error) {
      console.error('Error creating invoice:', error);
    }
  };

  return (
    <>
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
                      onClick={() => setCurrentStep((prev) => prev - 1)}
                      className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md transition-colors"
                    >
                      Previous
                    </button>
                  )}
                  <button
                    onClick={() => setCurrentStep((prev) => prev + 1)}
                    disabled={
                      currentStep === 2 &&
                      (documents.some((doc) => !doc.fileName) || !disclaimerAccepted)
                    }
                    className={`px-6 py-2 rounded-md transition-colors ${
                      currentStep === 2 &&
                      (documents.some((doc) => !doc.fileName) || !disclaimerAccepted)
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
                <ul className="list-decimal list-inside space-y-2 text-gray-700">
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                  <li>Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor.</li>
                </ul>
                <div className="mt-2 mb-2 flex justify-end gap-2">
                  <button
                    onClick={onClose}
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
    </>
  );
};

export default InvoiceCreationWizard;
