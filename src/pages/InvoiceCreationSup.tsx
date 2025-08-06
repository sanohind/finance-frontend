import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Search, XCircle } from 'lucide-react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Pagination from '../components/Table/Pagination';
import InvoiceCreationWizard from './InvoiceCreationWizard';
import { API_Inv_Line_Admin } from '../api/api';

interface FilterParams {
  bp_id?: string;
  packing_slip?: string;
  po_no?: string;
  receipt_no?: string;
  // Legacy filters for backward compatibility
  gr_no?: string;
  tax_number?: string;
  invoice_no?: string;
  status?: string;
  gr_date?: string;
  tax_date?: string;
  po_date?: string;
  invoice_date?: string;
  dn_number?: string;
  inv_due_date?: string;
}

export interface GrSaRecord {
  inv_line_id: string;
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
  category: string;
}

// Table column filter interface - Updated to match GrTrackingSup.tsx 28-column structure
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
  createdDateFilter: string;
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
  const [grDateFrom, setGrDateFrom] = useState<string>('');
  const [grDateTo, setGrDateTo] = useState<string>('');
    // Column filters state with empty initial values - Updated to match GrTrackingSup 28-column structure
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
    paymentDateFilter: '',
    createdDateFilter: ''
  });

  // New state variables for Outstanding section
  const [overdueItems, setOverdueItems] = useState<GrSaRecord[]>([]);
  const [nonOverdueItems, setNonOverdueItems] = useState<GrSaRecord[]>([]);
  const [isLoadingOutstanding] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  // Format number to IDR currency format
  const formatToIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Format invoice amount to IDR currency format (hide if empty)
  const formatRupiahInvoice = (amount: number | null | undefined): string => {
    if (amount === null || amount === undefined || isNaN(amount) || amount === 0) return '';
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return '';
      }
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (e) {
      return '';
    }
  };

  // Apply column filters to data - Updated to match GrTrackingSup 28-column structure
  const applyColumnFilters = (dataToFilter: GrSaRecord[]): GrSaRecord[] => {
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
    
    // Filter by Created Date
    if (columnFilters.createdDateFilter) {
      filtered = filtered.filter(item =>
        item.created_at?.includes(columnFilters.createdDateFilter)
      );
    }

    return filtered;
  };
  // Skeleton loader component for table rows
  const TableSkeleton = () => {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <tr key={`skeleton-${i}`} className="border-b animate-pulse">
            <td className="px-3 py-4 text-center">
              <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
            </td>
            {[...Array(29)].map((_, j) => (
              <td key={`cell-${i}-${j}`} className="px-3 py-4 text-center">
                <div className="h-4 bg-gray-200 rounded"></div>
              </td>
            ))}
          </tr>
        ))}
      </>
    );
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

      // Filter by GR Date range
      if (grDateFrom && grDateTo) {
        filtered = filtered.filter((item: any) => {
          if (!item.actual_receipt_date) return false;
          // Convert dates to YYYY-MM-DD format for proper comparison
          const grDate = new Date(item.actual_receipt_date).toISOString().split('T')[0];
          return grDate >= grDateFrom && grDate <= grDateTo;
        });
      }

      // Filter for null inv_supplier_no and inv_due_date
      // Filter for items where inv_supplier_no and inv_doc_no are empty
      filtered = filtered.filter(
        (item: GrSaRecord) => !item.inv_supplier_no && !item.inv_doc_no
      );

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
    setGrDateFrom('');
    setGrDateTo('');
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });    // Clear column filters too - Updated to match 28-column structure
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
      paymentDateFilter: '',
      createdDateFilter: ''
    });
    // Clear selected records and reset selectAll state
    setSelectedRecords([]);
    setSelectAll(false);
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
      setSelectedRecords([...filteredData]);
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

  const handleWizardClose = () => {
    setShowWizard(false);
  };

  const handleWizardFinish = () => {
    setIsProcessing(true);
    setShowWizard(false);
    
    // Simulate processing time for better UX
    setTimeout(() => {
      toast.success('Invoice process completed!');
      setSelectedRecords([]);
      setIsProcessing(false);
    }, 1000);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleInputChange = (field: keyof FilterParams, value: string) => {
    setFilterParams(prev => ({ ...prev, [field]: value }));
  };

  const handleDateFromChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateFrom(e.target.value);
  };

  const handleDateToChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setGrDateTo(e.target.value);
  };

  const handleColumnFilterChange = (field: keyof ColumnFilters, value: string) => {
    setColumnFilters(prev => ({ ...prev, [field]: value }));
  };

  const calculateTotalAmount = (records: GrSaRecord[] | undefined): number => {
    if (!records || records.length === 0) return 0;
    return records.reduce((sum, item) => sum + (Number(item.receipt_amount) || 0), 0);
  };

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  useEffect(() => {
    setFilteredData(applyColumnFilters(grSaList));
  }, [columnFilters, grSaList]);

  // Categorize data into overdue and non-overdue items based on receipt date
  const categorizeOutstandingItems = (data: GrSaRecord[]) => {
    const today = new Date();
    const overdue: GrSaRecord[] = [];
    const nonOverdue: GrSaRecord[] = [];

    data.forEach(item => {
      if (!item || !item.actual_receipt_date) return;
      
      // Calculate based on receipt date (10+ days = overdue)
      const receiptDate = new Date(item.actual_receipt_date);
      const diffTime = Math.abs(today.getTime() - receiptDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > 10) {
        overdue.push(item);
      } else {
        nonOverdue.push(item);
      }
    });

    return { overdue, nonOverdue };
  };

  // Update Outstanding section when filtered data changes
  useEffect(() => {
    if (filteredData.length > 0) {
      const { overdue, nonOverdue } = categorizeOutstandingItems(filteredData);
      setOverdueItems(overdue);
      setNonOverdueItems(nonOverdue);
    } else {
      setOverdueItems([]);
      setNonOverdueItems([]);
    }
  }, [filteredData]);

  return (
    <div className="space-y-6">
      <Breadcrumb pageName="Invoice Creation" />
      <ToastContainer />
      
      {/* Loading overlay when processing */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[10000]">
          <div className="bg-white rounded-lg p-8 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="text-lg font-medium text-gray-700">Processing invoice...</span>
            </div>
          </div>
        </div>
      )}
      
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
                <label className="w-2/6 text-sm font-medium text-gray-700">GR / SA Date</label>
                <div className="flex w-5/6 space-x-2 items-center">
                  <div className="relative w-2/4">
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
                  <div className="relative w-2/4">
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
              </div>              <div className="flex w-1/3 items-center gap-2">
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
            </div>            {/* Second row of filters */}
            <div className="flex space-x-4">              <div className="flex w-1/3 items-center gap-2">
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
            </div>
          </form>

          <div className="flex justify-end items-center gap-4">
            <button 
              type="button"
              onClick={handleSearch}
              className="flex items-center gap-2 bg-purple-900 text-sm text-white px-6 py-2 rounded shadow-md hover:bg-purple-800 disabled:opacity-50 transition"
            >
              <Search className="w-4 h-4" />
              Search
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="flex items-center gap-2 bg-red-700 text-sm text-white px-6 py-2 rounded border border-red-700 hover:bg-red-800 shadow-sm transition"
            >
              <XCircle className="w-4 h-4 text-white" />
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
                    <th className="px-4 py-3 text-md text-gray-800 text-center border">Category</th>
                    <th className="px-4 py-3 text-md text-gray-800 text-center border">Total Record(s)</th>
                    <th className="px-4 py-3 text-md text-gray-800 text-center border">Currency</th>
                    <th className="px-4 py-3 text-md text-gray-800 text-center border">Total Amount</th>
                    <th className="px-4 py-3 text-md text-gray-800 text-center border">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {/* Overdue items row (more than 10 days) */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-red-600 text-center">Overdue</td>
                    <td className="px-3 py-2 text-sm text-center">{isLoadingOutstanding ? 'Loading...' : overdueItems.length}</td>
                    <td className="px-3 py-2 text-sm text-center">
                      {isLoadingOutstanding ? 'Loading...' : (overdueItems[0]?.currency || 'IDR')}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      {isLoadingOutstanding ? 'Loading...' : formatToIDR(calculateTotalAmount(overdueItems))}
                    </td>
                    <td className="px-3 py-2 text-sm text-center text-red-600 font-medium">
                      {isLoadingOutstanding ? 'Loading...' : 'Danger, You Need To Invoicing This Item'}
                    </td>
                  </tr>
                  
                  {/* Non-overdue items row (less than 10 days) */}
                  <tr className="border-b hover:bg-gray-50">
                    <td className="px-3 py-2 text-sm font-medium text-green-600 text-center">Non-Overdue</td>
                    <td className="px-3 py-2 text-sm text-center">{isLoadingOutstanding ? 'Loading...' : nonOverdueItems.length}</td>
                    <td className="px-3 py-2 text-sm text-center">
                      {isLoadingOutstanding ? 'Loading...' : (nonOverdueItems[0]?.currency || 'IDR')}
                    </td>
                    <td className="px-3 py-2 text-sm text-center">
                      {isLoadingOutstanding ? 'Loading...' : formatToIDR(calculateTotalAmount(nonOverdueItems))}
                    </td>
                    <td className="px-3 py-2 text-sm text-center text-green-600 font-medium">
                      {isLoadingOutstanding ? 'Loading...' : 'Safe, You Need To Invoicing In Time'}
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
          <h3 className="text-xl font-semibold text-gray-700">GR / SA List</h3>          <div className="bg-white p-6 space-y-6 rounded-lg shadow">
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
              </div>
            </div>

            <div className="overflow-x-auto shadow-md border rounded-lg mb-6">
              <table className="w-full text-sm text-left"><thead className="bg-gray-100 uppercase text-gray-700">              <tr>
                <th className="px-3 py-2 text-center border-t border-b">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="cursor-pointer"
                  />
                </th>
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
                <th className="px-4 py-2 text-gray-700 text-center border-t border-b min-w-[130px]">Created Date</th>
              </tr>              {/* Column Filter Row */}
              <tr>
                <td className="px-2 py-2 border-b">
                  {/* Skip checkbox column filter */}
                </td>
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
                <td className="px-2 py-2 border-b"><input type="text" className="w-full text-xs p-1 border border-gray-300 rounded" value={columnFilters.createdDateFilter} onChange={(e) => handleColumnFilterChange('createdDateFilter', e.target.value)} /></td>
              </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
                  ) : paginatedData.length > 0 ? (
                    paginatedData.map((item, index) => (                      <tr key={index} className="border-b hover:bg-gray-50">                        <td className="px-6 py-3 text-center border-b">
                          <input
                            type="checkbox"
                            checked={selectedRecords.some(r => r.gr_no === item.gr_no)}
                            onChange={() => handleRecordSelection(item)}
                            className="cursor-pointer"
                          />
                        </td>
                        <td className="px-6 py-3 text-center border-b">{item.bp_id}</td>
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
                        <td className="px-6 py-3 text-center border-b">{formatToIDR(item.receipt_unit_price)}</td>
                        <td className="px-6 py-3 text-center border-b">{item.request_qty?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center border-b">{item.actual_receipt_qty?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center border-b">{item.approve_qty?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center border-b">{formatToIDR(item.receipt_amount)}</td>
                        <td className="px-6 py-3 text-center border-b">{item.is_final_receipt ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-3 text-center border-b">{item.is_confirmed ? 'Yes' : 'No'}</td>
                        <td className="px-6 py-3 text-center border-b">{item.inv_supplier_no}</td>
                        <td className="px-6 py-3 text-center border-b">{item.inv_doc_no}</td>
                        <td className="px-6 py-3 text-center border-b">{item.inv_doc_date ? new Date(item.inv_doc_date).toLocaleDateString() : ''}</td>                        <td className="px-6 py-3 text-center border-b">{item.inv_qty?.toLocaleString('id-ID')}</td>
                        <td className="px-6 py-3 text-center border-b">{formatRupiahInvoice(item.inv_amount)}</td>
                        <td className="px-6 py-3 text-center border-b">{item.inv_due_date ? new Date(item.inv_due_date).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-3 text-center border-b">{item.payment_doc}</td>
                        <td className="px-6 py-3 text-center border-b">{item.payment_doc_date ? new Date(item.payment_doc_date).toLocaleDateString() : ''}</td>
                        <td className="px-6 py-3 text-center border-b">{formatDate(item.created_at)}</td>
                      </tr>
                    ))                  ) : (                    <tr>
                      <td colSpan={30} className="py-4 text-center text-gray-500 border-b">
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