import { useState, useEffect } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import { Search, XCircle } from 'lucide-react';
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

// Table column filter interface
interface ColumnFilters {
  poNoFilter: string;
  grNoFilter: string; // Moved here
  bpIdFilter: string;
  bpNameFilter: string;
  currencyFilter: string;
  poTypeFilter: string;
  poReferenceFilter: string;
  poLineFilter: string;
  poSequenceFilter: string;
  receiptSequenceFilter: string;
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
  
  // Column filters state with empty initial values
  const [columnFilters, setColumnFilters] = useState<ColumnFilters>({
    poNoFilter: '',
    grNoFilter: '', // Moved here
    bpIdFilter: '',
    bpNameFilter: '',
    currencyFilter: '',
    poTypeFilter: '',
    poReferenceFilter: '',
    poLineFilter: '',
    poSequenceFilter: '',
    receiptSequenceFilter: '',
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

  // New state variables for Outstanding section
  const [overdueItems, setOverdueItems] = useState<GrSaRecord[]>([]);
  const [nonOverdueItems, setNonOverdueItems] = useState<GrSaRecord[]>([]);
  const [isLoadingOutstanding] = useState(false);

  // Format number to IDR currency format
  const formatToIDR = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 2
    }).format(value);
  };

  // Apply column filters to data
  const applyColumnFilters = (dataToFilter: GrSaRecord[]): GrSaRecord[] => {
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
    
    // Filter by PO Sequence
    if (columnFilters.poSequenceFilter) {
      filtered = filtered.filter(item => 
        item.po_sequence?.toLowerCase().includes(columnFilters.poSequenceFilter.toLowerCase())
      );
    }
    
    // Filter by Receipt Sequence
    if (columnFilters.receiptSequenceFilter) {
      filtered = filtered.filter(item => 
        item.po_receipt_sequence?.toLowerCase().includes(columnFilters.receiptSequenceFilter.toLowerCase())
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
    
    // Filter by Supplier No
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

  // Skeleton loader component for table rows
  const TableSkeleton = () => {
    return (
      <>
        {[...Array(5)].map((_, i) => (
          <tr key={`skeleton-${i}`} className="border-b animate-pulse">
            <td className="px-3 py-4 text-center">
              <div className="h-4 w-4 bg-gray-200 rounded mx-auto"></div>
            </td>
            {[...Array(41)].map((_, j) => (
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
      filtered = filtered.filter((item: GrSaRecord) => {
        return item.inv_supplier_no === null && item.inv_due_date === null;
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
    setGrDateFrom('');
    setGrDateTo('');
    const formInputs = document.querySelectorAll('input');
    formInputs.forEach((input) => {
      if (input.type === 'text' || input.type === 'date') {
        input.value = '';
      }
    });
    // Clear column filters too
    setColumnFilters({
      poNoFilter: '',
      grNoFilter: '', // Moved here
      bpIdFilter: '',
      bpNameFilter: '',
      currencyFilter: '',
      poTypeFilter: '',
      poReferenceFilter: '',
      poLineFilter: '',
      poSequenceFilter: '',
      receiptSequenceFilter: '',
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
            {/* Second row of filters */}
            <div className="flex space-x-4">
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
                    <th className="px-8 py-2 text-gray-700 text-center border">GR No</th> {/* Moved here */}
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
                  {/* Column filter inputs row */}
                  <tr className="bg-gray-50">
                    <td className="px-2 py-2 border">
                      {/* Skip checkbox column filter */}
                    </td>
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
                        value={columnFilters.receiptSequenceFilter}
                        onChange={(e) => handleColumnFilterChange('receiptSequenceFilter', e.target.value)}
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
                    <td className="px-2 py-2 border">
                      <input
                        type="text"
                        placeholder="-"
                        value={columnFilters.createdAtFilter}
                        onChange={(e) => handleColumnFilterChange('createdAtFilter', e.target.value)}
                        className="border rounded w-full px-2 py-1 text-xs text-center"
                      />
                    </td>
                    <td className="px-2 py-2 border">
                      <input
                        type="text"
                        placeholder="-"
                        value={columnFilters.updatedAtFilter}
                        onChange={(e) => handleColumnFilterChange('updatedAtFilter', e.target.value)}
                        className="border rounded w-full px-2 py-1 text-xs text-center"
                      />
                    </td>
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    <TableSkeleton />
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
                        <td className="px-3 py-2 text-center">{item.gr_no}</td> {/* Moved here */}
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