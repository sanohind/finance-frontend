import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import SearchBar from '../components/Table/SearchBar';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Line_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";

interface BusinessPartner {
  bp_code: string;
  bp_name: string;
  adr_line_1: string;
}

interface GrTracking {
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

const GrTracking = () => {
  const [data, setData] = useState<GrTracking[]>([]);
  const [filteredData, setFilteredData] = useState<GrTracking[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string>('');
  const [userBpCode, setUserBpCode] = useState<string>('');
  const [userBpName, setUserBpName] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  const rowsPerPage = 10;

  // Helper to determine if user is a supplier-finance role
  const isSupplierFinance = userRole === '3' || userRole === 'supplier-finance';
  const isAdmin = userRole === '1' || userRole === '2' || userRole === 'super-admin' || userRole === 'admin-finance';

  // Get user role and bp_code on mount
  useEffect(() => {
    const role = localStorage.getItem('role');
    const bpCode = localStorage.getItem('bp_code');
    const bpName = localStorage.getItem('bp_name');
    const bpAddress = localStorage.getItem('adr_line_1');

    setUserRole(role || '');
    setUserBpCode(bpCode || '');
    setUserBpName(bpName || '');

    // If supplier role, set their bp_code as selected and add to business partners
    if ((role === '3' || role === 'supplier-finance') && bpCode && bpName && bpAddress) {
      setSelectedSupplier(bpCode);
      setFilterParams(prev => ({ ...prev, bp_id: bpCode }));
      setBusinessPartners([{
        bp_code: bpCode,
        bp_name: bpName,
        adr_line_1: bpAddress
      }]);
    }

    const savedPage = localStorage.getItem('dn_current_page');
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  // Fetch business partners
  useEffect(() => {
    const fetchBusinessPartners = async () => {
      if (isSupplierFinance) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };
  
    fetchBusinessPartners();
  }, [userRole, isSupplierFinance]);

  // Only fetch data for supplier-finance users automatically
  useEffect(() => {
    if (isSupplierFinance && userBpCode && !initialDataFetched) {
      fetchInvLineData({ bp_id: userBpCode });
      setInitialDataFetched(true);
    }
  }, [isSupplierFinance, userBpCode, initialDataFetched]);

  // Fetch invoice line data with filter params
  const fetchInvLineData = async (params: FilterParams = {}) => {
    setIsLoading(true);
    
    // Merge existing filterParams with provided params
    const mergedParams = { ...filterParams, ...params };
    
    // Always ensure supplier filter is applied for supplier-finance users
    if (isSupplierFinance && userBpCode) {
      mergedParams.bp_id = userBpCode;
    }
    
    console.log('Fetching with params:', mergedParams);
    
    const token = localStorage.getItem('access_token');
    try {
      // Build query string from filter parameters
      const queryParams = Object.entries(mergedParams)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      // Add query string to URL if it exists
      const url = queryParams ? `${API_Inv_Line_Admin()}?${queryParams}` : API_Inv_Line_Admin();

      console.log('Fetching data with URL:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice line data');
      }
  
      const result = await response.json();
      console.log('Raw Invoice Line Response:', result);
  
      if (result && typeof result === 'object') {
        let invLineList = [];
  
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
          // Apply client-side filtering if backend doesn't filter
          if (mergedParams.bp_id) {
            invLineList = invLineList.filter((item: { bp_id: string | undefined; }) => item.bp_id === mergedParams.bp_id);
          }
          
          setData(invLineList);
          setFilteredData(invLineList);
        } else {
          toast.warn('No invoice line data found for the selected filters');
          setData([]);
          setFilteredData([]);
        }
      } else {
        throw new Error('Invalid response structure from API');
      }
    } catch (error) {
      console.error('Error fetching invoice line data:', error);
      if (error instanceof Error) {
        toast.error(`Error fetching invoice line data: ${error.message}`);
      } else {
        toast.error('Error fetching invoice line data');
      }
      setData([]);
      setFilteredData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Additional client-side filtering for search box
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }

    let filtered = [...data];

    // Apply client-side filters for search box
    if (searchSupplier) {
      filtered = filtered.filter(
        (row) =>
          row.bp_id.toLowerCase().includes(searchSupplier.toLowerCase()) ||
          row.bp_name.toLowerCase().includes(searchSupplier.toLowerCase())
      );
    }

    if (searchQuery) {
      filtered = filtered.filter((row) =>
        row.po_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredData(filtered);
    // Reset to first page when filters change
    setCurrentPage(1);
  }, [data, searchSupplier, searchQuery]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('dn_current_page', String(page));
  };

  const handleClear = () => {
    // Clear all filter params except bp_id for supplier-finance users
    if (isSupplierFinance) {
      setFilterParams({ bp_id: userBpCode });
    } else {
      setFilterParams({});
      setSelectedSupplier('');
    }
    
    setSearchSupplier('');
    setSearchQuery('');
    
    // Reset form fields
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });
    
    // For admin users, also clear the data until they search again
    if (isAdmin) {
      setData([]);
      setFilteredData([]);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For admin users, require a supplier selection
    if (isAdmin && !selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }
    
    // Fetch data with current filter params
    fetchInvLineData(filterParams);
  };

  // Update filter params when inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  // Generate skeleton rows
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse border-b">
        {Array(42).fill(0).map((_, cellIndex) => (
          <td key={`cell-${index}-${cellIndex}`} className="px-3 py-2 text-center">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </td>
        ))}
      </tr>
    ));
  };

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Good Receive Tracking Retrieval" />
      <form className="space-y-4" onSubmit={handleSearch}>
        {/* Row 1 */}
        <div className='flex space-x-4'>
          {/* Supplier Selection (Show for all users, but disabled for supplier-finance) */}
          <div className="w-1/3 items-center">
            <Select
              options={businessPartners.map((partner) => ({
                value: partner.bp_code,
                label: `${partner.bp_code} | ${partner.bp_name}`,
              }))}
              value={
                selectedSupplier
                  ? {
                      value: selectedSupplier,
                      label: `${selectedSupplier} | ${businessPartners.find((p) => p.bp_code === selectedSupplier)?.bp_name || ""}`,
                    }
                  : null
              }
              onChange={(selectedOption) => {
                if (selectedOption && !isSupplierFinance) {
                  setSelectedSupplier(selectedOption.value);
                  handleInputChange('bp_id', selectedOption.value);
                }
              }}
              isDisabled={isSupplierFinance}
              placeholder="Select Supplier"
              className="w-full text-xs"
              styles={{
                control: (base) => ({
                  ...base,
                  borderColor: "#9867C5",
                  padding: "1px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  opacity: isSupplierFinance ? 0.7 : 1,
                }),
              }}
              isLoading={isLoading}
            />
          </div>

          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="---------- ----"
              onChange={(e) => handleInputChange('gr_no', e.target.value)}
            />
          </div>

          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Tax Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="---------- ----"
              onChange={(e) => handleInputChange('tax_number', e.target.value)}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Supplier Name</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={isSupplierFinance 
                ? businessPartners[0]?.bp_name || '' 
                : businessPartners.find(p => p.bp_code === selectedSupplier)?.bp_name || ''}
              readOnly
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
            <label className="w-1/4 text-sm font-medium text-gray-700">Tax Date</label>
            <input 
              type="date" 
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" 
              onChange={(e) => handleInputChange('tax_date', e.target.value)}
            />
          </div>
        </div>
        
        {/* Row 3 */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('po_no', e.target.value)}
            />
          </div>

          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('invoice_no', e.target.value)}
            />
          </div>
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Status</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('status', e.target.value)}
            />
          </div>
        </div>
        
        {/* Row 4 */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Date</label>
            <input 
              type="date" 
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" 
              onChange={(e) => handleInputChange('po_date', e.target.value)}
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
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN Number</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('dn_number', e.target.value)}
            />
          </div>
        </div>

        <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div></div> {/* Empty div to keep buttons to the right */}
          <div className="flex justify-end gap-4">
            <button 
              type="submit"
              className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800"
            >
              Search
            </button>
            <button
              type="button"
              className="bg-white text-sm text-black px-8 py-2 rounded border border-purple-900 hover:bg-gray-100"
              onClick={handleClear}
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      <div className="bg-white p-6 space-y-6">
        <div className="w-70">
          <SearchBar
            placeholder="Search Supplier Code/Name..."
            onSearchChange={setSearchSupplier}
          />
        </div>
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
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
                renderSkeletons()
              ) : isAdmin && !selectedSupplier ? (
                <tr>
                  <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                    Please select a supplier and click search
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
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
    </div>
  );
};

export default GrTracking;