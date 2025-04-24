import { useEffect, useState, useCallback } from 'react';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
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
  gr_no?: string;
  tax_number?: string;
  po_no?: string;
  invoice_no?: string;
  status?: string;
  gr_date_from?: string;
  gr_date_to?: string;
  tax_date?: string;
  po_date?: string;
  invoice_date?: string;
  dn_number?: string;
  inv_due_date?: string;
}

// Table column filter interface
interface ColumnFilters {
  poNoFilter: string;
  bpIdFilter: string;
  bpNameFilter: string;
  currencyFilter: string;
  poTypeFilter: string;
  poReferenceFilter: string;
  poLineFilter: string;
  poSequenceFilter: string;
  poReceiptSequenceFilter: string;
  receiptDateFilter: string;
  receiptYearFilter: string;
  receiptPeriodFilter: string;
  receiptNoFilter: string;
  receiptLineFilter: string;
  grNoFilter: string;
  packingSlipFilter: string;
  itemNoFilter: string;
  icsCodeFilter: string;
  icsPartFilter: string;
  partNoFilter: string;
  itemDescFilter: string;
  itemGroupFilter: string;
  itemTypeFilter: string;
  itemTypeDescFilter: string;
  requestQtyFilter: string;
  receiptQtyFilter: string;
  approveQtyFilter: string;
  unitFilter: string;
  receiptAmountFilter: string;
  unitPriceFilter: string;
  finalReceiptFilter: string;
  confirmedFilter: string;
  invDocNoFilter: string;
  invDocDateFilter: string;
  invQtyFilter: string;
  invAmountFilter: string;
  invSupplierNoFilter: string;
  invDueDateFilter: string;
  paymentDocFilter: string;
  paymentDateFilter: string;
  createdAtFilter: string;
  updatedAtFilter: string;
}

