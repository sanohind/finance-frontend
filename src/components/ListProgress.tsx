import React, { useState, useEffect } from "react";
import { CalendarDays, Search, RotateCcw } from "lucide-react";
import { toast } from 'react-toastify';
import Pagination from "./Table/Pagination";
import { API_Inv_Header_Admin } from '../api/api';

interface Invoice {
  inv_no: string;
  receipt_number: string | null;
  receipt_path: string | null;
  bp_code: string | null;
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
  // Additional fields used in ListProgress
  process_status?: "In Process" | "Rejected" | "Paid" | "Ready to Payment" | "New";
}

// Status options for dropdown
const STATUS_OPTIONS = [
  { value: "", label: "All" },
  { value: "new", label: "New" },
  { value: "in process", label: "In Process" },
  { value: "ready to payment", label: "Ready to Payment" },
  { value: "paid", label: "Paid" },
  { value: "rejected", label: "Rejected" }
];

const ListProgress: React.FC = () => {
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [data, setData] = useState<Invoice[]>([]);
  const [filteredData, setFilteredData] = useState<Invoice[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const rowsPerPage = 15;

  // Modal states for showing Rejected reason
  const [showReasonModal, setShowReasonModal] = useState(false);
  const [rejectedReason, setRejectedReason] = useState<string | null>(null);

  // Table column filters
  const [invoiceFilter, setInvoiceFilter] = useState<string>("");
  const [supplierFilter, setSupplierFilter] = useState<string>("");
  const [invoiceDateFilter, setInvoiceDateFilter] = useState<string>("");
  const [totalAmountFilter, setTotalAmountFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [planDateFilter, setPlanDateFilter] = useState<string>("");

  // Function to format numbers to Indonesian Rupiah
  const formatToRupiah = (value: number | null): string => {
    if (value === null) return "-";
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  // Fetch invoice header data
  const fetchInvoiceData = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem("access_token");
      const response = await fetch(API_Inv_Header_Admin(), {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch invoice data");
      }

      const result = await response.json();
      console.log("Raw Invoice Data Response:", result);

      if (result && typeof result === "object") {
        let invoiceList = [];

        if (Array.isArray(result.data)) {
          invoiceList = result.data;
        } else if (result.data && typeof result.data === "object") {
          invoiceList = Object.values(result.data);
        } else if (Array.isArray(result)) {
          invoiceList = result;
        }

        // Map status to process_status if needed
        const mappedInvoices = invoiceList.map((invoice: any) => ({
          ...invoice,
          process_status: invoice.process_status || invoice.status || "New",
          po_number: invoice.po_number || "N/A",
        }));

        if (mappedInvoices.length > 0) {
          setData(mappedInvoices);
          setFilteredData(mappedInvoices);
        } else {
          toast.warn("No invoice data found");
        }
      } else {
        throw new Error("Invalid response structure from API");
      }
    } catch (error) {
      console.error("Error fetching invoice data:", error);
      if (error instanceof Error) {
        toast.error(`Error fetching invoice data: ${error.message}`);
      } else {
        toast.error("Error fetching invoice data");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Show the Rejected reason in a simple modal
  const handleShowRejectedReason = (reason: string | null) => {
    if (!reason) return;
    setRejectedReason(reason);
    setShowReasonModal(true);
  };

  // Initial data fetch
  useEffect(() => {
    fetchInvoiceData();
  }, []);

  // Apply top filters
  const handleSearch = () => {
    let filtered = [...data];

    if (fromDate && toDate) {
      filtered = filtered.filter((item) => {
        const docDate = item.inv_date || "";
        return docDate >= fromDate && docDate <= toDate;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  // Reset all filters
  const handleReset = () => {
    setFromDate("");
    setToDate("");
    setInvoiceFilter("");
    setSupplierFilter("");
    setInvoiceDateFilter("");
    setTotalAmountFilter("");
    setStatusFilter("");
    setPlanDateFilter("");
    setFilteredData(data);
    setCurrentPage(1);
  };

  // Apply column filters
  useEffect(() => {
    let filtered = [...data];

    // Apply invoice number filter
    if (invoiceFilter) {
      filtered = filtered.filter(item => 
        item.inv_no?.toLowerCase().includes(invoiceFilter.toLowerCase())
      );
    }

    // Apply supplier filter
    if (supplierFilter) {
      filtered = filtered.filter(item => 
        item.bp_code?.toLowerCase().includes(supplierFilter.toLowerCase())
      );
    }

    // Apply invoice date filter
    if (invoiceDateFilter) {
      filtered = filtered.filter(item => 
        item.inv_date?.includes(invoiceDateFilter)
      );
    }

    // Apply total amount filter
    if (totalAmountFilter) {
      const filterAmount = parseFloat(totalAmountFilter);
      if (!isNaN(filterAmount)) {
        filtered = filtered.filter(item => {
          // Use approximate comparison for floating point numbers
          if (!item.total_amount) return false;
          
          // Check if the difference is very small (within 0.01 of the amount)
          // or if the values are approximately equal
          return Math.abs(item.total_amount - filterAmount) < 0.01 ||
            // Alternative approach: check if the amount starts with the filter value as a string
            item.total_amount.toString().includes(totalAmountFilter);
        });
      }
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(item => 
        (item.process_status || item.status || "").toLowerCase() === statusFilter.toLowerCase()
      );
    }

    // Apply payment plan date filter
    if (planDateFilter) {
      filtered = filtered.filter(item => 
        item.plan_date?.includes(planDateFilter)
      );
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  }, [invoiceFilter, supplierFilter, invoiceDateFilter, totalAmountFilter, statusFilter, planDateFilter, data]);

  const paginatedData = filteredData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  // Status color helper
  const getStatusColor = (status: string | null) => {
    if (!status) return "bg-blue-300";
    const s = status.toLowerCase();
    if (s === "ready to payment") return "bg-green-600";
    if (s === "rejected") return "bg-red-500";
    if (s === "paid") return "bg-blue-800";
    if (s === "in process") return "bg-yellow-300";
    return "bg-blue-400";
  };

  return (
    <div className="bg-white rounded-lg p-4 ">
      <h2 className="text-2xl font-semibold text-black mb-2 mt-0">List Progress</h2>

      {/* Filter & Search Section */}
      <div className="flex flex-wrap items-center justify-between mb-6 gap-4">
        <div className="flex items-end gap-4">
          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="peer border border-gray-300 rounded-md pl-10 pr-4 py-2 w-48 text-sm shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <CalendarDays className="w-5 h-5 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <div className="relative">
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="peer border border-gray-300 rounded-md pl-10 pr-4 py-2 w-48 text-sm shadow-sm focus:ring-2 focus:ring-purple-600 focus:outline-none"
              />
              <CalendarDays className="w-5 h-5 text-gray-500 absolute left-3 top-2.5 pointer-events-none" />
            </div>
          </div>

          {/* Search Button */}
          <button
            onClick={handleSearch}
            className="flex items-center gap-2 bg-purple-900 hover:bg-purple-800 transition-colors text-white text-sm px-5 py-2 rounded shadow-md"
          >
            <Search className="w-4 h-4" />
            Search
          </button>

          {/* Reset Button */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 bg-red-700 hover:bg-red-800 transition-colors text-white text-sm px-5 py-2 border border-red-500 rounded shadow-md"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto shadow-md rounded-lg border">
        <table className="min-w-full divide-y divide-gray-200 text-center">
          <thead className="bg-gray-100 uppercase">
            <tr>
              <th className="px-4 py-3 text-sm font-semibold text-gray-600 border min-w-[150px]">
                Invoice Number
              </th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 border min-w-[120px]">
                Supplier ID
              </th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 border min-w-[150px]">
                Invoice Date
              </th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 border min-w-[150px]">
                Total Amount
              </th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 border min-w-[150px]">
                Process Status
              </th>
              <th className="px-3 py-3 text-sm font-semibold text-gray-600 border min-w-[150px]">
                Payment Plan Date
              </th>
            </tr>
            {/* Filter inputs row */}
            <tr>
              <td className="px-2 py-2 border">
                <input
                  type="text"
                  placeholder="-"
                  value={invoiceFilter}
                  onChange={(e) => setInvoiceFilter(e.target.value)}
                  className="border rounded w-full px-2 py-1 text-sm text-center"
                />
              </td>
              <td className="px-2 py-2 border">
                <input
                  type="text"
                  placeholder="-"
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="border rounded w-full px-2 py-1 text-sm text-center"
                />
              </td>
              <td className="px-2 py-2 border">
                <input
                  type="date"
                  value={invoiceDateFilter}
                  onChange={(e) => setInvoiceDateFilter(e.target.value)}
                  className="border rounded w-full px-2 py-1 text-sm text-center"
                />
              </td>
              <td className="px-2 py-2 border">
                <div className="relative flex items-center">
                  <span className="absolute left-2 text-gray-500 text-sm">Rp.</span>
                  <input
                    type="number"
                    placeholder="-"
                    value={totalAmountFilter}
                    onChange={(e) => setTotalAmountFilter(e.target.value)}
                    className="border rounded w-full px-2 py-1 text-sm text-center pl-8"
                  />
                </div>
              </td>
              <td className="px-2 py-2 border">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="border rounded w-full px-2 py-1 text-sm text-center"
                >
                  {STATUS_OPTIONS.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-2 py-2 border">
                <input
                  type="date"
                  value={planDateFilter}
                  onChange={(e) => setPlanDateFilter(e.target.value)}
                  className="border rounded w-full px-2 py-1 text-sm text-center"
                />
              </td>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {isLoading ? (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : paginatedData.length > 0 ? (
              paginatedData.map((invoice) => {
                const status =
                  invoice.process_status || invoice.status || "New";
                return (
                  <tr key={invoice.inv_no} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.inv_no}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.bp_code || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.inv_date || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {formatToRupiah(invoice.total_amount)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-xl text-white text-xs font-medium ${getStatusColor(
                          status
                        )} ${
                          status.toLowerCase() === "rejected" ? "cursor-pointer" : ""
                        }`}
                        onClick={() => {
                          if (status.toLowerCase() === "rejected") {
                            handleShowRejectedReason(invoice.reason);
                          }
                        }}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-800">
                      {invoice.plan_date || "-"}
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                  No data available
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

      {/* Simple Popup for showing Rejected reason */}
      {showReasonModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-9999">
          <div className="bg-white p-4 rounded shadow-md text-center">
            <p className="mb-4">Reason: {rejectedReason || '-'}</p>
            <button
              className="bg-purple-900 text-white px-4 py-2 rounded hover:bg-purple-800"
              onClick={() => setShowReasonModal(false)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListProgress;