import { useEffect, useState, useCallback } from 'react';
import { Search, XCircle, Download } from "lucide-react";
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Line_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";
import * as XLSX from 'xlsx';

// --- Interfaces ---
interface BusinessPartner {
  bp_code: string;
  bp_name: string;
  adr_line_1: string;
}

interface GrTracking {
  po_no: string;
  gr_no: string; // Moved here
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
  packing_slip?: string;
  po_no?: string;
  receipt_no?: string;
  gr_date_from?: string;
  gr_date_to?: string;
}

// Table column filter interface
interface ColumnFilters {
  bpIdFilter: string;
  bpNameFilter: string;
  poNoFilter: string;
  receiptNoFilter: string;
  poReferenceFilter: string;
  currencyFilter: string;
  receiptDateFilter: string;
  packingSlipFilter: string;
  partNoFilter: string;
  itemDescFilter: string;
  itemNoFilter: string;
  unitFilter: string;
  itemTypeFilter: string;
  unitPriceFilter: string;
  requestQtyFilter: string;
  receiptQtyFilter: string;
  approveQtyFilter: string;
  receiptAmountFilter: string;
  finalReceiptFilter: string;
  confirmedFilter: string;
  invSupplierNoFilter: string;
  invDocNoFilter: string;
  invDocDateFilter: string;
  invQtyFilter: string;
  invAmountFilter: string;
  invDueDateFilter: string;
  paymentDocFilter: string;
  paymentDateFilter: string;
}

