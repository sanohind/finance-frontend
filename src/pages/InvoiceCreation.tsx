import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import InvoiceCreationWizard from './InvoiceCreationWizard';
import Select from "react-select";

interface GrSaRecord {
    supplierCode: string;
    poNumber: string;
    supplierName: string;
    grNumber: string;
    grItem: string;
    poCategory: string;
    poItem: string;
    invoiceNumber: string;
    paymentPlanDate?: string; // Bisa nullable ('-')
    actualReceiptDate?: string; // Baru, ada di tbody
    actualReceiptQty?: string; // Baru, ada di tbody
    paymentActual?: string; // Bisa nullable ('-')
    dnNumber: string;
    partNumber: string;
    materialDesc: string;
    uom: string;
    grQty: number;
    pricePerUOM: number;
    totalAmount: number;
    currency: string;
    createdBy: string;
    createdDate: string;
  }

const InvoiceCreation = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<GrSaRecord[]>([]);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [grSaDate, setGrSaDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [filteredData] = useState<GrSaRecord[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);

  const grSaList: GrSaRecord[] = [
    {
      supplierCode: 'SUP001',
      supplierName: 'Supplier A',
      poNumber: 'PO001',
      grNumber: 'GR001',
      grItem: 'GR-Item-001',
      poCategory: 'Category A',
      poItem: 'PO-Item-001',
      invoiceNumber: 'INV001',
      paymentPlanDate: '2025-03-01',
      actualReceiptDate: '2025-02-05',
      actualReceiptQty: '100',
      paymentActual: '-',
      dnNumber: 'DN001',
      partNumber: 'PN001',
      materialDesc: 'Material A',
      uom: 'PCS',
      grQty: 100,
      pricePerUOM: 5,
      totalAmount: 500,
      currency: 'USD',
      createdBy: 'Admin',
      createdDate: '2025-02-01',
    },
    {
      supplierCode: 'SUP002',
      supplierName: 'Supplier B',
      poNumber: 'PO002',
      grNumber: 'GR002',
      grItem: 'GR-Item-002',
      poCategory: 'Category B',
      poItem: 'PO-Item-002',
      invoiceNumber: 'INV002',
      paymentPlanDate: '2025-03-10',
      actualReceiptDate: '2025-02-15',
      actualReceiptQty: '50',
      paymentActual: '2025-03-12',
      dnNumber: 'DN002',
      partNumber: 'PN002',
      materialDesc: 'Material B',
      uom: 'KG',
      grQty: 50,
      pricePerUOM: 5,
      totalAmount: 250,
      currency: 'EUR',
      createdBy: 'Admin',
      createdDate: '2025-02-10',
    },
  ];  

  const handleRecordSelection = (record: GrSaRecord) => {
    setSelectedRecords((prev) => {
      const found = prev.find((r) => r.grNumber === record.grNumber);
      if (found) {
        return prev.filter((r) => r.grNumber !== record.grNumber);
      }
      return [...prev, record];
    });
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedRecords(grSaList);
    } else {
      setSelectedRecords([]);
    }
  };

  const handleInvoiceCreation = () => {
    if (selectedRecords.length === 0) {
      toast.error('Please select at least one record before continuing.');
      return;
    }
    setShowWizard(true);
  };

  const handleCancelInvoice = () => {
    toast.error('Invoice Cancelled');
  };

  const handleWizardClose = () => {
    setShowWizard(false);
  };

  const handleWizardFinish = () => {
    setShowWizard(false);
    toast.success('Invoice process completed!');
  };

  const supplierOptions = [
    { value: "Supplier A", label: "Supplier A" },
    { value: "Supplier B", label: "Supplier B" },
  ];
  
  const selectedOption = supplierOptions.find(opt => opt.value === searchSupplier) || {
    value: searchSupplier,
    label: searchSupplier || "Select Supplier",
  };

  function setSearchQuery(_p0: string) {
    throw new Error('Function not implemented.');
  }

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Creation" />
      <ToastContainer />
      <form className="space-y-4">

        <div className='flex space-x-4'>
        <div className="w-1/3 items-center">
        <Select
        options={supplierOptions}
        value={supplierOptions.find(opt => opt.value === searchSupplier) || { value: searchSupplier, label: searchSupplier || "Select Supplier" }}
        onChange={(selectedOption) => setSearchSupplier(selectedOption?.value || "")}
          className="w-full text-xs"
          styles={{
            control: (base) => ({
              ...base,
              borderColor: "#9867C5", // Sama dengan border-gray-200
              padding: "1px", // Sama dengan p-2
              borderRadius: "6px", // Sama dengan rounded-md
              fontSize: "14px", // Sama dengan text-xs
              
            }),
          }}
        />
      </div>

        <div className="flex w-1/3 items-center gap-2">
          <label className="w-1/4 text-sm font-medium text-gray-700">PO Date</label>
          <input
            type="date"
            className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div className="flex w-1/3 items-center gap-2">
          <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Date</label>
          <input
            type="date"
            className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        </div>

        <div className='flex space-x-4'>
        <div className="flex w-1/3 items-center gap-2">
          <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Number</label>
          <input
            type="text"
            className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
            placeholder="----  ---------"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>

        <div className="flex w-1/3 items-center gap-2">
          <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
          <input
            type="text"
            className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
            placeholder="----  ---------"
            value={poNumber}
            onChange={(e) => setPoNumber(e.target.value)}
          />
        </div>

        <div className="flex w-1/3 items-center gap-2">
          <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Date</label>
          <input
            type="date"
            className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
            value={invoiceNumber}
            onChange={(e) => setInvoiceNumber(e.target.value)}
          />
        </div>
        </div>
      </form>

      <div className="flex justify-end items-center gap-4 ">
        <button className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800">Search</button>
        <button
          className="bg-white text-sm text-black px-8 py-2 rounded border border-purple-800 hover:bg-gray-100"
          onClick={() => {
            setSearchSupplier('');
            setSearchQuery('');
          }}
        >
          Clear
        </button>
      </div>

      {/* Section for GR/SA Outstanding */}
      <h3 className="text-xl font-semibold text-gray-700 mb-2">GR / SA Outstanding</h3>
      <div className="bg-white p-6 flex flex-wrap md:flex-nowrap justify-between gap-4">
        {/* Table Section */}
        <div className="overflow-x-auto shadow-md border rounded-lg w-full md:w-2/3">
          <table className="w-full text-md text-left">
            <thead className="bg-gray-200">
              <tr>
                <th className="px-4 py-3 text-md text-gray-800 text-center border">Total Record(s)</th>
                <th className="px-4 py-3 text-md text-gray-800 text-center border">Currency</th>
                <th className="px-4 py-3 text-md text-gray-800 text-center border">Total Amount</th>
                <th className="px-4 py-3 text-md text-gray-800 text-center border">Message</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b hover:bg-gray-50">
                <td className="px-3 py-2 text-sm text-center">{grSaList.length}</td>
                <td className="px-3 py-2 text-sm text-center">{grSaList[0]?.currency || '-'}</td>
                <td className="px-3 py-2 text-sm text-center">
                  {grSaList.reduce((sum, item) => sum + (item.totalAmount || 0), 0)}
                </td>
                <td className="px-3 py-2 text-sm text-center">Status message here</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Input Section */}
        <div className="flex flex-col gap-4 w-full md:w-1/3">
          <div className="flex items-center gap-3">
            <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">Selected Record(s)</label>
            <input
              type="text"
              className="w-2/3 border border-purple-200 p-2 rounded-md text-xs md:text-sm text-center"
              readOnly
              value={(Array.isArray(selectedRecords) ? selectedRecords.length : 0)}
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">Total Amount</label>
            <input
              type="text"
              className="w-2/3 border border-purple-200 p-2 rounded-md text-xs md:text-sm text-center"
              readOnly
              value={(Array.isArray(selectedRecords) ? selectedRecords.reduce((sum, item) => sum + (item.totalAmount || 0), 0) : 0)}
            />
          </div>
        </div>
      </div>

      {/* Separate Section for GR/SA List */}
      <h3 className="text-xl font-semibold text-gray-700">GR / SA List</h3>
      <div className="bg-white p-6 space-y-6 mt-8">
        <div className="flex justify-between mb-8">
          <div>
            <button className="bg-purple-900 text-sm text-white px-6 py-2 rounded hover:bg-purple-800">Invoice Upload</button>
            <button className="bg-purple-800 text-sm text-white px-6 py-2 rounded hover:bg-violet-800 ml-4">Download GR/SA</button>
          </div>
          <div>
            <button
              className="bg-blue-900 text-sm text-white px-6 py-2 rounded hover:bg-blue-800"
              onClick={handleInvoiceCreation}
            >
              Invoice Creation
            </button>
            <button
              className="bg-red-600 text-sm text-white px-6 py-2 rounded hover:bg-red-500 ml-4"
              onClick={handleCancelInvoice}
            >
              Cancel Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto shadow-md border rounded-lg">
          <table className="w-full text-sm text-center">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-3 py-2 text-center border">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
                {/* Keep all existing table headers */}
                <th className="px-8 py-2 text-gray-700 text-center border">Supplier Code</th>
                <th className="px-8 py-2 text-gray-700 text-center border">PO No</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Supplier Name</th>
                <th className="px-8 py-2 text-gray-700 text-center border">GR/SA No</th>
                <th className="px-8 py-2 text-gray-700 text-center border">GR/SA Item</th>
                <th className="px-8 py-2 text-gray-700 text-center border">PO Number</th>
                <th className="px-8 py-2 text-gray-700 text-center border">PO Category</th>
                <th className="px-8 py-2 text-gray-700 text-center border">PO Item</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Invoice Number</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Payment Plan Date</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Actual Receipt Date</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Actual Receipt QTY</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Payment Actual</th>
                <th className="px-8 py-2 text-gray-700 text-center border">DN Number</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Part No/Service Desc</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Material/Service Desc</th>
                <th className="px-8 py-2 text-gray-700 text-center border">UOM</th>
                <th className="px-8 py-2 text-gray-700 text-center border">GR QTY</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Price Per UOM</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Total Amount</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Currency</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Created by</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Created Date</th>
              </tr>
            </thead>
            <tbody>
              {grSaList.map((item, index) => (
                <tr key={index} className="border-b hover:bg-gray-50">
                  <td className="px-3 py-2 text-center">
                    <input
                      type="checkbox"
                      checked={selectedRecords.some(r => r.grSaNumber === item.grSaNumber)}
                      onChange={() => handleRecordSelection(item)}
                      className="cursor-pointer"
                    />
                  </td>
                  <td className="px-3 py-3 text-center">{item.supplierCode}</td>
                  <td className="px-3 py-3 text-center">{item.poNumber}</td>
                  <td className="px-3 py-3 text-center">{item.supplierName}</td>
                  <td className="px-3 py-3 text-center">{item.grNumber}</td>
                  <td className="px-3 py-3 text-center">{item.grItem}</td>
                  <td className="px-3 py-3 text-center">{item.poNumber}</td>
                  <td className="px-3 py-3 text-center">{item.poCategory}</td>
                  <td className="px-3 py-3 text-center">{item.poItem}</td>
                  <td className="px-3 py-3 text-center">{item.invoiceNumber}</td>
                  <td className="px-3 py-3 text-center">{item.paymentPlanDate || '-'}</td>
                  <td className="px-3 py-3 text-center">{item.actualReceiptDate || '-'}</td>
                  <td className="px-3 py-3 text-center">{item.actualReceiptQty || '-'}</td>
                  <td className="px-3 py-3 text-center">{item.paymentActual || '-'}</td>
                  <td className="px-3 py-3 text-center">{item.dnNumber}</td>
                  <td className="px-3 py-3 text-center">{item.partNumber}</td>
                  <td className="px-3 py-3 text-center">{item.materialDesc}</td>
                  <td className="px-3 py-3 text-center">{item.uom}</td>
                  <td className="px-3 py-3 text-center">{item.grQty}</td>
                  <td className="px-3 py-3 text-center">{item.pricePerUOM}</td>
                  <td className="px-3 py-3 text-center">{item.totalAmount}</td>
                  <td className="px-3 py-3 text-center">{item.currency}</td>
                  <td className="px-3 py-3 text-center">{item.createdBy}</td>
                  <td className="px-3 py-3 text-center">{item.createdDate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

      {/* Pagination */}
      <div className="mt-6"> 
        <Pagination
          currentPage={currentPage}
          totalRows={filteredData.length}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
      {showWizard && (
        <InvoiceCreationWizard
          onClose={handleWizardClose}
          onFinish={handleWizardFinish}
        />
      )}
    </div>
  );
};

export default InvoiceCreation;