// --- Component ---
const GrTracking = () => {
  // --- State ---
  const [data, setData] = useState<GrTracking[]>([]); // Data fetched from server
  const [filteredData, setFilteredData] = useState<GrTracking[]>([]); // Data after client-side search bar filter
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);
  const [searchBarInput, setSearchBarInput] = useState(''); // Top search bar input
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  
  // Date range states
  const [grDateFrom, setGrDateFrom] = useState<string>('');
  const [grDateTo, setGrDateTo] = useState<string>('');
  
  // Column filters state with empty initial values
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    poNoFilter: '',
    bpIdFilter: '',
    bpNameFilter: '',
    currencyFilter: '',
    poTypeFilter: '',
    poReferenceFilter: '',
    poLineFilter: '',
    poSequenceFilter: '',
    poReceiptSequenceFilter: '',
    receiptDateFilter: '',
    receiptYearFilter: '',
    receiptPeriodFilter: '',
    receiptNoFilter: '',
    receiptLineFilter: '',
    grNoFilter: '',
    packingSlipFilter: '',
    itemNoFilter: '',
    icsCodeFilter: '',
    icsPartFilter: '',
    partNoFilter: '',
    itemDescFilter: '',
    itemGroupFilter: '',
    itemTypeFilter: '',
    itemTypeDescFilter: '',
    requestQtyFilter: '',
    receiptQtyFilter: '',
    approveQtyFilter: '',
    unitFilter: '',
    receiptAmountFilter: '',
    unitPriceFilter: '',
    finalReceiptFilter: '',
    confirmedFilter: '',
    invDocNoFilter: '',
    invDocDateFilter: '',
    invQtyFilter: '',
    invAmountFilter: '',
    invSupplierNoFilter: '',
    invDueDateFilter: '',
    paymentDocFilter: '',
    paymentDateFilter: '',
    createdAtFilter: '',
    updatedAtFilter: ''
  });
  
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
  
  // Apply column filters whenever data or columnFilters change
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }
    
    // Apply column filters
    const filtered = applyColumnFilters(data);
    
    // Also apply search bar filter
    let searchFiltered = filtered;
    
    if (searchBarInput) {
      const searchLower = searchBarInput.toLowerCase();
      searchFiltered = searchFiltered.filter(item =>
        (item.bp_id?.toLowerCase() || '').includes(searchLower) ||
        (item.bp_name?.toLowerCase() || '').includes(searchLower) ||
        (item.po_no?.toLowerCase() || '').includes(searchLower) ||
        (item.gr_no?.toLowerCase() || '').includes(searchLower)
      );
    }
    
    setFilteredData(searchFiltered);
    
    // Reset to first page only if we're not already there
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [data, columnFilters, searchBarInput]);

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

    // Create a clean params object without date range initially
    const params = { ...currentFilters };
    
    // Build base URL
    let url = `${API_Inv_Line_Admin()}/${selectedSupplier.value}`; // Add selected BP to path
    
    try {
      // Prepare query parameters including date range
      const queryParams = new URLSearchParams();
      
      // Add all non-date filter params
      Object.entries(params)
        .filter(([value]) => value !== undefined && value !== '')
        .forEach(([key, value]) => {
          queryParams.append(key, String(value));
        });
      
      // Explicitly add date range params if they exist
      if (grDateFrom) {
        queryParams.append('gr_date_from', grDateFrom);
        console.log('Added gr_date_from:', grDateFrom);
      }
      
      if (grDateTo) {
        queryParams.append('gr_date_to', grDateTo);
        console.log('Added gr_date_to:', grDateTo);
      }
      
      // Append query parameters to URL if any exist
      const queryString = queryParams.toString();
      if (queryString) {
        url = `${url}?${queryString}`;
      }
      
      console.log('Fetching data with URL:', url);

      const response = await fetch(url, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });

      if (!response.ok) {
        const errorData = await response.text();
        console.error("API Error Response:", errorData);
        try {
          const errorJson = JSON.parse(errorData);
          if (errorJson.message) {
            throw new Error(errorJson.message);
          }
        } catch (parseError) {
          throw new Error(`Failed to fetch data (Status: ${response.status} ${response.statusText})`);
        }
      }

      const result = await response.json();
      console.log('Raw Invoice Line Response:', result);

      let invLineList: GrTracking[] = [];
      // Parse response based on structure
      if (Array.isArray(result.data)) invLineList = result.data;
      else if (result.data && typeof result.data === 'object') invLineList = Object.values(result.data);
      else if (Array.isArray(result)) invLineList = result;

      // If API filtering failed or returned inconsistent results, apply client-side date filtering as fallback
      if (invLineList.length > 0 && (grDateFrom || grDateTo)) {
        invLineList = filterByDateRange(invLineList, grDateFrom, grDateTo);
      }

      if (invLineList.length > 0) {
        setData(invLineList);
      } else {
        toast.warn('No data found for the selected filters');
        setData([]);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error(`Error fetching data: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setData([]);
    } finally {
      // Always ensure loading state is cleared
      setIsLoading(false);
    }
  }, [selectedSupplier, grDateFrom, grDateTo]);

  // Helper function to filter data by date range (client-side fallback)
  const filterByDateRange = (dataToFilter: GrTracking[], fromDate?: string, toDate?: string): GrTracking[] => {
    if (!fromDate && !toDate) return dataToFilter;
    
    return dataToFilter.filter(item => {
      if (!item.actual_receipt_date) return false;
      
      // Format item date for comparison (YYYY-MM-DD)
      const itemDate = new Date(item.actual_receipt_date.split('T')[0]);
      
      // Apply from date filter
      if (fromDate) {
        const from = new Date(fromDate);
        if (itemDate < from) return false;
      }
      
      // Apply to date filter
      if (toDate) {
        const to = new Date(toDate);
        // Add one day to include the "to" date fully
        to.setDate(to.getDate() + 1);
        if (itemDate >= to) return false;
      }
      
      return true;
    });
  };

  // Helper function to apply column filters
  const applyColumnFilters = (dataToFilter: GrTracking[]) => {
    // Make a copy to avoid mutating the original array
    let filtered = [...dataToFilter];
    
    // Check if any column filter has a value
    const hasFilters = Object.values(columnFilters).some(value => value !== '');
    
    // If no filters are set, return the original array
    if (!hasFilters) {
      return filtered;
    }
    
    // Filter by PO No
    if (columnFilters.poNoFilter) {
      filtered = filtered.filter(item => 
        item.po_no?.toLowerCase().includes(columnFilters.poNoFilter.toLowerCase())
      );
    }
    
    // Filter by BP ID
    if (columnFilters.bpIdFilter) {
      filtered = filtered.filter(item => 
        item.bp_id?.toLowerCase().includes(columnFilters.bpIdFilter.toLowerCase())
      );
    }
    
    // Filter by BP Name
    if (columnFilters.bpNameFilter) {
      filtered = filtered.filter(item => 
        item.bp_name?.toLowerCase().includes(columnFilters.bpNameFilter.toLowerCase())
      );
    }
    
    // Filter by Currency
    if (columnFilters.currencyFilter) {
      filtered = filtered.filter(item => 
        item.currency?.toLowerCase().includes(columnFilters.currencyFilter.toLowerCase())
      );
    }
    
    // Filter by PO Type
    if (columnFilters.poTypeFilter) {
      filtered = filtered.filter(item => 
        item.po_type?.toLowerCase().includes(columnFilters.poTypeFilter.toLowerCase())
      );
    }
    
    // Filter by PO Reference
    if (columnFilters.poReferenceFilter) {
      filtered = filtered.filter(item => 
        item.po_reference?.toLowerCase().includes(columnFilters.poReferenceFilter.toLowerCase())
      );
    }
    
    // Filter by PO Line
    if (columnFilters.poLineFilter) {
      filtered = filtered.filter(item => 
        item.po_line?.toLowerCase().includes(columnFilters.poLineFilter.toLowerCase())
      );
    }
    
    // Filter by PO Sequence
    if (columnFilters.poSequenceFilter) {
      filtered = filtered.filter(item => 
        item.po_sequence?.toLowerCase().includes(columnFilters.poSequenceFilter.toLowerCase())
      );
    }
    
    // Filter by PO Receipt Sequence
    if (columnFilters.poReceiptSequenceFilter) {
      filtered = filtered.filter(item => 
        item.po_receipt_sequence?.toLowerCase().includes(columnFilters.poReceiptSequenceFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Date
    if (columnFilters.receiptDateFilter) {
      filtered = filtered.filter(item => 
        item.actual_receipt_date?.includes(columnFilters.receiptDateFilter)
      );
    }
    
    // Filter by Receipt Year
    if (columnFilters.receiptYearFilter) {
      filtered = filtered.filter(item => 
        item.actual_receipt_year?.toLowerCase().includes(columnFilters.receiptYearFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Period
    if (columnFilters.receiptPeriodFilter) {
      filtered = filtered.filter(item => 
        item.actual_receipt_period?.toLowerCase().includes(columnFilters.receiptPeriodFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt No
    if (columnFilters.receiptNoFilter) {
      filtered = filtered.filter(item => 
        item.receipt_no?.toLowerCase().includes(columnFilters.receiptNoFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Line
    if (columnFilters.receiptLineFilter) {
      filtered = filtered.filter(item => 
        item.receipt_line?.toLowerCase().includes(columnFilters.receiptLineFilter.toLowerCase())
      );
    }
    
    // Filter by GR No
    if (columnFilters.grNoFilter) {
      filtered = filtered.filter(item => 
        item.gr_no?.toLowerCase().includes(columnFilters.grNoFilter.toLowerCase())
      );
    }
    
    // Filter by Packing Slip
    if (columnFilters.packingSlipFilter) {
      filtered = filtered.filter(item => 
        item.packing_slip?.toLowerCase().includes(columnFilters.packingSlipFilter.toLowerCase())
      );
    }
    
    // Filter by Item No
    if (columnFilters.itemNoFilter) {
      filtered = filtered.filter(item => 
        item.item_no?.toLowerCase().includes(columnFilters.itemNoFilter.toLowerCase())
      );
    }
    
    // Filter by ICS Code
    if (columnFilters.icsCodeFilter) {
      filtered = filtered.filter(item => 
        item.ics_code?.toLowerCase().includes(columnFilters.icsCodeFilter.toLowerCase())
      );
    }
    
    // Filter by ICS Part
    if (columnFilters.icsPartFilter) {
      filtered = filtered.filter(item => 
        item.ics_part?.toLowerCase().includes(columnFilters.icsPartFilter.toLowerCase())
      );
    }
    
    // Filter by Part No
    if (columnFilters.partNoFilter) {
      filtered = filtered.filter(item => 
        item.part_no?.toLowerCase().includes(columnFilters.partNoFilter.toLowerCase())
      );
    }
    
    // Filter by Item Description
    if (columnFilters.itemDescFilter) {
      filtered = filtered.filter(item => 
        item.item_desc?.toLowerCase().includes(columnFilters.itemDescFilter.toLowerCase())
      );
    }
    
    // Filter by Item Group
    if (columnFilters.itemGroupFilter) {
      filtered = filtered.filter(item => 
        item.item_group?.toLowerCase().includes(columnFilters.itemGroupFilter.toLowerCase())
      );
    }
    
    // Filter by Item Type
    if (columnFilters.itemTypeFilter) {
      filtered = filtered.filter(item => 
        item.item_type?.toLowerCase().includes(columnFilters.itemTypeFilter.toLowerCase())
      );
    }
    
    // Filter by Item Type Description
    if (columnFilters.itemTypeDescFilter) {
      filtered = filtered.filter(item => 
        item.item_type_desc?.toLowerCase().includes(columnFilters.itemTypeDescFilter.toLowerCase())
      );
    }
    
    // Filter by Request Qty
    if (columnFilters.requestQtyFilter) {
      const filterValue = columnFilters.requestQtyFilter;
      filtered = filtered.filter(item => 
        item.request_qty?.toString().includes(filterValue)
      );
    }
    
    // Filter by Receipt Qty
    if (columnFilters.receiptQtyFilter) {
      const filterValue = columnFilters.receiptQtyFilter;
      filtered = filtered.filter(item => 
        item.actual_receipt_qty?.toString().includes(filterValue)
      );
    }
    
    // Filter by Approve Qty
    if (columnFilters.approveQtyFilter) {
      const filterValue = columnFilters.approveQtyFilter;
      filtered = filtered.filter(item => 
        item.approve_qty?.toString().includes(filterValue)
      );
    }
    
    // Filter by Unit
    if (columnFilters.unitFilter) {
      filtered = filtered.filter(item => 
        item.unit?.toLowerCase().includes(columnFilters.unitFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Amount
    if (columnFilters.receiptAmountFilter) {
      const filterValue = columnFilters.receiptAmountFilter;
      filtered = filtered.filter(item => 
        item.receipt_amount?.toString().includes(filterValue)
      );
    }
    
    // Filter by Unit Price
    if (columnFilters.unitPriceFilter) {
      const filterValue = columnFilters.unitPriceFilter;
      filtered = filtered.filter(item => 
        item.receipt_unit_price?.toString().includes(filterValue)
      );
    }
    
    // Filter by Final Receipt
    if (columnFilters.finalReceiptFilter) {
      const filterValue = columnFilters.finalReceiptFilter.toLowerCase();
      if (filterValue === 'yes' || filterValue === 'y' || filterValue === 'true') {
        filtered = filtered.filter(item => item.is_final_receipt === true);
      } else if (filterValue === 'no' || filterValue === 'n' || filterValue === 'false') {
        filtered = filtered.filter(item => item.is_final_receipt === false);
      }
    }
    
    // Filter by Confirmed
    if (columnFilters.confirmedFilter) {
      const filterValue = columnFilters.confirmedFilter.toLowerCase();
      if (filterValue === 'yes' || filterValue === 'y' || filterValue === 'true') {
        filtered = filtered.filter(item => item.is_confirmed === true);
      } else if (filterValue === 'no' || filterValue === 'n' || filterValue === 'false') {
        filtered = filtered.filter(item => item.is_confirmed === false);
      }
    }
    
    // Filter by Invoice Doc No
    if (columnFilters.invDocNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_doc_no?.toLowerCase().includes(columnFilters.invDocNoFilter.toLowerCase())
      );
    }
    
    // Filter by Invoice Doc Date
    if (columnFilters.invDocDateFilter) {
      filtered = filtered.filter(item => 
        item.inv_doc_date?.includes(columnFilters.invDocDateFilter)
      );
    }
    
    // Filter by Invoice Qty
    if (columnFilters.invQtyFilter) {
      const filterValue = columnFilters.invQtyFilter;
      filtered = filtered.filter(item => 
        item.inv_qty?.toString().includes(filterValue)
      );
    }
    
    // Filter by Invoice Amount
    if (columnFilters.invAmountFilter) {
      const filterValue = columnFilters.invAmountFilter;
      filtered = filtered.filter(item => 
        item.inv_amount?.toString().includes(filterValue)
      );
    }
    
    // Filter by Invoice Supplier No
    if (columnFilters.invSupplierNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_supplier_no?.toLowerCase().includes(columnFilters.invSupplierNoFilter.toLowerCase())
      );
    }
    
    // Filter by Invoice Due Date
    if (columnFilters.invDueDateFilter) {
      filtered = filtered.filter(item => 
        item.inv_due_date?.includes(columnFilters.invDueDateFilter)
      );
    }
    
    // Filter by Payment Doc
    if (columnFilters.paymentDocFilter) {
      filtered = filtered.filter(item => 
        item.payment_doc?.toLowerCase().includes(columnFilters.paymentDocFilter.toLowerCase())
      );
    }
    
    // Filter by Payment Date
    if (columnFilters.paymentDateFilter) {
      filtered = filtered.filter(item => 
        item.payment_doc_date?.includes(columnFilters.paymentDateFilter)
      );
    }
    
    // Filter by Created At
    if (columnFilters.createdAtFilter) {
      filtered = filtered.filter(item => 
        item.created_at?.includes(columnFilters.createdAtFilter)
      );
    }
    
    // Filter by Updated At
    if (columnFilters.updatedAtFilter) {
      filtered = filtered.filter(item => 
        item.updated_at?.includes(columnFilters.updatedAtFilter)
      );
    }
    
    return filtered;
  };
  
  // --- UI Handlers ---

  // Update filter params when inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  // Clear specific filter field by field name
  const clearFilterField = (field: keyof FilterParams) => {
    setFilterParams(prev => ({ ...prev, [field]: '' }));
    
    // If field is a date field, find the input element and clear it
    const inputElement = document.querySelector(`input[name="${field}"]`) as HTMLInputElement;
    if (inputElement) {
      inputElement.value = '';
    }
  };

  // Update column filters
  const handleColumnFilterChange = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };

  // Update date range handlers
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateTo(e.target.value);
  };

  // Handle supplier selection change
  const handleSupplierChange = (selectedOption: { value: string; label: string } | null) => {
    setSelectedSupplier(selectedOption);
    // Clear existing data when supplier changes
    setData([]);
    setFilteredData([]);
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
    setSearchBarInput('');
    setFilterParams({});
    setGrDateFrom('');
    setGrDateTo('');
    setSelectedSupplier(null);
    setData([]);
    setFilteredData([]);
    
    // Reset column filters
    setColumnFilters({
      poNoFilter: '',
      bpIdFilter: '',
      bpNameFilter: '',
      currencyFilter: '',
      poTypeFilter: '',
      poReferenceFilter: '',
      poLineFilter: '',
      poSequenceFilter: '',
      poReceiptSequenceFilter: '',
      receiptDateFilter: '',
      receiptYearFilter: '',
      receiptPeriodFilter: '',
      receiptNoFilter: '',
      receiptLineFilter: '',
      grNoFilter: '',
      packingSlipFilter: '',
      itemNoFilter: '',
      icsCodeFilter: '',
      icsPartFilter: '',
      partNoFilter: '',
      itemDescFilter: '',
      itemGroupFilter: '',
      itemTypeFilter: '',
      itemTypeDescFilter: '',
      requestQtyFilter: '',
      receiptQtyFilter: '',
      approveQtyFilter: '',
      unitFilter: '',
      receiptAmountFilter: '',
      unitPriceFilter: '',
      finalReceiptFilter: '',
      confirmedFilter: '',
      invDocNoFilter: '',
      invDocDateFilter: '',
      invQtyFilter: '',
      invAmountFilter: '',
      invSupplierNoFilter: '',
      invDueDateFilter: '',
      paymentDocFilter: '',
      paymentDateFilter: '',
      createdAtFilter: '',
      updatedAtFilter: ''
    });

    // Reset form visual state
    const form = document.getElementById('gr-tracking-filter-form') as HTMLFormElement;
    if (form) form.reset();

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
        {Array(42).fill(0).map((_, cellIndex) => (
          <td key={`cell-${index}-${cellIndex}`} className="px-3 py-2 text-center">
            <div className="h-4 bg-gray-200 rounded w-full"></div>
          </td>
        ))}
      </tr>
    ));
  };

  // --- JSX ---
  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Good Receive Tracking Retrieval" />

      {/* Filter Form */}
      <form id="gr-tracking-filter-form" className="space-y-4" onSubmit={handleSearch}>
        {/* Row 1 - Supplier Selection and Date Range */}
        <div className='flex space-x-4'>
          {/* Supplier Selection */}
          <div className="w-1/3 items-center">
            <Select
              options={supplierOptions}
              value={selectedSupplier}
              onChange={handleSupplierChange}
              isDisabled={isLoadingPartners}
              placeholder="Select Supplier"
              className="w-full text-xs"
              styles={{
                control: (base, state) => ({
                  ...base,
                  borderColor: "#9867C5",
                  padding: "1px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  minHeight: '38px',
                  height: '38px',
                  boxShadow: state.isFocused ? '0 0 0 1px #9867C5' : 'none',
                  '&:hover': {
                    borderColor: '#9867C5'
                  }
                }),
                valueContainer: (base) => ({
                    ...base,
                    padding: '0 8px'
                }),
                input: (base) => ({
                    ...base,
                    margin: '0px',
                    padding: '0px'
                }),
                indicatorSeparator: () => ({
                    display: 'none'
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

          <div className="flex w-2/3 items-center gap-2">
            <label className="w-1/6 text-sm font-medium text-gray-700">GR / SA Date</label>
            <div className="flex w-5/6 space-x-2 items-center">
              <div className="relative w-1/2">
                <input
                  type="date" 
                  className="input w-full border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="From Date"
                  value={grDateFrom}
                  onChange={handleDateFromChange}
                />
                {grDateFrom && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setGrDateFrom('')}
                  >
                    ×
                  </button>
                )}
              </div>
              <span className="text-sm">to</span>
              <div className="relative w-1/2">
                <input 
                  type="date" 
                  className="input w-full border border-violet-200 p-2 rounded-md text-xs"
                  placeholder="To Date"
                  value={grDateTo}
                  onChange={handleDateToChange}
                />
                {grDateTo && (
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    onClick={() => setGrDateTo('')}
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Row 2 - Supplier Name, GR Number, PO Number */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Supplier Name</label>
            <input
              type="text"
              className="input w-3/4 border border-gray-300 bg-gray-100 p-2 rounded-md text-xs"
              value={selectedSupplier ? selectedSupplier.label.split(' | ')[1] || '' : ''}
              readOnly
            />
          </div>
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ---------"
              value={filterParams.gr_no || ''}
              onChange={(e) => handleInputChange('gr_no', e.target.value)}
            />
          </div>
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
            <input
              type="text"
              placeholder="----  ---------"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={filterParams.po_no || ''}
              onChange={(e) => handleInputChange('po_no', e.target.value)}
            />
          </div>
        </div>

        {/* Row 3 - DN Number, Invoice Number, Invoice Due Date */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN Number</label>
            <input
              type="text"
              placeholder="----  ---------"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={filterParams.dn_number || ''}
              onChange={(e) => handleInputChange('dn_number', e.target.value)}
            />
          </div>

          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Number</label>
            <input
              type="text"
              placeholder="----  ---------"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={filterParams.invoice_no || ''}
              onChange={(e) => handleInputChange('invoice_no', e.target.value)}
            />
          </div>
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Due Date</label>
            <div className="relative w-3/4">
              <input 
                type="date" 
                className="input w-full border border-violet-200 p-2 rounded-md text-xs"
                name="inv_due_date"
                value={filterParams.inv_due_date || ''}
                onChange={(e) => handleInputChange('inv_due_date', e.target.value)}
              />
              {filterParams.inv_due_date && (
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  onClick={() => clearFilterField('inv_due_date')}
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between">
          <div></div> {/* Empty div to keep buttons to the right */}
          <div className="flex justify-end gap-4">
            <button 
              type="submit"
              className="bg-purple-900 text-sm text-white px-8 py-2 rounded hover:bg-purple-800 disabled:opacity-50"
              disabled={isLoading || isLoadingPartners || !selectedSupplier}
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
            <button
              type="button"
              className="bg-white text-sm text-black px-8 py-2 rounded border border-purple-900 hover:bg-gray-100"
              onClick={handleClear}
              disabled={isLoading || isLoadingPartners}
            >
              Clear
            </button>
          </div>
        </div>
      </form>

      {/* Table Section */}
      <div className="bg-white p-6 space-y-6 rounded-lg shadow">

        {/* Table */}
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase text-gray-700">
              <tr>
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
                <th className="px-8 py-2 text-gray-700 text-center border">Supplier No</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Invoice Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Invoice Qty</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Invoice Amount</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Invoice No</th>
                <th className="px-8 py-2 text-gray-700 text-center border min-w-[130px]">Due Date</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Payment Doc</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Payment Date</th>
              </tr>
              {/* Column filter inputs row */}
              <tr className="bg-gray-50">
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poNoFilter}
                    onChange={(e) => handleColumnFilterChange('poNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.bpIdFilter}
                    onChange={(e) => handleColumnFilterChange('bpIdFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.bpNameFilter}
                    onChange={(e) => handleColumnFilterChange('bpNameFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.currencyFilter}
                    onChange={(e) => handleColumnFilterChange('currencyFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poTypeFilter}
                    onChange={(e) => handleColumnFilterChange('poTypeFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poReferenceFilter}
                    onChange={(e) => handleColumnFilterChange('poReferenceFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poLineFilter}
                    onChange={(e) => handleColumnFilterChange('poLineFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poSequenceFilter}
                    onChange={(e) => handleColumnFilterChange('poSequenceFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.poReceiptSequenceFilter}
                    onChange={(e) => handleColumnFilterChange('poReceiptSequenceFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="date"
                    placeholder="-"
                    value={columnFilters.receiptDateFilter}
                    onChange={(e) => handleColumnFilterChange('receiptDateFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptYearFilter}
                    onChange={(e) => handleColumnFilterChange('receiptYearFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptPeriodFilter}
                    onChange={(e) => handleColumnFilterChange('receiptPeriodFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptNoFilter}
                    onChange={(e) => handleColumnFilterChange('receiptNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptLineFilter}
                    onChange={(e) => handleColumnFilterChange('receiptLineFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.grNoFilter}
                    onChange={(e) => handleColumnFilterChange('grNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.packingSlipFilter}
                    onChange={(e) => handleColumnFilterChange('packingSlipFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.itemNoFilter}
                    onChange={(e) => handleColumnFilterChange('itemNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.icsCodeFilter}
                    onChange={(e) => handleColumnFilterChange('icsCodeFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.icsPartFilter}
                    onChange={(e) => handleColumnFilterChange('icsPartFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.partNoFilter}
                    onChange={(e) => handleColumnFilterChange('partNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.itemDescFilter}
                    onChange={(e) => handleColumnFilterChange('itemDescFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.itemGroupFilter}
                    onChange={(e) => handleColumnFilterChange('itemGroupFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.itemTypeFilter}
                    onChange={(e) => handleColumnFilterChange('itemTypeFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.itemTypeDescFilter}
                    onChange={(e) => handleColumnFilterChange('itemTypeDescFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.requestQtyFilter}
                    onChange={(e) => handleColumnFilterChange('requestQtyFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptQtyFilter}
                    onChange={(e) => handleColumnFilterChange('receiptQtyFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.approveQtyFilter}
                    onChange={(e) => handleColumnFilterChange('approveQtyFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.unitFilter}
                    onChange={(e) => handleColumnFilterChange('unitFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.receiptAmountFilter}
                    onChange={(e) => handleColumnFilterChange('receiptAmountFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.unitPriceFilter}
                    onChange={(e) => handleColumnFilterChange('unitPriceFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.finalReceiptFilter}
                    onChange={(e) => handleColumnFilterChange('finalReceiptFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.confirmedFilter}
                    onChange={(e) => handleColumnFilterChange('confirmedFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.invDocNoFilter}
                    onChange={(e) => handleColumnFilterChange('invDocNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="date"
                    placeholder="-"
                    value={columnFilters.invDocDateFilter}
                    onChange={(e) => handleColumnFilterChange('invDocDateFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.invQtyFilter}
                    onChange={(e) => handleColumnFilterChange('invQtyFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.invAmountFilter}
                    onChange={(e) => handleColumnFilterChange('invAmountFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.invSupplierNoFilter}
                    onChange={(e) => handleColumnFilterChange('invSupplierNoFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="date"
                    placeholder="-"
                    value={columnFilters.invDueDateFilter}
                    onChange={(e) => handleColumnFilterChange('invDueDateFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="text"
                    placeholder="-"
                    value={columnFilters.paymentDocFilter}
                    onChange={(e) => handleColumnFilterChange('paymentDocFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
                <td className="px-2 py-2 border">
                  <input
                    type="date"
                    placeholder="-"
                    value={columnFilters.paymentDateFilter}
                    onChange={(e) => handleColumnFilterChange('paymentDateFilter', e.target.value)}
                    className="border rounded w-full px-2 py-1 text-xs text-center"
                  />
                </td>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                renderSkeletons()
              ) : !selectedSupplier ? (
                <tr>
                  <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                    Please select a supplier and click search
                  </td>
                </tr>
                )
                : filteredData.length > 0
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