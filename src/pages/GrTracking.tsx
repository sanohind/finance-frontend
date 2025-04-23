import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import SearchBar from '../components/Table/SearchBar';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Line_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";

// --- Interfaces ---
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
  // bp_id is handled by selectedSupplier, not needed here
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

// --- Component ---
const GrTracking = () => {
  // --- State ---
  const [data, setData] = useState<GrTracking[]>([]); // Data fetched from server
  const [filteredData, setFilteredData] = useState<GrTracking[]>([]); // Data after client-side search bar filter
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null); // react-select object state
  const [searchBarInput, setSearchBarInput] = useState(''); // Top search bar input
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false); // Loading state for fetches
  const [isLoadingPartners, setIsLoadingPartners] = useState(true); // Separate loading for partners
  const [filterParams, setFilterParams] = useState<FilterParams>({}); // Form filter values
  const rowsPerPage = 10;

  // --- Effects ---

  // Get saved page on mount
  useEffect(() => {
    const savedPage = localStorage.getItem('gr_tracking_current_page');
    if (savedPage) {
      setCurrentPage(Number(savedPage));
    }
  }, []);

  // Fetch business partners on mount
  useEffect(() => {
    const fetchBusinessPartners = async () => {
      setIsLoadingPartners(true);
      const token = localStorage.getItem('access_token');
      try {
        const response = await fetch(API_List_Partner_Admin(), {
          method: 'GET',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        });
        if (!response.ok) throw new Error('Failed to fetch business partners');
        const result = await response.json();

        let partnersList: BusinessPartner[] = [];
        // Simplified parsing logic (adjust if API structure differs)
        if (Array.isArray(result.data)) partnersList = result.data;
        else if (result.data && typeof result.data === 'object') partnersList = Object.values(result.data);
        else if (Array.isArray(result)) partnersList = result;

        setBusinessPartners(partnersList);
        if (partnersList.length === 0) toast.warn('No business partners found');

      } catch (error) {
        console.error('Error fetching business partners:', error);
        toast.error(`Error fetching business partners: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoadingPartners(false);
      }
    };
    fetchBusinessPartners();
  }, []);


  // --- Data Fetching Function (Server-side filtering) ---
  const fetchInvLineData = useCallback(async (currentFilters: FilterParams) => {
    if (!selectedSupplier) {
        toast.info('Please select a supplier first.');
        return;
    }

    setIsLoading(true);
    setData([]); // Clear previous data
    setFilteredData([]); // Clear display data

    const token = localStorage.getItem('access_token');
    let url = `${API_Inv_Line_Admin()}/${selectedSupplier.value}`; // Add selected BP to path

    // Build query string from form filter parameters
    const queryParams = Object.entries(currentFilters)
      .filter(([_, value]) => value !== undefined && value !== '')
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join('&');

    if (queryParams) {
      url = `${url}?${queryParams}`;
    }

    console.log('Fetching data with URL:', url);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("Fetch error response:", errorData);
        // Try to parse error if JSON
        try {
            const errorJson = JSON.parse(errorData);
            if (errorJson.message) {
                throw new Error(errorJson.message);
            }
        } catch (parseError) {
            // Fallback to status text or generic message
            throw new Error(`Failed to fetch data (Status: ${response.status} ${response.statusText})`);
        }
      }

      const result = await response.json();
      console.log('Raw Invoice Line Response:', result);

      let invLineList: GrTracking[] = [];
      // Adjust parsing based on your actual API response structure
      if (Array.isArray(result.data)) invLineList = result.data;
      else if (result.data && typeof result.data === 'object') invLineList = Object.values(result.data);
      else if (Array.isArray(result)) invLineList = result; // If the response is directly the array

      if (invLineList.length > 0) {
        setData(invLineList); // Store the fetched data
        // Don't setFilteredData here, let the useEffect handle it
      } else {
        toast.warn('No invoice line data found for the selected filters');
        setData([]);
        // setFilteredData([]); // Already cleared above
      }
    } catch (error) {
      console.error('Error fetching invoice line data:', error);
      toast.error(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setData([]);
      // setFilteredData([]); // Already cleared above
    } finally {
      setIsLoading(false);
    }
  }, [selectedSupplier]); // Depends on selectedSupplier for the path


  // --- Client-Side Filtering (for top search bar ONLY) ---
  // This effect runs whenever the base data (fetched) or the search bar input changes
  useEffect(() => {
    let tempFiltered = [...data]; // Start with the data fetched from the server

    if (searchBarInput) {
      const searchLower = searchBarInput.toLowerCase();
      tempFiltered = tempFiltered.filter(item =>
        (item.bp_id?.toLowerCase() || '').includes(searchLower) ||
        (item.bp_name?.toLowerCase() || '').includes(searchLower) ||
        (item.po_no?.toLowerCase() || '').includes(searchLower) || // Example: Add PO No to search bar filter
        (item.gr_no?.toLowerCase() || '').includes(searchLower)    // Example: Add GR No to search bar filter
      );
    }

    setFilteredData(tempFiltered);
    // Reset page only if the filter actually changed the data being shown
    // This prevents resetting page when typing doesn't match anything new
    if (currentPage !== 1) { // Avoid resetting if already on page 1
        setCurrentPage(1);
    }

  }, [data, searchBarInput]); // Rerun when base data or search input changes


  // --- UI Handlers ---

  // Update filter params state when form inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

   // Handle supplier selection change
   const handleSupplierChange = (selectedOption: { value: string; label: string } | null) => {
       setSelectedSupplier(selectedOption);
       // Clear existing data and filters when supplier changes
       setData([]);
       setFilteredData([]);
       setFilterParams({}); // Clear form filters as well
       setSearchBarInput(''); // Clear top search bar
       // Reset form visuals (optional but good UX)
       const form = document.getElementById('gr-tracking-filter-form') as HTMLFormElement;
       if (form) form.reset();
       setCurrentPage(1);
   };

  // Handle Search Button Click
  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    // Fetch data from server using selected supplier and current form filters
    fetchInvLineData(filterParams);
  };

  // Handle Clear Button Click
  const handleClear = () => {
    setSearchBarInput(''); // Clear top search bar
    setFilterParams({}); // Clear form filters state
    setSelectedSupplier(null); // Clear supplier selection
    setData([]); // Clear fetched data
    setFilteredData([]); // Clear displayed data

    // Reset form visual state
    const form = document.getElementById('gr-tracking-filter-form') as HTMLFormElement;
    if (form) form.reset();

    // Ensure state matches visual reset for controlled components
    setFilterParams({});

    setCurrentPage(1);
  };

  // Handle Pagination Change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('gr_tracking_current_page', String(page));
  };

  // --- Rendering ---

  // Paginated Data Calculation (uses filteredData)
  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Supplier Options for Select Dropdown
  const supplierOptions = businessPartners.map((partner) => ({
    value: partner.bp_code,
    label: `${partner.bp_code} | ${partner.bp_name}`,
  }));

  // Skeleton Rows
  const renderSkeletons = () => {
    return Array(rowsPerPage).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse border-b">
        {/* Adjust colspan based on your actual number of columns */}
        <td colSpan={42} className="px-3 py-2 text-center">
          <div className="h-4 bg-gray-200 rounded w-full my-1"></div>
        </td>
      </tr>
    ));
  };

  // --- JSX (Reverted to original structure) ---
  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Good Receive Tracking Retrieval" />

      {/* Filter Form */}
      <form id="gr-tracking-filter-form" className="space-y-4" onSubmit={handleSearch}>
        {/* Row 1 */}
        <div className='flex space-x-4'>
          {/* Supplier Selection */}
          <div className="w-1/3 items-center"> {/* Removed flex and gap, Select handles layout */}
             {/* <label className="w-1/4 text-sm font-medium text-gray-700">Supplier</label> */} {/* Label handled by Select placeholder */}
            <Select
              options={supplierOptions}
              value={selectedSupplier}
              onChange={handleSupplierChange}
              isDisabled={isLoadingPartners} // Disable only while loading partners
              placeholder="Select Supplier"
              className="w-full text-xs" // Use w-full here
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: "#9867C5", // Your border color
                  padding: "1px", // Adjust padding if needed
                  borderRadius: "6px", // Your border radius
                  fontSize: "14px", // Your font size
                  minHeight: '38px', // Match input height approx
                  height: '38px',
                  boxShadow: state.isFocused ? '0 0 0 1px #9867C5' : 'none', // Optional focus ring
                  '&:hover': {
                    borderColor: '#9867C5' // Keep border color on hover
                  }
                }),
                valueContainer: (base) => ({
                    ...base,
                    padding: '0 8px' // Adjust internal padding
                }),
                input: (base) => ({
                    ...base,
                    margin: '0px',
                    padding: '0px'
                }),
                indicatorSeparator: () => ({
                    display: 'none' // Hide separator
                }),
                indicatorsContainer: (base) => ({
                    ...base,
                    height: '38px'
                })
              }}
              isLoading={isLoadingPartners}
              isClearable={true}
            />
          </div>

          {/* GR / SA Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              placeholder="----  ---------" // More descriptive placeholder
              value={filterParams.gr_no || ''} // Controlled input
              onChange={(e) => handleInputChange('gr_no', e.target.value)}
            />
          </div>

          {/* Tax Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Tax Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              placeholder="----  ---------" // More descriptive placeholder
              value={filterParams.tax_number || ''} // Controlled input
              onChange={(e) => handleInputChange('tax_number', e.target.value)}
            />
          </div>
        </div>

        {/* Row 2 */}
        <div className='flex space-x-4'>
          {/* Supplier Name (Readonly) */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Supplier Name</label>
            <input
              type="text"
              className="input w-3/4 border border-gray-300 bg-gray-100 p-2 rounded-md text-xs" // Adjusted readonly style
              value={selectedSupplier ? selectedSupplier.label.split(' | ')[1] || '' : ''}
              readOnly
            />
          </div>

          {/* GR / SA Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.gr_date || ''} // Controlled input
              onChange={(e) => handleInputChange('gr_date', e.target.value)}
            />
          </div>

          {/* Tax Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Tax Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.tax_date || ''} // Controlled input
              onChange={(e) => handleInputChange('tax_date', e.target.value)}
            />
          </div>
        </div>

        {/* Row 3 */}
        <div className='flex space-x-4'>
          {/* PO Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
            <input
              type="text"
              placeholder="----  ---------" // More descriptive placeholder
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.po_no || ''} // Controlled input
              onChange={(e) => handleInputChange('po_no', e.target.value)}
            />
          </div>

          {/* Invoice Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              placeholder="----  ---------" // More descriptive placeholder
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.invoice_no || ''} // Controlled input
              onChange={(e) => handleInputChange('invoice_no', e.target.value)}
            />
          </div>

          {/* Status */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Status</label>
            <input
              type="text"
              placeholder="----  ---------" // More descriptive placeholder
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.status || ''} // Controlled input
              onChange={(e) => handleInputChange('status', e.target.value)}
            />
          </div>
        </div>

        {/* Row 4 */}
        <div className='flex space-x-4'>
          {/* PO Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.po_date || ''} // Controlled input
              onChange={(e) => handleInputChange('po_date', e.target.value)}
            />
          </div>

          {/* Invoice Date */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Date</label>
            <input
              type="date"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.invoice_date || ''} // Controlled input
              onChange={(e) => handleInputChange('invoice_date', e.target.value)}
            />
          </div>

          {/* DN Number */}
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN Number</label>
            <input
              type="text"
              placeholder="----  ---------" // More descriptive placeholder
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs" // Original classes
              value={filterParams.dn_number || ''} // Controlled input
              onChange={(e) => handleInputChange('dn_number', e.target.value)}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-4 flex flex-col md:flex-row md:items-center md:justify-end"> {/* Reverted structure */}
          <div className="flex justify-end gap-4">
            <button
              type="submit"
              className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800 disabled:opacity-50" // Original classes
              disabled={isLoading || isLoadingPartners || !selectedSupplier} // Disable if loading or no supplier selected
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              className="bg-white text-sm text-black px-8 py-2 rounded border border-purple-900 hover:bg-gray-100" // Original classes
              onClick={handleClear}
              disabled={isLoading || isLoadingPartners} // Disable clear while loading anything
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Table Section */}
      <div className="bg-white p-6 space-y-6 rounded-lg shadow"> {/* Added back shadow/rounded */}
        {/* Top Search Bar */}
        <div className="w-full md:w-1/3"> {/* Reverted width */}
           <label className="mb-1 block text-sm font-medium text-gray-700">Search Results (Supplier Code/Name, PO, GR)</label> {/* Clarified label */}
          <SearchBar
            placeholder="Filter current results..."
            onSearchChange={setSearchBarInput} // Connects to searchBarInput state
            // value={searchBarInput} // Keep SearchBar uncontrolled for simplicity unless needed
          />
        </div>

        {/* Table */}
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6"> {/* Added back shadow/rounded */}
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase text-gray-700"> {/* Reverted classes */}
              <tr>
                {/* Header Cells (Ensure these match your data) */}
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
              {isLoading
                ? renderSkeletons()
                : !selectedSupplier && data.length === 0 && !isLoadingPartners ? (
                    // Message before selecting supplier (only show if partners are loaded)
                    <tr>
                        <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                            Please select a supplier and click search.
                        </td>
                    </tr>
                )
                : paginatedData.length > 0
                ? paginatedData.map((item, index) => (
                    // Data Rows
                    <tr key={`${item.gr_no}-${item.po_line}-${index}`} className="border-b hover:bg-gray-50 text-sm">
                       <td className="px-3 py-2 text-center">{item.po_no}</td>
                       <td className="px-3 py-2 text-center">{item.bp_id}</td>
                       <td className="px-3 py-2 text-left">{item.bp_name}</td>
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
                       <td className="px-3 py-2 text-left">{item.item_desc}</td>
                       <td className="px-3 py-2 text-center">{item.item_group}</td>
                       <td className="px-3 py-2 text-center">{item.item_type}</td>
                       <td className="px-3 py-2 text-left">{item.item_type_desc}</td>
                       <td className="px-3 py-2 text-right">{item.request_qty}</td>
                       <td className="px-3 py-2 text-right">{item.actual_receipt_qty}</td>
                       <td className="px-3 py-2 text-right">{item.approve_qty}</td>
                       <td className="px-3 py-2 text-center">{item.unit}</td>
                       <td className="px-3 py-2 text-right">{item.receipt_amount?.toFixed(2)}</td>
                       <td className="px-3 py-2 text-right">{item.receipt_unit_price?.toFixed(2)}</td>
                       <td className="px-3 py-2 text-center">{item.is_final_receipt ? 'Yes' : 'No'}</td>
                       <td className="px-3 py-2 text-center">{item.is_confirmed ? 'Yes' : 'No'}</td>
                       <td className="px-3 py-2 text-center">{item.inv_doc_no}</td>
                       <td className="px-3 py-2 text-center">{item.inv_doc_date}</td>
                       <td className="px-3 py-2 text-right">{item.inv_qty}</td>
                       <td className="px-3 py-2 text-right">{item.inv_amount?.toFixed(2)}</td>
                       <td className="px-3 py-2 text-center">{item.inv_supplier_no}</td>
                       <td className="px-3 py-2 text-center">{item.inv_due_date}</td>
                       <td className="px-3 py-2 text-center">{item.payment_doc}</td>
                       <td className="px-3 py-2 text-center">{item.payment_doc_date}</td>
                       <td className="px-3 py-2 text-center">{item.created_at}</td>
                       <td className="px-3 py-2 text-center">{item.updated_at}</td>
                    </tr>
                  ))
                : (
                    // No Data Message (after selection/search or if no results)
                    <tr>
                        <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                            {/* Adjust message based on state */}
                            { !selectedSupplier && !isLoadingPartners ? "Please select a supplier and click search." :
                              !isLoading ? "No data available for the current filters." : "" /* Hide during load */
                            }
                        </td>
                    </tr>
                )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <Pagination
          totalRows={filteredData.length} // Paginate based on client-side filtered data
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
};

export default GrTracking;