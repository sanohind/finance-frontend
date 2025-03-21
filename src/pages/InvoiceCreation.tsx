import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import InvoiceCreationWizard from './InvoiceCreationWizard';
import Select from "react-select";
import { API_Inv_Line_Admin, API_List_Partner_Admin, API_Inv_Line_Outstanding } from '../api/api';

interface BusinessPartner {
  bp_code: string;
  bp_name: string;
  adr_line_1: string;
}

interface FilterParams {
  bp_id?: string;
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

const InvoiceCreation = () => {
  const [showWizard, setShowWizard] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<GrSaRecord[]>([]);
  const [searchSupplier, setSearchSupplier] = useState('');
  const [grSaDate, setGrSaDate] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [grSaList, setGrSaList] = useState<GrSaRecord[]>([]);
  const [filteredData, setFilteredData] = useState<GrSaRecord[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [userRole, setUserRole] = useState<string>('');
  const [userBpCode, setUserBpCode] = useState<string>('');
  const [initialDataFetched, setInitialDataFetched] = useState(false);

  // Helper to determine if user is a supplier-finance role
  const isSupplierFinance = userRole === '3' || userRole === 'supplier-finance';
  const isAdmin = userRole === '1' || userRole === '2' || userRole === 'super-admin' || userRole === 'admin-finance';

  // Format number to IDR currency format
  const formatToIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2
    }).format(value);
  };

  useEffect(() => {
    const role = localStorage.getItem('role');
    const bpCode = localStorage.getItem('bp_code');
    const bpName = localStorage.getItem('bp_name');
    const bpAddress = localStorage.getItem('adr_line_1');

    setUserRole(role || '');
    setUserBpCode(bpCode || '');

    // If supplier role, set their bp_code as selected
    if ((role === '3' || role === 'supplier-finance') && bpCode) {
      setSelectedSupplier(bpCode);
      setFilterParams(prev => ({ ...prev, bp_id: bpCode }));
    }
  }, []);

  useEffect(() => {
    fetchBusinessPartners();
  }, []);

  // Only fetch data for supplier-finance users automatically
  useEffect(() => {
    if (isSupplierFinance && userBpCode && !initialDataFetched) {
      fetchGrSaData({ bp_id: userBpCode });
      setInitialDataFetched(true);
    }
  }, [isSupplierFinance, userBpCode, initialDataFetched]);

  const fetchGrSaData = async (params: FilterParams = {}) => {
    setIsLoading(true);
    
    // Merge existing filterParams with provided params
    const mergedParams = { ...filterParams, ...params };
    
    // Always ensure supplier filter is applied for supplier-finance users
    if (isSupplierFinance && userBpCode) {
      mergedParams.bp_id = userBpCode;
    }
    
    console.log('Fetching GR/SA data with params:', mergedParams);
    
    const token = localStorage.getItem('access_token');
    try {
      const bpCodeForUrl = isSupplierFinance ? userBpCode : selectedSupplier;
      const { bp_id, ...paramsWithoutBpId } = mergedParams;
      
      const queryParams = Object.entries(paramsWithoutBpId)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
  
      const baseUrl = bpCodeForUrl ? `${API_Inv_Line_Outstanding()}/${bpCodeForUrl}` : API_Inv_Line_Outstanding();
      const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
  
      console.log('Fetching GR/SA data with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch GR/SA data: ${response.status} ${response.statusText}`);
      }
  
      const result = await response.json();
      console.log('Raw GR/SA Response:', result);
  
      if (result && typeof result === 'object') {
        let invLineList: GrSaRecord[] = [];
  
        if (Array.isArray(result.data)) {
          invLineList = result.data;
        }
        else if (result.data && typeof result.data === 'object') {
          invLineList = Object.values(result.data);
        }
        else if (Array.isArray(result)) {
          invLineList = result;
        }
  
        if (invLineList.length > 0) {
          setGrSaList(invLineList);
          setFilteredData(invLineList);
        } else {
          toast.warn('No GR/SA data found for the selected filters');
          setGrSaList([]);
          setFilteredData([]);
        }
      } else {
        throw new Error('Invalid response structure from API');
      }
    } catch (error) {
      console.error('Error fetching GR/SA data:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching GR/SA data: ${error.message}`);
      } else {
        toast.error('Error fetching GR/SA data');
      }
      setGrSaList([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBusinessPartners = async () => {
    if (isSupplierFinance) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
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
  
      let partnersList: BusinessPartner[] = [];
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
    } catch (error) {
      console.error('Error fetching business partners:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching business partners: ${error.message}`);
      } else {
        toast.error('Error fetching business partners');
      }
    } finally {
      setIsLoading(false);
    }
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
  };

  const supplierOptions = businessPartners.map(partner => ({
    value: partner.bp_code,
    label: `${partner.bp_code} | ${partner.bp_name}`,
  }));

  const selectedOption = supplierOptions.find(opt => opt.value === selectedSupplier) || {
    value: selectedSupplier,
    label: selectedSupplier
      ? `${selectedSupplier} | ${businessPartners.find(p => p.bp_code === selectedSupplier)?.bp_name || ''}`
      : "Select Supplier",
  };

  const handleSearch = async () => {
    if (isAdmin && !selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('access_token');
      const bpCodeForUrl = isSupplierFinance ? userBpCode : selectedSupplier;
      const { bp_id, ...paramsWithoutBpId } = filterParams;
      
      const queryParams = Object.entries(paramsWithoutBpId)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');
      
      const baseUrl = bpCodeForUrl ? `${API_Inv_Line_Admin()}/${bpCodeForUrl}` : API_Inv_Line_Admin();
      const url = queryParams ? `${baseUrl}?${queryParams}` : baseUrl;
      
      console.log('Searching with URL:', url);
      
      const response = await fetch(url, {
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
      console.log('Raw Invoice Line Response:', result);
      
      let invLineList: GrSaRecord[] = [];
      if (Array.isArray(result.data)) {
        invLineList = result.data;
      }
      else if (result.data && typeof result.data === 'object') {
        invLineList = Object.values(result.data);
      }
      else if (Array.isArray(result)) {
        invLineList = result;
      }
      
      if (invLineList.length > 0) {
        setGrSaList(invLineList);
        setFilteredData(invLineList);
      } else {
        toast.warn('No invoice line data found for the selected filters');
        setGrSaList([]);
        setFilteredData([]);
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
    if (isSupplierFinance) {
      setFilterParams({ bp_id: userBpCode });
    } else {
      setFilterParams({});
      setSelectedSupplier('');
    }
    
    setSearchSupplier('');
    setInvoiceNumber('');
    setPoNumber('');
    
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });
    
    if (isAdmin) {
      setGrSaList([]);
      setFilteredData([]);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const calculateTotalAmount = (records: GrSaRecord[]): number => {
    return records.reduce((sum, item) => sum + (item.receipt_amount || 0), 0);
  };

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
            <div className='flex space-x-4'>
              <div className="w-1/3 items-center">
                <Select
                  options={supplierOptions}
                  value={selectedOption}
                  onChange={(selectedOption) => {
                    setSearchSupplier(selectedOption?.value || "");
                    setSelectedSupplier(selectedOption?.value || "");
                    setFilterParams(prev => ({ ...prev, bp_id: selectedOption?.value || "" }));
                  }}
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
                  isDisabled={isSupplierFinance}
                  isLoading={isLoading}
                  placeholder="Select Supplier"
                />
              </div>

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
            </div>

            <div className='flex space-x-4'>
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
              type="button" // Added type="button" to prevent form submission
              className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800" 
              onClick={handleSearch}
            >
              Search
            </button>
            <button
              type="button" // Added type="button" here as well
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

            {/* Input Section */}
            <div className="flex flex-col gap-4 w-full md:w-1/3">
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">Selected Record(s)</label>
                <input
                  type="text"
                  className="w-2/3 border border-purple-200 p-2 rounded-md text-xs md:text-sm text-center"
                  readOnly
                  value={selectedRecords.length}
                />
              </div>
              <div className="flex items-center gap-3">
                <label className="w-1/3 text-sm md:text-md font-medium text-gray-700">Total Amount</label>
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
                type="button" // <-- This is the important change
                className="bg-blue-900 text-sm text-white px-6 py-2 rounded hover:bg-blue-800"
                onClick={handleInvoiceCreation}
              >
                Invoice Creation
              </button>
              <button
                type="button" // And here too
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
                    <th className="px-8 py-2 text-gray-700 text-center border">PO No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">BP ID</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">BP Name</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Currency</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">PO Type</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">PO Reference</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">PO Line</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">PO Sequence</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Sequence</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Date</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Year</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Period</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Line</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">GR No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Packing Slip</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">ICS Code</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">ICS Part</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Part No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Description</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Group</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Type</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Item Type Desc</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Request Qty</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Qty</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Approve Qty</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Unit</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Receipt Amount</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Unit Price</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Final Receipt</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Confirmed</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice Date</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice Qty</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Invoice Amount</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Supplier No</th>
                    <th className="px-8 py-2 text-gray-700 text-center border">Due Date</th>
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

export default InvoiceCreation;