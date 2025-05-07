import { Search, XCircle } from "lucide-react";
import { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import { API_Inv_Line_Admin, API_List_Partner_Admin } from '../api/api';
import Select from "react-select";

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
  gr_date_from?: string;
  gr_date_to?: string;
  tax_date?: string;
  po_date?: string;
  invoice_date?: string;
  dn_number?: string;
  inv_due_date?: string;
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

// Table column filter interface
interface ColumnFilters {
  poNoFilter: string;
  grNoFilter: string;
  bpIdFilter: string;
  bpNameFilter: string;
  currencyFilter: string;
  poTypeFilter: string;
  poReferenceFilter: string;
  poLineFilter: string;
  receiptDateFilter: string;
  receiptYearFilter: string;
  receiptPeriodFilter: string;
  receiptNoFilter: string;
  receiptLineFilter: string;
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
  supplierNoFilter: string;
  invDocDateFilter: string;
  invQtyFilter: string;
  invAmountFilter: string;
  invNoFilter: string;
  invDueDateFilter: string;
  paymentDocFilter: string;
  paymentDateFilter: string;
}

const GrTrackingSup = () => {
  const [data, setData] = useState<GrTrackingSup[]>([]);
  const [filteredData, setFilteredData] = useState<GrTrackingSup[]>([]);
  const [businessPartners, setBusinessPartners] = useState<BusinessPartner[]>([]);
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [searchSupplier, setSearchSupplier] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [userRole, setUserRole] = useState<string>('');
  const [userBpCode, setUserBpCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [filterParams, setFilterParams] = useState<FilterParams>({});
  const [initialDataFetched, setInitialDataFetched] = useState(false);
  
  // Date range states
  const [grDateFrom, setGrDateFrom] = useState<string>('');
  const [grDateTo, setGrDateTo] = useState<string>('');
  
  // Column filters state with empty initial values
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    poNoFilter: '',
    grNoFilter: '',
    bpIdFilter: '',
    bpNameFilter: '',
    currencyFilter: '',
    poTypeFilter: '',
    poReferenceFilter: '',
    poLineFilter: '',
    receiptDateFilter: '',
    receiptYearFilter: '',
    receiptPeriodFilter: '',
    receiptNoFilter: '',
    receiptLineFilter: '',
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
    supplierNoFilter: '',
    invDocDateFilter: '',
    invQtyFilter: '',
    invAmountFilter: '',
    invNoFilter: '',
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
  }, [isSupplierFinance, userBpCode, initialDataFetched]);

  // Apply column filters whenever data or columnFilters change
  useEffect(() => {
    if (data.length === 0) {
      setFilteredData([]);
      return;
    }

    // Apply column filters
    const filtered = applyColumnFilters(data);
    
    // Also apply search filters
    let searchFiltered = filtered;
    
    if (searchSupplier) {
      searchFiltered = searchFiltered.filter(
        (row) =>
          row.bp_id.toLowerCase().includes(searchSupplier.toLowerCase()) ||
          row.bp_name.toLowerCase().includes(searchSupplier.toLowerCase())
      );
    }

    if (searchQuery) {
      searchFiltered = searchFiltered.filter((row) =>
        row.po_no.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    setFilteredData(searchFiltered);
    setCurrentPage(1); // Reset to first page when filtering
  }, [data, columnFilters, searchSupplier, searchQuery]);

  // Client-side filtering for supplier-finance users
  const filterDataClientSide = () => {
    if (data.length === 0) {
      return;
    }

    let filtered = [...data];
    
    // Apply filters based on filter params
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
    
    if (filterParams.po_no) {
      filtered = filtered.filter(row => 
        row.po_no?.toLowerCase().includes(filterParams.po_no!.toLowerCase())
      );
    }
    
    if (filterParams.invoice_no) {
      filtered = filtered.filter(row => 
        row.inv_supplier_no?.toLowerCase().includes(filterParams.invoice_no!.toLowerCase())
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
      );
    }
    
    if (filterParams.inv_due_date) {
      filtered = filtered.filter(row => 
        row.inv_due_date?.includes(filterParams.inv_due_date!)
      );
    }
    
    if (filterParams.dn_number) {
      filtered = filtered.filter(row => 
        row.receipt_no?.toLowerCase().includes(filterParams.dn_number!.toLowerCase())
      );
    }
    
    // Apply column filters
    filtered = applyColumnFilters(filtered);
    
    setFilteredData(filtered);
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Helper function to apply column filters - FIXED VERSION
  const applyColumnFilters = (dataToFilter: GrTrackingSup[]) => {
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
    
    // Filter by GR No
    if (columnFilters.grNoFilter) {
      filtered = filtered.filter(item => 
        item.gr_no?.toLowerCase().includes(columnFilters.grNoFilter.toLowerCase())
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
    
    // Filter by Supplier No
    if (columnFilters.supplierNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_doc_no?.toLowerCase().includes(columnFilters.supplierNoFilter.toLowerCase())
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
    
    // Filter by Invoice No
    if (columnFilters.invNoFilter) {
      filtered = filtered.filter(item => 
        item.inv_supplier_no?.toLowerCase().includes(columnFilters.invNoFilter.toLowerCase())
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

  const handleClear = () => {
    // Reset all filter-related state
    setGrDateFrom('');
    setGrDateTo('');
    setSearchSupplier('');
    setSearchQuery('');
    
    // Reset column filters
    setColumnFilters({
      poNoFilter: '',
      grNoFilter: '',
      bpIdFilter: '',
      bpNameFilter: '',
      currencyFilter: '',
      poTypeFilter: '',
      poReferenceFilter: '',
      poLineFilter: '',
      receiptDateFilter: '',
      receiptYearFilter: '',
      receiptPeriodFilter: '',
      receiptNoFilter: '',
      receiptLineFilter: '',
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
      supplierNoFilter: '',
      invDocDateFilter: '',
      invQtyFilter: '',
      invAmountFilter: '',
      invNoFilter: '',
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
      // For supplier-finance users, just apply client-side filtering if data is already fetched
      filterDataClientSide();
    } else {
      // Fetch data with current filter params - date range is already included in fetchInvLineData
      fetchInvLineData(filterParams);
    }
  };

  // Update filter params when inputs change
  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  // Update column filters
  const handleColumnFilterChange = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
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
            <label className="w-1/4 text-sm font-medium text-gray-700">GR / SA Number</label>
            <input
              type="text"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              placeholder="---------- ----"
              onChange={(e) => handleInputChange('gr_no', e.target.value)}
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
        
        {/* Row 3 - DN Number, Invoice Number, Invoice Due Date */}
        <div className='flex space-x-4'>
          <div className="flex w-1/3 items-center gap-2">
            <label className="w-1/4 text-sm font-medium text-gray-700">DN Number</label>
            <input
              type="text"
              placeholder="---------- ----"
              className="input w-3/4 border border-violet-200 p-2 rounded-md text-xs"
              onChange={(e) => handleInputChange('dn_number', e.target.value)}
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
            <label className="w-1/4 text-sm font-medium text-gray-700">Invoice Due Date</label>
            <div className="relative w-3/4">
              <input 
                type="date" 
                className="input w-full border border-violet-200 p-2 rounded-md text-xs" 
                onChange={(e) => handleInputChange('inv_due_date', e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="my-6 flex flex-col md:flex-row md:items-center md:justify-between">
        <div></div> {/* Empty div to keep buttons to the right */}
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
        </div>
      </form>

      <div className="bg-white p-6 space-y-6">
        <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 uppercase">
              <tr>
                <th className="px-8 py-2 text-gray-700 text-center border min-w-[120px]">PO No</th>
                <th className="px-8 py-2 text-gray-700 text-center border">GR No</th>
                <th className="px-8 py-2 text-gray-700 text-center border min-w-[120px]">BP ID</th>
                <th className="px-8 py-2 text-gray-700 text-center border min-w-[190px]">BP Name</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Currency</th>
                <th className="px-6 py-2 text-gray-700 text-center border">PO Type</th>
                <th className="px-8 py-2 text-gray-700 text-center border min-w-[190px]">PO Reference</th>
                <th className="px-4 py-2 text-gray-700 text-center border">PO Line</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Receipt Date</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Receipt Year</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Receipt Period</th>
                <th className="px-8 py-2 text-gray-700 text-center border">Receipt No</th>
                <th className="px-4 py-2 text-gray-700 text-center border">Receipt Line</th>
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
                <th className="px-8 py-2 text-gray-700 text-center border">Invoice Doc Date</th>
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
                    value={columnFilters.grNoFilter}
                    onChange={(e) => handleColumnFilterChange('grNoFilter', e.target.value)}
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
                    value={columnFilters.supplierNoFilter}
                    onChange={(e) => handleColumnFilterChange('supplierNoFilter', e.target.value)}
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
                    value={columnFilters.invNoFilter}
                    onChange={(e) => handleColumnFilterChange('invNoFilter', e.target.value)}
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
              ) : isAdmin && !selectedSupplier ? (
                <tr>
                  <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                    Please select a supplier and click search
                  </td>
                </tr>
              ) : filteredData.length > 0 ? (
                paginatedData.map((item, index) => (
                  <tr key={`${item.gr_no}-${item.po_line}-${index}`} className="border-b hover:bg-gray-50 text-sm">
                    <td className="px-3 py-2 text-center">{item.po_no}</td>
                    <td className="px-3 py-2 text-center">{item.gr_no}</td>
                    <td className="px-3 py-2 text-center">{item.bp_id}</td>
                    <td className="px-3 py-2 text-center">{item.bp_name}</td>
                    <td className="px-3 py-2 text-center">{item.currency}</td>
                    <td className="px-3 py-2 text-center">{item.po_type}</td>
                    <td className="px-3 py-2 text-center">{item.po_reference}</td>
                    <td className="px-3 py-2 text-center">{item.po_line}</td>
                    <td className="px-3 py-2 text-center">{item.actual_receipt_date}</td>
                    <td className="px-3 py-2 text-center">{item.actual_receipt_year}</td>
                    <td className="px-3 py-2 text-center">{item.actual_receipt_period}</td>
                    <td className="px-3 py-2 text-center">{item.receipt_no}</td>
                    <td className="px-3 py-2 text-center">{item.receipt_line}</td>
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
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={42} className="px-6 py-4 text-center text-gray-500">
                    Please Press The Search Button
                  </td>
                </tr>
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

export default GrTrackingSup;