import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import PrintReceipt from './PrintReceipt';
import LogoIcon from '../images/logo-sanoh.png';

interface InvoiceReportWizardProps {
  onClose: () => void;
  onFinish: () => void;
}

const InvoiceReportWizard: React.FC<InvoiceReportWizardProps> = ({ onClose, onFinish }) => {
  // Create Invoice state
  const [invoiceNumber, setInvoiceNumber] = useState('SANOH 3.12.6');
  const [invoiceDate, setInvoiceDate] = useState('2025-01-10');
  const [taxCode, setTaxCode] = useState('I2 - VAT 11%');
  const [taxNumber, setTaxNumber] = useState('0100003204952412');
  const [taxBaseAmount, setTaxBaseAmount] = useState('11,250,000.00');
  const [eFakturVATAmount, setEFakturVATAmount] = useState('123,750.00');
  const [taxAmount, setTaxAmount] = useState('123,750.00');
  const [taxDate, setTaxDate] = useState('2025-01-20');
  const [whtCode, setWhtCode] = useState('35 - Payable PPh 23.2%');
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState('--------- ----');

  // Document state
  const [documents, setDocuments] = useState([
    { type: 'Invoice *', fileName: 'Invoice.pdf', required: true },
    { type: 'Tax Invoice *', fileName: 'Faktur Pajak.pdf', required: true },
    { type: 'Delivery Note *', fileName: 'Surat Jalan.pdf', required: true },
    { type: 'Purchase Order *', fileName: 'Purchase Order.pdf', required: true },
  ]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showPrintReceipt, setShowPrintReceipt] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

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

  const renderMainForm = () => (
    <div className="space-y-4">
      {/* Create Invoice Section */}
      <div className="space-y-4 pt-2 border-t border-gray-200">
        <h2 className="text-lg font-medium text-gray-900">Verify Invoice</h2>
        <div className="grid grid-cols-2 gap-8">
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Invoice Number</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={invoiceNumber}
                onChange={(e) => setInvoiceNumber(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Invoice Date</span>
            </div>
            <div>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={invoiceDate}
                onChange={(e) => setInvoiceDate(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Tax Base Amount</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxBaseAmount}
                onChange={(e) => setTaxBaseAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Tax Amount</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxAmount}
                onChange={(e) => setTaxAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">WHT Code</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={whtCode}
                onChange={(e) => setWhtCode(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">PPh Base Amount</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={whtCode}
                onChange={(e) => setWhtCode(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">PPh Amount</span>
            </div> 
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={totalInvoiceAmount}
                onChange={(e) => setTotalInvoiceAmount(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Tax Code</span>
            </div>
            <div>
              <select
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxCode}
                onChange={(e) => setTaxCode(e.target.value)}
              >
                <option value="I2 - VAT 11%">I2 - VAT 11%</option>
              </select>
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Tax Number</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxNumber}
                onChange={(e) => setTaxNumber(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">e-Faktur VAT Amount</span>
            </div>
            <div>
              <input
                type="text"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={eFakturVATAmount}
                onChange={(e) => setEFakturVATAmount(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Tax Date</span>
            </div>
            <div>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxDate}
                onChange={(e) => setTaxDate(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Plan Payment Date</span>
            </div>
            <div>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxDate}
                onChange={(e) => setTaxDate(e.target.value)}
              />
            </div>
            <div className="flex items-center">
              <span className="text-sm font-medium text-gray-700">Total Invoice Amount</span>
            </div>
            <div>
              <input
                type="date"
                className="w-full p-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
                value={taxDate}
                onChange={(e) => setTaxDate(e.target.value)}
              />
            </div>
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
              <th className="w-24 px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-center  text-sm font-semibold text-gray-700 uppercase tracking-wider">
                Document Type
              </th>
              <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700 uppercase tracking-wider">
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
                    className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-fuchsia-900 hover:bg-violet-800 transition-colors"
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
                  <span className="text-sm text-fuchsia-900 font-medium">{doc.type}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-sm text-gray-600">
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
          <span className="text-sm text-gray-800">Invoice Submission Disclaimer Statement</span>
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
            onClick={() => {
              setShowTermsModal(false);
              setShowPrintReceipt(true);
            }}
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

  if (showPrintReceipt) {
    return (
      <PrintReceipt
        paymentTo={paymentTo}
        invoiceNumber={invoiceNumber}
        taxNumber={taxNumber}
        invoiceDate={invoiceDate}
        taxDate={taxDate}
        taxBaseAmount={taxBaseAmount}
        taxAmount={taxAmount}
        eFakturVATAmount={eFakturVATAmount}
        totalInvoiceAmount={totalInvoiceAmount}
        transactionType={transactionType}
        onClose={() => {
          setShowPrintReceipt(false);
          onFinish();
        }}
      />
    );
  }
  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
        <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
         {/* Header */}
          <div className="p-6 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Preview</h2>
            <div className="flex items-center gap-4">
              {/* Logo Sanoh */}
              <img src={LogoIcon} alt="Sanoh Logo" className="h-8" />
              <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
                <X size={18} />
              </button>
            </div>
          </div>
  
        {/* Konten utama */}
        <div className="p-6 bg-violet-100 rounded-lg">
          {currentStep < 3 ? (
            <>
              {renderCurrentStep()}
              <div className="mt-6 flex justify-end gap-2">
                {/* Tombol Previous, hanya muncul jika bukan di step pertama */}
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
              // Step 3: Terms & Conditions
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
  
                {/* Tombol "I Agree" mr-100 */}
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

export default InvoiceReportWizard;