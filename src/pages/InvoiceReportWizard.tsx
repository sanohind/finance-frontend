//// filepath: /d:/tes-vercel/src/pages/InvoiceReportWizard.tsx
import React, { useState, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import LogoIcon from '/images/LogoSanoh.png';

interface InvoiceReportWizardProps {
  onClose: () => void;
  onFinish: () => void;
}

const InvoiceReportWizard: React.FC<InvoiceReportWizardProps> = ({ onClose, onFinish }) => {
  // Step management
  const [currentStep, setCurrentStep] = useState(1);
  // Dummy invoice data
  const [invoiceNumber, setInvoiceNumber] = useState('DUMMY-INV-1234');
  const [invoiceDate, setInvoiceDate] = useState('2025-01-10');
  const [taxNumber, setTaxNumber] = useState('0100003204952412');
  const [taxDate, setTaxDate] = useState('2025-01-20');
  const [taxBaseAmount] = useState(11250000);
  const [taxCode, setTaxCode] = useState('I2 - VAT 11%');
  const [taxAmount] = useState(123750);
  const [totalInvoiceAmount] = useState(11373750);

  // Document state (dummy)
  const [documents, setDocuments] = useState([
    { type: 'Invoice *', fileName: 'Invoice.pdf', required: true },
    { type: 'Tax Invoice *', fileName: 'FakturPajak.pdf', required: true },
    { type: 'Delivery Note *', fileName: 'SuratJalan.pdf', required: true },
    { type: 'Purchase Order *', fileName: 'PurchaseOrder.pdf', required: true },
  ]);
  const fileInputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [disclaimerAccepted, setDisclaimerAccepted] = useState(false);

  const handlePlusClick = (index: number) => {
    fileInputRefs.current[index]?.click();
  };

  const handleFileUpload = (index: number, file: File | null) => {
    if (file) {
      const updatedDocs = [...documents];
      updatedDocs[index] = { ...updatedDocs[index], fileName: file.name };
      setDocuments(updatedDocs);
    }
  };

  // Step 1: Main form
  const renderMainForm = () => (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-gray-900">Invoice Data (Dummy)</h2>
      <hr className="my-4 border-t-1 border-blue-900" />
      <div className="grid grid-cols-2 gap-8">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
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
            value={taxBaseAmount.toLocaleString()}
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
            value={taxAmount.toLocaleString()}
          />
        </div>
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Total Invoice Amount</label>
          <input
            type="text"
            className="w-full p-2 border border-blue-900 rounded-md bg-blue-100"
            readOnly
            value={totalInvoiceAmount.toLocaleString()}
          />
        </div>
      </div>
    </div>
  );

  // Step 2: Attach documents
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
                    onClick={() => handlePlusClick(index)}
                    className="bg-blue-800 text-white px-2 py-1 rounded"
                  >
                    Upload
                  </button>
                  <input
                    type="file"
                    ref={(el) => {
                      fileInputRefs.current[index] = el;
                    }}
                    style={{ display: 'none' }}
                    onChange={(e) => handleFileUpload(index, e.target.files?.[0] || null)}
                  />
                </td>
                <td className="px-6 py-4 text-center">{doc.type}</td>
                <td className="px-6 py-4 text-center">{doc.fileName}</td>
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
            className="rounded border-gray-300 text-blue-600 shadow-sm"
          />
          <span className="text-sm text-gray-800">Invoice Submission Disclaimer Statement</span>
        </label>
      </div>
    </div>
  );

  // Step 3: Terms
  const renderTermsAndConditions = () => (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Terms & Conditions (Dummy)</h2>
      <ul className="list-decimal list-inside space-y-2 text-gray-700">
        {Array(5)
          .fill(null)
          .map((_, idx) => (
            <li key={idx}>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. (dummy data)
            </li>
          ))}
      </ul>
      <div className="mt-4 flex justify-end gap-2">
        <button
          onClick={onClose}
          className="bg-blue-900 hover:bg-blue-800 text-white px-6 py-2 rounded-md"
        >
          I Agree
        </button>
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
          <h2 className="text-xl font-semibold text-gray-900">Invoice Wizard (Preview)</h2>
          <div className="flex items-center gap-4">
            <img src={LogoIcon} alt="Sanoh Logo" className="h-8" />
            <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="p-6 bg-violet-100 rounded-lg">
          {currentStep < 3 ? (
            <>
              {renderCurrentStep()}
              <div className="mt-6 flex justify-end gap-2">
                {currentStep > 1 && (
                  <button
                    onClick={() => setCurrentStep(currentStep - 1)}
                    className="bg-gray-600 hover:bg-gray-500 text-white px-6 py-2 rounded-md"
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
                  className={`px-6 py-2 rounded-md ${
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
            renderCurrentStep()
          )}
        </div>
      </div>
    </div>
  );
};

export default InvoiceReportWizard;