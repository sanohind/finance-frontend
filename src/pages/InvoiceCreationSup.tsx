import { useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import InvoiceCreationWizard from './InvoiceCreationWizard';
import { API_Inv_Line_Admin } from '../api/api';

interface FilterParams {
  gr_no?: string;
  tax_number?: string;
  po_no?: string;
  invoice_no?: string;
  status?: string;
  gr_date?: string;
  tax_date?: string;
  po_date?: string;
  invoice_date?: string;
  dn_number?: string;
}

export interface GrSaRecord {
  inv_line_id: string;
  po_no: string;
  bp_id: string;
  bp_name: string;
  currency: string;
  po_type: string;
  po_reference: string;
  po_line: string;
  po_sequence: string;
  po_receipt_sequence: string;
  actual_receipt_date: string;
  actual_receipt_year: string;
  actual_receipt_period: string;
  receipt_no: string;
  receipt_line: string;
  gr_no: string;
  packing_slip: string;
  item_no: string;
  ics_code: string;
  ics_part: string;
  part_no: string;
  item_desc: string;
  item_group: string;
  item_type: string;
  item_type_desc: string;
  request_qty: number;
  actual_receipt_qty: number;
  approve_qty: number;
  unit: string;
  receipt_amount: number;
  receipt_unit_price: number;
  is_final_receipt: boolean;
  is_confirmed: boolean;
  inv_doc_no: string;
  inv_doc_date: string;
  inv_qty: number;
  inv_amount: number;
  inv_supplier_no: string;
  inv_due_date: string;
  payment_doc: string;
  payment_doc_date: string;
  created_at: string;
  updated_at: string;
}

const InvoiceCreationSup = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<GrSaRecord[]>([]);
  const [grSaList, setGrSaList] = useState<GrSaRecord[]>([]);
  const [filteredData, setFilteredData] = useState<GrSaRecord[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({});

  // Format number to IDR currency format
  const formatToIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Fetch all data first, then filter on frontend like GrTrackingSup
  const handleSearch = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Inv_Line_Admin(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch invoice line data: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      let invLineList: GrSaRecord[] = [];
      if (Array.isArray(result.data)) {
        invLineList = result.data;
      } else if (result.data && typeof result.data === 'object') {
        invLineList = Object.values(result.data);
      } else if (Array.isArray(result)) {
        invLineList = result;
      }

      // Filter on frontend
      let filtered = invLineList;
      Object.entries(filterParams).forEach(([key, value]) => {
        if (value && value !== '') {
          filtered = filtered.filter((item: any) => {
            if (!item[key]) return false;
            // For date fields, do exact match; for others, partial match
            if (key.endsWith('_date')) {
              return String(item[key]).slice(0, 10) === String(value);
            }
            return String(item[key]).toLowerCase().includes(String(value).toLowerCase());
          });
        }
      });

      setGrSaList(filtered);
      setFilteredData(filtered);

      if (filtered.length === 0) {
        toast.warn('No invoice line data found for the selected filters');
      }
    } catch (error) {
      console.error('Error fetching invoice line data:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching invoice line data: ${error.message}`);
      } else {
        toast.error('Error fetching invoice line data');
      }
      setGrSaList([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setFilterParams({});
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });
    setGrSaList([]);
    setFilteredData([]);
  };

  const handleRecordSelection = (record: GrSaRecord) => {
    setSelectedRecords(prev => {
      const found = prev.find(r => r.gr_no === record.gr_no);
      return found ? prev.filter(r => r.gr_no !== record.gr_no) : [...prev, record];
    });
  };

  const handleSelectAll = () => {
    setSelectAll(!selectAll);
    if (!selectAll) {
      setSelectedRecords([...grSaList]);
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
    setSelectedRecords([]);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalAmount = (records: GrSaRecord[]): number => {
    return records.reduce((sum, item) => sum + (item.receipt_amount || 0), 0);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Creation" />
      <ToastContainer />
      {showWizard ? (
        <InvoiceCreationWizard
          selectedRecords={selectedRecords}
          onClose={handleWizardClose}
          onFinish={handleWizardFinish}
        />
      ) : (
        <>
          <form className="space-y-4">
            {/* First row of filters */}
            <div className="flex space-x-4">
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">PO Date</label>
                <input
                  type="date"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  onChange={(e) => handleInputChange('po_date', e.target.value)}
                />
              </div>
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Date</label>
                <input
                  type="date"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  onChange={(e) => handleInputChange('gr_date', e.target.value)}
                />
              </div>
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">Tax Number</label>
                <input
                  type="text"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="----  ---------"
                  onChange={(e) => handleInputChange('tax_number', e.target.value)}
                />
              </div>
            </div>
            {/* Second row of filters */}
            <div className="flex space-x-4">
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Number</label>
                <input
                  type="text"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="----  ---------"
                  onChange={(e) => handleInputChange('invoice_no', e.target.value)}
                />
              </div>
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
                <input
                  type="text"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="----  ---------"
                  onChange={(e) => handleInputChange('po_no', e.target.value)}
                />
              </div>
              <div className="flex w-1/3 items-center gap-2">
                <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Date</label>
                <input
                  type="date"
                  className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
                  onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                />
              </div>
            </div>
          </form>

          <div className="flex justify-end items-center gap-4 ">
            <button
              type="button"
              className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800"
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              type="button"
              className="bg-white text-sm text-black px-8 py-2 rounded border border-purple-800 hover:bg-gray-100"
              onClick={handleClear}
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
                    <td className="px-3 py-2 text-sm text-center">{grSaList[0]?.currency || 'IDR'}</td>
                    <td className="px-3 py-2 text-sm text-center">
                      {formatToIDR(calculateTotalAmount(grSaList))}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      {grSaList.length > 0 ? 'Data retrieved successfully' : 'No data available'}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">
                  Selected Record(s)
                </label>
                <input
                  type="text"
                  className="w-2/3 border border-purple-200 p-2 rounded-md text-xs md:text-sm text-center"
                  readOnly
                  value={selectedRecords.length}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">
                  Total Amount
                </label>
                <input
                  type="text"
                  className="w-2/3 border border-purple-200 p-2 rounded-md text-xs md:text-sm text-center"
                  readOnly
                  value={formatToIDR(calculateTotalAmount(selectedRecords))}
                />
              </div>
            </div>
          </div>

          {/* Separate Section for GR/SA List */}
          <h3 className="text-xl font-semibold text-gray-700">GR / SA List</h3>
          <div className="bg-white p-6 space-y-6 mt-8">
            <div className="flex justify-between mb-8">
              <div>
                <button className="bg-purple-900 text-sm text-white px-6 py-2 rounded hover:bg-purple-800">
                  Invoice Upload
                </button>
                <button className="bg-purple-800 text-sm text-white px-6 py-2 rounded hover:bg-violet-800 ml-4">
                  Download GR/SA
                </button>
              </div>
              <div>
                <button
                  type="button"
                  className="bg-blue-900 text-sm text-white px-6 py-2 rounded hover:bg-blue-800"
                  onClick={handleInvoiceCreation}
                >
                  Invoice Creation
                </button>
                <button
                  type="button"
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
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[120px]">PO No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[120px]">BP ID</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[190px]">BP Name</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Currency</th>
                    <th className="px-6 py-2 text-gray-700 text-center border">PO Type</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[190px]">PO Reference</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">PO Line</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">PO Sequence</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Receipt Sequence</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Date</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Receipt Year</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Receipt Period</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt No</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Receipt Line</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">GR No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[250px]">Packing Slip</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item No</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">ICS Code</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[140px]">ICS Part</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[140px]">Part No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Description</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Item Group</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Item Type</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Type Desc</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Request Qty</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Receipt Qty</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Approve Qty</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Unit</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Amount</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Unit Price</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Final Receipt</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Confirmed</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice Date</th>
                    <th className="px-4 py-2 text-gray-700 text-center border">Invoice Qty</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice Amount</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Supplier No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border min-w-[130px]">Due Date</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Payment Doc</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Payment Date</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Created At</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Updated At</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <tr>
                      <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            checked={selectedRecords.some(r => r.gr_no === item.gr_no)}
                            onChange={() => handleRecordSelection(item)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-3 py-2 text-center">{item.po_no}</td>
                        <td className="px-3 py-2 text-center">{item.bp_id}</td>
                        <td className="px-3 py-2 text-center">{item.bp_name}</td>
                        <td className="px-3 py-2 text-center">{item.currency}</td>
                        <td className="px-3 py-2 text-center">{item.po_type}</td>
                        <td className="px-3 py-2 text-center">{item.po_reference}</td>
                        <td className="px-3 py-2 text-center">{item.po_line}</td>
                        <td className="px-3 py-2 text-center">{item.po_sequence}</td>
                        <td className="px-3 py-2 text-center">{item.po_receipt_sequence}</td>
                        <td className="px-3 py-2 text-center">{item.actual_receipt_date}</td>
                        <td className="px-3 py-2 text-center">{item.actual_receipt_year}</td>
                        <td className="px-3 py-2 text-center">{item.actual_receipt_period}</td>
                        <td className="px-3 py-2 text-center">{item.receipt_no}</td>
                        <td className="px-3 py-2 text-center">{item.receipt_line}</td>
                        <td className="px-3 py-2 text-center">{item.gr_no}</td>
                        <td className="px-3 py-2 text-center">{item.packing_slip}</td>
                        <td className="px-3 py-2 text-center">{item.item_no}</td>
                        <td className="px-3 py-2 text-center">{item.ics_code}</td>
                        <td className="px-3 py-2 text-center">{item.ics_part}</td>
                        <td className="px-3 py-2 text-center">{item.part_no}</td>
                        <td className="px-3 py-2 text-center">{item.item_desc}</td>
                        <td className="px-3 py-2 text-center">{item.item_group}</td>
                        <td className="px-3 py-2 text-center">{item.item_type}</td>
                        <td className="px-3 py-2 text-center">{item.item_type_desc}</td>
                        <td className="px-3 py-2 text-center">{item.request_qty}</td>
                        <td className="px-3 py-2 text-center">{item.actual_receipt_qty}</td>
                        <td className="px-3 py-2 text-center">{item.approve_qty}</td>
                        <td className="px-3 py-2 text-center">{item.unit}</td>
                        <td className="px-3 py-2 text-center">{item.receipt_amount}</td>
                        <td className="px-3 py-2 text-center">{item.receipt_unit_price}</td>
                        <td className="px-3 py-2 text-center">{item.is_final_receipt ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2 text-center">{item.is_confirmed ? 'Yes' : 'No'}</td>
                        <td className="px-3 py-2 text-center">{item.inv_doc_no}</td>
                        <td className="px-3 py-2 text-center">{item.inv_doc_date}</td>
                        <td className="px-3 py-2 text-center">{item.inv_qty}</td>
                        <td className="px-3 py-2 text-center">{item.inv_amount}</td>
                        <td className="px-3 py-2 text-center">{item.inv_supplier_no}</td>
                        <td className="px-3 py-2 text-center">{item.inv_due_date}</td>
                        <td className="px-3 py-2 text-center">{item.payment_doc}</td>
                        <td className="px-3 py-2 text-center">{item.payment_doc_date}</td>
                        <td className="px-3 py-2 text-center">{item.created_at}</td>
                        <td className="px-3 py-2 text-center">{item.updated_at}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                        No data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <Pagination
              totalRows={filteredData.length}
              currentPage={currentPage}
              rowsPerPage={rowsPerPage}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default InvoiceCreationSup;