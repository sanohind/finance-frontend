import { useRouter } from "next/router";
import { useEffect, useState } from "react";

const InvoiceDetail = () => {
  const router = useRouter();
  const { invoiceNumber } = router.query;
  const [invoiceData, setInvoiceData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (invoiceNumber) {
      // Simulasi fetching data invoice berdasarkan invoiceNumber
      setTimeout(() => {
        setInvoiceData({
          inv_no: invoiceNumber,
          doc_date: "2025-02-24",
          bp_code: "SUP123",
          bp_name: "PT Supplier Jaya",
          currency: "USD",
          total_invoice_amount: 5000,
          amount_before_tax: 4500,
          invoice_status: "Pending",
          progress_status: "Verification",
          payment_plan_date: "2025-03-01",
          payment_actual_date: "-",
          tax_number: "TX123456",
          tax_amount: 500,
        });
        setLoading(false);
      }, 1000);
    }
  }, [invoiceNumber]);

  if (loading) {
    return <div className="text-center mt-10">Loading...</div>;
  }

  if (!invoiceData) {
    return <div className="text-center mt-10">Invoice not found</div>;
  }

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Invoice Detail</h2>
      <div className="grid grid-cols-2 gap-4 text-gray-600">
        <p><strong>Invoice Number:</strong> {invoiceData.inv_no}</p>
        <p><strong>Invoice Date:</strong> {invoiceData.doc_date}</p>
        <p><strong>Supplier Code:</strong> {invoiceData.bp_code}</p>
        <p><strong>Supplier Name:</strong> {invoiceData.bp_name}</p>
        <p><strong>Currency:</strong> {invoiceData.currency}</p>
        <p><strong>Total Invoice Amount:</strong> {invoiceData.total_invoice_amount.toLocaleString()}</p>
        <p><strong>Amount Before Tax:</strong> {invoiceData.amount_before_tax.toLocaleString()}</p>
        <p><strong>Invoice Status:</strong> {invoiceData.invoice_status}</p>
        <p><strong>Progress Status:</strong> {invoiceData.progress_status}</p>
        <p><strong>Payment Plan Date:</strong> {invoiceData.payment_plan_date}</p>
        <p><strong>Payment Actual Date:</strong> {invoiceData.payment_actual_date}</p>
        <p><strong>Tax Number:</strong> {invoiceData.tax_number}</p>
        <p><strong>Tax Amount:</strong> {invoiceData.tax_amount.toLocaleString()}</p>
      </div>
      <button
        className="mt-6 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-500"
        onClick={() => router.back()}
      >
        Back
      </button>
    </div>
  );
};

export default InvoiceDetail;
