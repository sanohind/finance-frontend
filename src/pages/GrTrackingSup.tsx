import { useEffect, useState } from 'react';
import { Search, XCircle, Download } from "lucide-react";
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Line_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";
import * as XLSX from 'xlsx';

interface BusinessPartner {
  bp_code: string;
  bp_name: string;
  adr_line_1: string;
}

interface FilterParams {
  bp_id?: string;
  packing_slip?: string;
  po_no?: string;
  receipt_no?: string;
  gr_date_from?: string;
  gr_date_to?: string;
  // Legacy filters for backward compatibility
  gr_no?: string;
  tax_number?: string;
  status?: string;
  tax_date?: string;
  po_date?: string;
  invoice_date?: string;
  dn_number?: string;
}

interface GrTrackingSup {
  po_no: string;
  gr_no: string;
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

// Table column filter interface - Updated to match GrTracking.tsx
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

const GrTrackingSup = () => {
  // --- Currency Formatter Function ---
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

  const [data, setData] = useState<GrTrackingSup[]>([]);
  const [filteredData, setFilteredData] = useState<GrTrackingSup[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string>('');
  const [userBpCode, setUserBpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  
  // Date range states
  const [grDateFrom, setGrDateFrom] = useState<string>('');
  const [grDateTo, setGrDateTo] = useState<string>('');
    // Column filters state with empty initial values - Updated to match GrTracking.tsx
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
  }, [isSupplierFinance, userBpCode, initialDataFetched]);  // Apply column filters whenever data or columnFilters change (only column filters, not form filters)
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }

    // Apply only column filters automatically (real-time)
    let filtered = applyColumnFilters(data);
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [data, columnFilters]);
  // Client-side filtering for supplier-finance users
  // Helper function to apply column filters - Updated to match new 28-column structure
  const applyColumnFilters = (dataToFilter: GrTrackingSup[]) => {
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
      // This is the corrected line
      filtered = filtered.filter(item => item.item_type_desc?.toLowerCase().includes(columnFilters.itemTypeFilter.toLowerCase()));
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
    
    // Filter by Inv Supplier No
    if (columnFilters.invSupplierNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_supplier_no?.toLowerCase().includes(columnFilters.invSupplierNoFilter.toLowerCase())
      );
    }
    
    // Filter by Invoice No (invoice doc no)
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

  // Fetch invoice line data with filter params
  const fetchInvLineData = async (params: FilterParams = {}) => {
    setIsLoading(true);
    
    // Merge existing filterParams with provided params
    const mergedParams = { ...filterParams, ...params };
    
    // Always ensure supplier filter is applied for supplier-finance users
    if (isSupplierFinance && userBpCode) {
      mergedParams.bp_id = userBpCode;
    }
    
    // Always include date range from state variables (not from filterParams)
    if (grDateFrom) mergedParams.gr_date_from = grDateFrom;
    if (grDateTo) mergedParams.gr_date_to = grDateTo;
    
    const token = localStorage.getItem('access_token');
    try {
      // Build query string from filter parameters
      const queryParams = Object.entries(mergedParams)
        .filter(([_, value]) => value !== undefined && value !== '')
        .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
        .join('&');

      // Add query string to URL if it exists
      const url = queryParams ? `${API_Inv_Line_Admin()}?${queryParams}` : API_Inv_Line_Admin();
      
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
          
          // Apply date range filtering client-side to ensure it works
          if (grDateFrom && grDateTo) {
            invLineList = invLineList.filter((item: { actual_receipt_date: string }) => {
              if (!item.actual_receipt_date) return false;
              // Convert dates to YYYY-MM-DD format for proper comparison
              const receiptDate = item.actual_receipt_date.split('T')[0];
              return receiptDate >= grDateFrom && receiptDate <= grDateTo;
            });
          }
          
          // Set the raw data first
          setData(invLineList);
          
          // The useEffect will apply column filters automatically when data changes
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

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    localStorage.setItem('dn_current_page', String(page));
  };

  // Handle Excel Export with XLSX - Auto flex column widths based on data content
  const handleExcelExport = () => {
    if (filteredData.length === 0) {
      toast.warn('No data available to export');
      return;
    }

    try {
      toast.info('Preparing Excel file, please wait...');

      // Define headers in the exact order shown in the table (reordered to match GrTracking)
      const headers = [
        'BP ID', 'BP Name', 'PO NO', 'DN NO', 'PO Reference',
        'Receipt Date', 'Supplier REF No', 'Part No', 'Item Desc', 'ERP PART NO',
        'Unit', 'Item Type', 'Currency', 'Unit Price', 'Request Qty', 'Receipt Qty', 'Approve Qty',
        'Receipt Amount', 'Final Receipt', 'Confirmed', 'Inv Supplier No', 'ERP INV NO',
        'Invoice Date', 'Invoice Qty', 'Invoice Amount', 'Invoice Due Date',
        'Payment Doc', 'Payment Date'
      ];      // Convert filtered data to rows format (matching new header order) - Using raw numeric values
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
      XLSX.utils.book_append_sheet(wb, ws, 'GR Tracking Supplier Report');

      // Generate filename with current date and supplier info
      const currentDate = new Date().toISOString().split('T')[0];
      const supplierCode = selectedSupplier || 'ALL';
      const filename = `GR_Tracking_Supplier_${supplierCode}_${currentDate}.xlsx`;

      // Write and download the file
      XLSX.writeFile(wb, filename);
      
      toast.success(`Exported ${filteredData.length} records to ${filename} with auto-fitted columns`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export data');
    }
  };

  const handleClear = () => {
    // Reset all filter-related state
    setGrDateFrom('');
    setGrDateTo('');
      // Reset column filters - Updated to match new structure
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
    
    // For non-supplier users, reset the supplier selection
    if (!isSupplierFinance) {
      setSelectedSupplier('');
      setFilterParams({});
    } else {
      // For supplier users, keep only the bp_id filter
      setFilterParams({ bp_id: userBpCode });
    }
    
    // Clear data for both user types - this is the key change
    setData([]);
    setFilteredData([]);
    setCurrentPage(1);
    
    // Reset form fields
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });
    
    toast.success('Filters cleared successfully');
  };

  // Update date range state handlers
  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateTo(e.target.value);
  };
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    // For admin users, require a supplier selection
    if (isAdmin && !selectedSupplier) {
      toast.error('Please select a supplier first');
      return;
    }
    
    if (isSupplierFinance && data.length > 0) {
      // For supplier-finance users, apply client-side filtering when they click Search
      applyFormFilters();
    } else {
      // Fetch data with current filter params - date range is already included in fetchInvLineData
      fetchInvLineData(filterParams);
    }
  };

  // Apply form filters function
  const applyFormFilters = () => {
    if (data.length === 0) {
      return;
    }

    // Start with column-filtered data
    let filtered = applyColumnFilters(data);
    
    // Apply form field filters
    if (filterParams.packing_slip) {
      filtered = filtered.filter(row => 
        row.packing_slip?.toLowerCase().includes(filterParams.packing_slip!.toLowerCase())
      );
    }
    
    if (filterParams.receipt_no) {
      filtered = filtered.filter(row => 
        row.receipt_no?.toLowerCase().includes(filterParams.receipt_no!.toLowerCase())
      );
    }
    
    if (filterParams.po_no) {
      filtered = filtered.filter(row => 
        row.po_no?.toLowerCase().includes(filterParams.po_no!.toLowerCase())
      );    }
    
    // Apply other form filters from filterDataClientSide function
    if (filterParams.gr_no) {
      filtered = filtered.filter(row => 
        row.gr_no?.toLowerCase().includes(filterParams.gr_no!.toLowerCase())
      );
    }
    
    if (filterParams.tax_number) {
      filtered = filtered.filter(row => 
        row.inv_doc_no?.toLowerCase().includes(filterParams.tax_number!.toLowerCase())
      );
    }
    
    if (filterParams.status) {
      filtered = filtered.filter(row => 
        row.is_confirmed !== undefined && String(row.is_confirmed).toLowerCase().includes(filterParams.status!.toLowerCase())
      );
    }
    
    // Filter for date range - directly use the state variables to ensure latest values
    if (grDateFrom && grDateTo) {
      filtered = filtered.filter(row => {
        if (!row.actual_receipt_date) return false;
        // Convert dates to YYYY-MM-DD format for proper comparison
        const receiptDate = row.actual_receipt_date.split('T')[0];
        return receiptDate >= grDateFrom && receiptDate <= grDateTo;
      });
    }
    
    if (filterParams.tax_date) {
      filtered = filtered.filter(row => 
        row.inv_doc_date?.includes(filterParams.tax_date!)
      );
    }
    
    if (filterParams.po_date) {
      filtered = filtered.filter(row => 
        row.created_at?.includes(filterParams.po_date!)
      );    }
    
    if (filterParams.dn_number) {
      filtered = filtered.filter(row => 
        row.receipt_no?.toLowerCase().includes(filterParams.dn_number!.toLowerCase())
      );
    }
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Update filter params when inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  // Update column filters
  const handleColumnFilterChange = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };  // Generate skeleton rows
  const renderSkeletons = () => {
    return Array(5).fill(0).map((_, index) => (
      <tr key={`skeleton-${index}`} className="animate-pulse border-b">
        {Array(28).fill(0).map((_, cellIndex) => (
          <td key={`cell-${index}-${cellIndex}`} className="px-6 py-3 text-center border-b">
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
        {/* Row 1 - Supplier Selection and GR Date Range */}
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
            <label className="w-1/6 text-sm font-medium text-gray-700">GR / SA Date</label>
            <div className="flex w-3/4 space-x-2 items-center">
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
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              value={isSupplierFinance 
                ? businessPartners[0]?.bp_name || '' 
                : businessPartners.find(p => p.bp_code === selectedSupplier)?.bp_name || ''}
              readOnly
            />
          </div>
            <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">Packing Slip</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="---------- ----"
              onChange={(e) => handleInputChange('packing_slip', e.target.value)}
            />
          </div>
          
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">PO Number</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('po_no', e.target.value)}
            />
          </div>
        </div>
          {/* Row 3 - Receipt Number only */}
        <div className='flex space-x-4'>          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN NO</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('receipt_no', e.target.value)}
            />
          </div>

          {/* Empty divs to maintain layout */}
          <div className="flex w-1/3 items-center gap-2"></div>
          <div className="flex w-1/3 items-center gap-2"></div>
        </div><div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between">
        {/* Export Button - Left Side */}
        <div className="flex justify-start">
          <button
            type="button"
            className="flex items-center gap-2 bg-green-700 text-sm text-white px-6 py-2 rounded border border-green-700 hover:bg-green-800 shadow-sm transition disabled:opacity-50"
            onClick={handleExcelExport}
            disabled={isLoading || filteredData.length === 0}
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
          >
            <Search className="w-4 h-4" />
            Search
          </button>

          {/* Clear Button */}
          <button
            type="button"
            className="flex items-center gap-2 bg-red-700 text-sm text-white px-6 py-2 rounded border border-red-700 hover:bg-red-800 shadow-sm transition"
            onClick={handleClear}
          >
            <XCircle className="w-4 h-4 text-white" />
            Clear
          </button>
          </div>
        </div>      </form>

      {/* Table Section */}
      <div className="bg-white p-6 space-y-6 rounded-lg shadow">
        {/* Table */}
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
          <table className="w-full text-sm text-left">            <thead className="bg-gray-100 uppercase text-gray-700">              <tr>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">BP ID</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[250px]">BP Name</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[150px]">PO NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[120px]">DN NO</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[220px]">PO Reference</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Receipt Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[280px]">Supplier REF No</th>
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
              </tr>              {/* Column Filter Row */}
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
            </thead>
            <tbody>
              {isLoading ? (
                renderSkeletons()              ) : isAdmin && !selectedSupplier ? (
                <tr>
                  <td colSpan={28} className="py-4 text-center text-gray-500 border-b">
                    Please select a supplier and click search
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (                paginatedData.map((item, index) => (
                  <tr key={`${item.gr_no}-${item.po_line}-${index}`} className="border-b hover:bg-gray-50 text-sm">
                    <td className="px-6 py-3 text-center border-b">{item.bp_id || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.bp_name || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.po_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.receipt_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.po_reference || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.actual_receipt_date ? new Date(item.actual_receipt_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.packing_slip || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.part_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_desc || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.unit || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.item_type_desc}</td>
                    <td className="px-6 py-3 text-center border-b">{item.currency || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiah(item.receipt_unit_price)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.request_qty?.toLocaleString('id-ID') || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.actual_receipt_qty?.toLocaleString('id-ID') || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.approve_qty?.toLocaleString('id-ID') || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiah(item.receipt_amount)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.is_final_receipt ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-center border-b">{item.is_confirmed ? 'Yes' : 'No'}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_supplier_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_doc_no || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_doc_date ? new Date(item.inv_doc_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_qty?.toLocaleString('id-ID') || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{formatRupiahInvoice(item.inv_amount)}</td>
                    <td className="px-6 py-3 text-center border-b">{item.inv_due_date ? new Date(item.inv_due_date).toLocaleDateString() : ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.payment_doc || ''}</td>
                    <td className="px-6 py-3 text-center border-b">{item.payment_doc_date ? new Date(item.payment_doc_date).toLocaleDateString() : ''}</td>
                  </tr>
                ))              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={28} className="py-4 text-center text-gray-500 border-b">
                    Please Press The Search Button
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={28} className="py-4 text-center text-gray-500 border-b">
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

export default GrTrackingSup;