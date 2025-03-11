import React, { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import SearchBar from '../components/Table/SearchBar';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Header_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";

interface Invoice {
  inv_no: string;
  receipt_number: string | null;
  receipt_path: string | null;
  bp_code: string | null;
  bp_name?: string; // For display purposes
  inv_date: string | null;
  plan_date: string | null;
  actual_date: string | null;
  inv_faktur: string | null;
  inv_faktur_date: string | null;
  inv_supplier: string | null;
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

interface SearchBarProps {
  placeholder: string;
  onSearchChange: (value: string) => void;
}

const InvoiceReport = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([]);
  const [invoiceNumber, setInvoiceNumber] = useState<string>('');
  const [poDate, setPoDate] = useState<string>('');
  const [poNumber, setPoNumber] = useState<string>('');
  const [grSaDate, setGrSaDate] = useState<string>('');
  const [selectedRecords, setSelectedRecords] = useState<number>(0);
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [searchSupplier, setSearchSupplier] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [autoPosting, setAutoPosting] = useState(false);
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [userRole, setUserRole] = useState<string>('');
  const [userBpCode, setUserBpCode] = useState<string>('');
  const [rowsPerPage] = useState(10);

  const isSupplierFinance = userRole === '3' || userRole === 'supplier-finance';

  useEffect(() => {
    const role = localStorage.getItem('role');
    const bpCode = localStorage.getItem('bp_code');
    const bpName = localStorage.getItem('bp_name');
    const bpAddress = localStorage.getItem('adr_line_1');

    setUserRole(role || '');
    setUserBpCode(bpCode || '');

    // If supplier role, set their bp_code as selected and add to business partners
    if ((role === '3' || role === 'supplier-finance') && bpCode && bpName && bpAddress) {
      setSearchSupplier(bpCode);
      setBusinessPartners([{
        bp_code: bpCode,
        bp_name: bpName,
        adr_line_1: bpAddress
      }]);
    }
  }, []);

  // Fetch business partners
  useEffect(() => {
    const fetchBusinessPartners = async () => {
      if (userRole === '3' || userRole === 'supplier-finance') {
        return;
      }
      const token = localStorage.getItem('access_token');
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
        console.log('Raw Business Partners Response:', result);
    
        if (result && typeof result === 'object') {
          let partnersList = [];
    
          if (result.bp_code && result.bp_name && result.adr_line_1) {
            partnersList = [{
              bp_code: result.bp_code,
              bp_name: result.bp_name,
              adr_line_1: result.adr_line_1,
            }];
          }
          else if (Array.isArray(result.data)) {
            partnersList = result.data.map((partner: BusinessPartner) => ({
              bp_code: partner.bp_code,
              bp_name: partner.bp_name,
              adr_line_1: partner.adr_line_1,
            }));
          }
          else if (result.data && typeof result.data === 'object') {
            partnersList = Object.values(result.data).map((partner: any) => ({
              bp_code: partner.bp_code,
              bp_name: partner.bp_name,
              adr_line_1: partner.adr_line_1,
            }));
          }
          else if (Array.isArray(result)) {
            partnersList = result.map((partner: BusinessPartner) => ({
              bp_code: partner.bp_code,
              bp_name: partner.bp_name,
              adr_line_1: partner.adr_line_1,
            }));
          }
    
          if (partnersList.length > 0) {
            setBusinessPartners(partnersList);
          } else {
            toast.warn('No business partners found in the response');
          }
        } else {
          throw new Error('Invalid response structure from API');
        }
      } catch (error) {
        console.error('Error fetching business partners:', error);
        if (error instanceof Error) {
          toast.error(`Error fetching business partners: ${error.message}`);
        } else {
          toast.error('Error fetching business partners');
        }
      }
    };
  
    fetchBusinessPartners();
  }, [userRole]);

  // Fetch invoice data
  useEffect(() => {
    const fetchInvoiceData = async () => {
      setIsLoading(true);
      try {
        const token = localStorage.getItem('access_token');
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
        
        if (result && typeof result === 'object') {
          let invoiceList = [];
    
          if (Array.isArray(result.data)) {
            invoiceList = result.data;
          } else if (result.data && typeof result.data === 'object') {
            invoiceList = Object.values(result.data);
          } else if (Array.isArray(result)) {
            invoiceList = result;
          }
    
          if (invoiceList.length > 0) {
            setData(invoiceList);
            setFilteredData(invoiceList);
          } else {
            toast.warn('No invoice data found');
          }
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

  // Filter data
  useEffect(() => {
    let filtered = [...data];

    // For supplier-finance roles, always filter by their bp_code
    if (isSupplierFinance) {
      filtered = filtered.filter(
        (row) => row.bp_code === userBpCode
      );
    } 
    // For other roles, filter by selected supplier if any
    else if (searchSupplier) {
      filtered = filtered.filter(
        (row) =>
          (row.bp_code && row.bp_code.toLowerCase().includes(searchSupplier.toLowerCase())) ||
          (row.bp_name && row.bp_name.toLowerCase().includes(searchSupplier.toLowerCase()))
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((row) =>
        row.inv_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [searchSupplier, searchQuery, data, userBpCode, isSupplierFinance]);

  const handleSupplierChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedOptions = Array.from(event.target.selectedOptions, (option) => option.value);
    setSelectedSuppliers(selectedOptions);
  };

  const handleRecordSelection = (record: Invoice) => {
    setSelectedRecords((prev) => prev + 1);
    setTotalAmount((prev) => prev + (record.total_amount || 0));
  };

  const handleInvoiceCreation = () => {
    toast.info('Download attachment initiated');
  };

  const handleCancelInvoice = () => {
    toast.info('Invoice cancelled');
  };

  const handleClear = () => {
    // For supplier roles, don't clear the supplier as they're locked to their own supplier
    if (!isSupplierFinance) {
      setSearchSupplier('');
    }
    setSearchQuery('');
    setInvoiceNumber('');
    setPoDate('');
    setPoNumber('');
    setGrSaDate('');
    setCurrentPage(1);
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
    } catch (error) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Report" />
      <ToastContainer />
      <form className="space-y-4">

        {/* Only show supplier selection for non-supplier-finance users */}
        {!isSupplierFinance && (
          <div className='flex space-x-4'>
            <div className="w-1/3 items-center">
              <Select
                options={businessPartners.map((partner) => ({
                  value: partner.bp_code,
                  label: `${partner.bp_code} | ${partner.bp_name}`,
                }))}
                value={
                  searchSupplier
                    ? {
                        value: searchSupplier,
                        label:
                          businessPartners.find((p) => p.bp_code === searchSupplier)?.bp_name ||
                          searchSupplier,
                      }
                    : null
                }
                onChange={(selectedOption) => selectedOption && setSearchSupplier(selectedOption.value)}
                placeholder="Select Supplier"
                className="w-full text-xs"
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#9867C5",
                    padding: "1px",
                    borderRadius: "6px",
                    fontSize: "14px",
                  }),
                }}
              />
            </div>
          </div>
        )}

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
            <label className="w-1/4 text-sm font-medium text-gray-700">Verification Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>

          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Status</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ----------"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
        </div>

        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Payment Planning Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
            />
          </div>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Creation Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
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
          className="bg-white text-sm text-black px-8 py-2 rounded border border-violet-800 hover:bg-gray-100"
          onClick={handleClear}
        >
          Clear
        </button>
      </div>

      <h3 className="text-xl font-semibold text-gray-700">Invoice List</h3>
      <div className="bg-white p-6 space-y-6 mt-8">
        <div className="flex justify-between mb-8">
          <div>
            <button className="bg-red-600 text-sm text-white px-6 py-2 rounded hover:bg-red-500">Cancel Invoice</button>
          </div>
          <div>
            <button
              className="bg-purple-900 text-sm text-white px-6 py-2 rounded hover:bg-purple-800"
              onClick={handleInvoiceCreation}
            >
              Download Attachment
            </button>
            
            {/* Only show Verify button if user is not supplier-finance */}
            {!isSupplierFinance && (
              <button
                className="bg-green-600 text-sm text-white px-6 py-2 rounded hover:bg-green-500 ml-4"
                onClick={handleCancelInvoice}
              >
                Verify
              </button>
            )}
            
            <button
              className="bg-blue-900 text-sm text-white px-6 py-2 rounded hover:bg-blue-800 ml-4"
              onClick={handleCancelInvoice}
            >
              Post Invoice
            </button>
          </div>
        </div>

        <div className="overflow-x-auto shadow-md border rounded-lg">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-3 py-2 text-gray-700 text-center border"></th>
                <th className="px-3 py-2 text-gray-700 text-center border">Invoice No</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Receipt No</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Supplier Code</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Supplier Name</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Invoice Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border" colSpan={2}>Payment Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Tax Number</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Tax Date</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Total DPP</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Tax Base Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Tax Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border">PPh Base Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border">PPh Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Total Amount</th>
                <th className="px-3 py-2 text-gray-700 text-center border">Status</th>
              </tr>
              <tr className="bg-gray-100 border">
                <th colSpan={6}></th>
                <th className="px-3 py-2 text-md text-gray-600 normal-case text-center border">Plan</th>
                <th className="px-3 py-2 text-md text-gray-600 normal-case text-center border">Actual</th>
                <th colSpan={9}></th>
              </tr>
            </thead>

            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={17} className="px-6 py-4 text-center text-gray-500">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((invoice, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-center">
                      <input 
                        type="checkbox" 
                        onChange={() => handleRecordSelection(invoice)}
                      />
                    </td>
                    <td className="px-3 py-2 text-center">{invoice.inv_no}</td>
                    <td className="px-3 py-2 text-center">{invoice.receipt_number || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.bp_code || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.bp_name || '-'}</td>
                    <td className="px-3 py-2 text-center">{formatDate(invoice.inv_date)}</td>
                    <td className="px-3 py-2 text-center">{formatDate(invoice.plan_date)}</td>
                    <td className="px-3 py-2 text-center">{formatDate(invoice.actual_date)}</td>
                    <td className="px-3 py-2 text-center">{invoice.inv_faktur || '-'}</td>
                    <td className="px-3 py-2 text-center">{formatDate(invoice.inv_faktur_date)}</td>
                    <td className="px-3 py-2 text-center">{invoice.total_dpp?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.tax_base_amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.tax_amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.pph_base_amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.pph_amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.total_amount?.toLocaleString() || '-'}</td>
                    <td className="px-3 py-2 text-center">{invoice.status || '-'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={17} className="px-6 py-4 text-center text-gray-500">
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
    </div>
  );
};

export default InvoiceReport;