// --- Component ---
const GrTracking = () => {  // --- Currency Formatter Function ---
  const formatRupiah = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount)) return 'Rp 0,00';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // --- Currency Formatter for Invoice Amount (hide if empty) ---
  const formatRupiahInvoice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // --- State ---
  const [data, setData] = useState<GrTracking[]>([]); // Data fetched from server
  const [filteredData, setFilteredData] = useState<GrTracking[]>([]); // Data after client-side search bar filter
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState<{ value: string; label: string } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPartners, setIsLoadingPartners] = useState(true);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  
  // Date range states
  const [grDateFrom, setGrDateFrom] = useState<string>('');
  const [grDateTo, setGrDateTo] = useState<string>('');
    // Column filters state with empty initial values
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    bpIdFilter: '',
    bpNameFilter: '',
    poNoFilter: '',
    receiptNoFilter: '',
    poReferenceFilter: '',
    currencyFilter: '',
    receiptDateFilter: '',
    packingSlipFilter: '',
    partNoFilter: '',
    itemDescFilter: '',
    itemNoFilter: '',
    unitFilter: '',
    itemTypeFilter: '',
    unitPriceFilter: '',
    requestQtyFilter: '',
    receiptQtyFilter: '',
    approveQtyFilter: '',
    receiptAmountFilter: '',
    finalReceiptFilter: '',
    confirmedFilter: '',
    invSupplierNoFilter: '',
    invDocNoFilter: '',
    invDocDateFilter: '',
    invQtyFilter: '',
    invAmountFilter: '',
    invDueDateFilter: '',
    paymentDocFilter: '',
    paymentDateFilter: ''
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
  }, []);    // Apply only column filters whenever data or columnFilters change
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }
    
    // Start with the original data (already filtered by server-side form filters)
    let filtered = [...data];
    
    // Apply column filters
    filtered = applyColumnFilters(filtered);
    
    setFilteredData(filtered);
    
    // Reset to first page only if we're not already there
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [data, columnFilters]);

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

      // Filter for items where inv_supplier_no and inv_doc_no are empty
      invLineList = invLineList.filter(
        (item: GrTracking) => !item.inv_supplier_no && !item.inv_doc_no
      );

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
    
    // Filter by PO No
    if (columnFilters.poNoFilter) {
      filtered = filtered.filter(item => 
        item.po_no?.toLowerCase().includes(columnFilters.poNoFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt No
    if (columnFilters.receiptNoFilter) {
      filtered = filtered.filter(item => 
        item.receipt_no?.toLowerCase().includes(columnFilters.receiptNoFilter.toLowerCase())
      );
    }
    
    // Filter by PO Reference
    if (columnFilters.poReferenceFilter) {
      filtered = filtered.filter(item => 
        item.po_reference?.toLowerCase().includes(columnFilters.poReferenceFilter.toLowerCase())
      );
    }
    
    // Filter by Currency
    if (columnFilters.currencyFilter) {
      filtered = filtered.filter(item => 
        item.currency?.toLowerCase().includes(columnFilters.currencyFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Date
    if (columnFilters.receiptDateFilter) {
      filtered = filtered.filter(item => 
        item.actual_receipt_date?.includes(columnFilters.receiptDateFilter)
      );
    }
    
    // Filter by Packing Slip
    if (columnFilters.packingSlipFilter) {
      filtered = filtered.filter(item => 
        item.packing_slip?.toLowerCase().includes(columnFilters.packingSlipFilter.toLowerCase())
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
    
    // Filter by Item No
    if (columnFilters.itemNoFilter) {
      filtered = filtered.filter(item => 
        item.item_no?.toLowerCase().includes(columnFilters.itemNoFilter.toLowerCase())
      );
    }
    
    // Filter by Unit
    if (columnFilters.unitFilter) {
      filtered = filtered.filter(item => 
        item.unit?.toLowerCase().includes(columnFilters.unitFilter.toLowerCase())
      );
    }
    
    // Filter by Item Type
    if (columnFilters.itemTypeFilter) {
      filtered = filtered.filter(item => 
        item.item_type_desc?.toLowerCase().includes(columnFilters.itemTypeFilter.toLowerCase())
      );
    }
    
    // Filter by Unit Price
    if (columnFilters.unitPriceFilter) {
      const filterValue = columnFilters.unitPriceFilter;
      filtered = filtered.filter(item => 
        item.receipt_unit_price?.toString().includes(filterValue)
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
    
    // Filter by Receipt Amount
    if (columnFilters.receiptAmountFilter) {
      const filterValue = columnFilters.receiptAmountFilter;
      filtered = filtered.filter(item => 
        item.receipt_amount?.toString().includes(filterValue)
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
    
    // Filter by Invoice Supplier No
    if (columnFilters.invSupplierNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_supplier_no?.toLowerCase().includes(columnFilters.invSupplierNoFilter.toLowerCase())
      );
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
    
    return filtered;
  };
  
  // --- UI Handlers ---
  // Update filter params when inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
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
    setFilterParams({});
    setGrDateFrom('');
    setGrDateTo('');
    setSelectedSupplier(null);
    setData([]);
    setFilteredData([]);
    // Reset column filters
    setColumnFilters({
      bpIdFilter: '',
      bpNameFilter: '',
      poNoFilter: '',
      receiptNoFilter: '',
      poReferenceFilter: '',
      currencyFilter: '',
      receiptDateFilter: '',
      packingSlipFilter: '',
      partNoFilter: '',
      itemDescFilter: '',
      itemNoFilter: '',
      unitFilter: '',
      itemTypeFilter: '',
      unitPriceFilter: '',
      requestQtyFilter: '',
      receiptQtyFilter: '',
      approveQtyFilter: '',
      receiptAmountFilter: '',
      finalReceiptFilter: '',
      confirmedFilter: '',
      invSupplierNoFilter: '',
      invDocNoFilter: '',
      invDocDateFilter: '',
      invQtyFilter: '',
      invAmountFilter: '',
      invDueDateFilter: '',
      paymentDocFilter: '',
      paymentDateFilter: ''
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

  // Handle Excel Export with XLSX - Auto flex column widths based on data content
  const handleExcelExport = () => {
    if (filteredData.length === 0) {
      toast.warn('No data available to export');
      return;
    }

    try {
      toast.info('Preparing Excel file, please wait...');

      // Define headers in the exact order shown in the table
      const headers = [        'BP ID', 'BP Name', 'PO NO', 'DN NO', 'PO Reference', 
        'Receipt Date', 'Supplier REF No', 'Part No', 'Item Desc', 'ERP PART NO', 
        'Unit', 'Item Type', 'Currency', 'Unit Price', 'Request Qty', 'Receipt Qty', 'Approve Qty', 
        'Receipt Amount', 'Final Receipt', 'Confirmed', 'Inv Supplier No', 'ERP INV NO',
        'Invoice Date', 'Invoice Qty', 'Invoice Amount', 'Invoice Due Date', 
        'Payment Doc', 'Payment Date'
      ];      // Convert filtered data to rows format - Using raw numeric values
      const rows = filteredData.map(item => [
        item.bp_id || '',
        item.bp_name || '',
        item.po_no || '',
        item.receipt_no || '',
        item.po_reference || '',
        item.actual_receipt_date || '',
        item.packing_slip || '',
        item.part_no || '',
        item.item_desc || '',
        item.item_no || '',
        item.unit || '',
        item.item_type_desc || '',
        item.currency || '',
        item.receipt_unit_price || '', // Raw numeric value
        item.request_qty || '', // Raw numeric value
        item.actual_receipt_qty || '', // Raw numeric value
        item.approve_qty || '', // Raw numeric value
        item.receipt_amount || '', // Raw numeric value
        item.is_final_receipt ? 'Yes' : 'No',
        item.is_confirmed ? 'Yes' : 'No',
        item.inv_supplier_no || '',
        item.inv_doc_no || '',
        item.inv_doc_date || '',        
        item.inv_qty || '', // Raw numeric value
        item.inv_amount || '', // Raw numeric value
        item.inv_due_date || '',
        item.payment_doc || '',
        item.payment_doc_date || ''
      ]);

      // Create worksheet from array of arrays
      const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);

      // Auto-calculate column widths based on content length
      const calculateColumnWidths = () => {
        const colWidths = [];
        
        // For each column index
        for (let i = 0; i < headers.length; i++) {
          let maxWidth = headers[i].length; // Start with header length
          
          // Check all data rows for this column
          rows.forEach(row => {
            const cellValue = String(row[i] || '');
            if (cellValue.length > maxWidth) {
              maxWidth = cellValue.length;
            }
          });
          
          // Add some padding and set reasonable min/max limits
          const padding = 2;
          const minWidth = 8;
          const maxWidth_limit = 50; // Prevent excessively wide columns
          
          const finalWidth = Math.min(Math.max(maxWidth + padding, minWidth), maxWidth_limit);
          colWidths.push({ wch: finalWidth });
        }
        
        return colWidths;
      };

      // Apply the calculated column widths
      ws['!cols'] = calculateColumnWidths();

      // No number formatting applied - keeping raw numeric values without any formatting

      // Create workbook and add worksheet
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'GR Tracking Report');

      // Generate filename with current date and supplier info
      const currentDate = new Date().toISOString().split('T')[0];
      const supplierCode = selectedSupplier?.value || 'ALL';
      const filename = `GR_Tracking_${supplierCode}_${currentDate}.xlsx`;

      // Write and download the file
      XLSX.writeFile(wb, filename);
      
      toast.success(`Exported ${filteredData.length} records to ${filename} with auto-fitted columns`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
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
  }));  // Skeleton Rows
  const renderSkeletons = () => {
    return Array(rowsPerPage).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse border-b">
        {Array(28).fill(0).map((_, cellIndex) => (
          <td key={`cell-${index}-${cellIndex}`} className="px-6 py-3 text-center border-b">
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
        </div>        {/* Row 2 - Supplier Name, Packing Slip, PO Number */}
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
            <label className="w-1/4 text-sm font-medium text-gray-700">Packing Slip</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="----  ---------"
              value={filterParams.packing_slip || ''}
              onChange={(e) => handleInputChange('packing_slip', e.target.value)}
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
        </div>        {/* Row 3 - Receipt Number only */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN NO</label>
            <input
              type="text"
              placeholder="----  ---------"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={filterParams.receipt_no || ''}
              onChange={(e) => handleInputChange('receipt_no', e.target.value)}
            />
          </div>
          
          {/* Empty divs to maintain layout */}
          <div className="flex w-1/3 items-center gap-2"></div>
          <div className="flex w-1/3 items-center gap-2"></div>
        </div>      {/* Action Buttons */}
      <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Export Button - Left Side */}
        <div className="flex justify-start">
          <button
            type="button"
            className="flex items-center gap-2 bg-green-700 text-sm text-white px-6 py-2 rounded border border-green-700 hover:bg-green-800 shadow-sm transition disabled:opacity-50"
            onClick={handleExcelExport}
            disabled={isLoading || isLoadingPartners || filteredData.length === 0}
          >
            <Download className="w-4 h-4 text-white" />
            Export Excel
          </button>
        </div>
        
        {/* Search and Clear Buttons - Right Side */}
        <div className="flex justify-end gap-4">
          {/* Search Button */}
          <button 
            type="submit"
            className="flex items-center gap-2 bg-purple-900 text-sm text-white px-6 py-2 rounded shadow-md hover:bg-purple-800 disabled:opacity-50 transition"
            disabled={isLoading || isLoadingPartners || !selectedSupplier}
          >
            <Search className="w-4 h-4" />
            {isLoading ? 'Searching...' : 'Search'}
          </button>

          {/* Clear Button */}
          <button
            type="button"
            className="flex items-center gap-2 bg-red-700 text-sm text-white px-6 py-2 rounded border border-red-700 hover:bg-red-800 shadow-sm transition"
            onClick={handleClear}
            disabled={isLoading || isLoadingPartners}
          >
            <XCircle className="w-4 h-4 text-white" />
            Clear
          </button>
        </div>
      </div>
      </form>      {/* Table Section */}
      <div className="bg-white p-6 space-y-6 rounded-lg shadow">        {/* Table */}
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
          <table className="w-full text-sm text-left">            <thead className="bg-gray-100 uppercase text-gray-700">              <tr>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">BP ID</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[250px]">BP Name</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">PO NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">DN NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[220px]">PO Reference</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Receipt Date</th>                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[280px]">Supplier REF No</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[180px]">Part No</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[200px]">Item Desc</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">ERP PART NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[80px]">Unit</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Item Type</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[80px]">Currency</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">Unit Price</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Request Qty</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Receipt Qty</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Approve Qty</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[180px]">Receipt Amount</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Final Receipt</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[100px]">Confirmed</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">Inv Supplier No</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">ERP INV NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Invoice Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">Invoice Qty</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[180px]">Invoice Amount</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[160px]">Invoice Due Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Payment Doc</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Payment Date</th>
              </tr>{/* Column Filter Row */}
              <tr>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.bpIdFilter} onChange={(e) => handleColumnFilterChange('bpIdFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.bpNameFilter} onChange={(e) => handleColumnFilterChange('bpNameFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.poNoFilter} onChange={(e) => handleColumnFilterChange('poNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.receiptNoFilter} onChange={(e) => handleColumnFilterChange('receiptNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.poReferenceFilter} onChange={(e) => handleColumnFilterChange('poReferenceFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.receiptDateFilter} onChange={(e) => handleColumnFilterChange('receiptDateFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.packingSlipFilter} onChange={(e) => handleColumnFilterChange('packingSlipFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.partNoFilter} onChange={(e) => handleColumnFilterChange('partNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.itemDescFilter} onChange={(e) => handleColumnFilterChange('itemDescFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.itemNoFilter} onChange={(e) => handleColumnFilterChange('itemNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.unitFilter} onChange={(e) => handleColumnFilterChange('unitFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.itemTypeFilter} onChange={(e) => handleColumnFilterChange('itemTypeFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.currencyFilter} onChange={(e) => handleColumnFilterChange('currencyFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.unitPriceFilter} onChange={(e) => handleColumnFilterChange('unitPriceFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.requestQtyFilter} onChange={(e) => handleColumnFilterChange('requestQtyFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.receiptQtyFilter} onChange={(e) => handleColumnFilterChange('receiptQtyFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.approveQtyFilter} onChange={(e) => handleColumnFilterChange('approveQtyFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.receiptAmountFilter} onChange={(e) => handleColumnFilterChange('receiptAmountFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.finalReceiptFilter} onChange={(e) => handleColumnFilterChange('finalReceiptFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.confirmedFilter} onChange={(e) => handleColumnFilterChange('confirmedFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invSupplierNoFilter} onChange={(e) => handleColumnFilterChange('invSupplierNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invDocNoFilter} onChange={(e) => handleColumnFilterChange('invDocNoFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invDocDateFilter} onChange={(e) => handleColumnFilterChange('invDocDateFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invQtyFilter} onChange={(e) => handleColumnFilterChange('invQtyFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invAmountFilter} onChange={(e) => handleColumnFilterChange('invAmountFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.invDueDateFilter} onChange={(e) => handleColumnFilterChange('invDueDateFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.paymentDocFilter} onChange={(e) => handleColumnFilterChange('paymentDocFilter', e.target.value)} /></td>
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.paymentDateFilter} onChange={(e) => handleColumnFilterChange('paymentDateFilter', e.target.value)} /></td>
              </tr>
            </thead>            <tbody>
              {isLoading ? (
                renderSkeletons()
              ) : paginatedData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">                    <td className="px-6 py-3 text-center border-b">{item.bp_id}</td>
                    <td className="px-6 py-3 text-center border-b">{item.bp_name}</td>
                    <td className="px-6 py-3 text-center border-b">{item.po_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.receipt_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.po_reference}</td>
                    <td className="px-6 py-3 text-center border-b">{item.actual_receipt_date ? new Date(item.actual_receipt_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.packing_slip}</td>
                    <td className="px-6 py-3 text-center border-b">{item.part_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_desc}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.unit}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_type_desc}</td>
                    <td className="px-6 py-3 text-center border-b">{item.currency}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiah(item.receipt_unit_price)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.request_qty?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-center border-b">{item.actual_receipt_qty?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-center border-b">{item.approve_qty?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiah(item.receipt_amount)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.is_final_receipt ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-center border-b">{item.is_confirmed ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_supplier_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_doc_no}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_doc_date ? new Date(item.inv_doc_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_qty?.toLocaleString('id-ID')}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiahInvoice(item.inv_amount)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_due_date ? new Date(item.inv_due_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.payment_doc}</td>
                    <td className="px-6 py-3 text-center border-b">{item.payment_doc_date ? new Date(item.payment_doc_date).toLocaleDateString() : ''}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={28} className="py-4 text-center text-gray-500 border-b">
                    No data available or supplier not selected.
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