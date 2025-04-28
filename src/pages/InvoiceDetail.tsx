import { API_Inv_Line_By_Inv_No_Admin } from '../api/api';
import { useRouter } from "next/router";
import { useEffect, useState } from "react";

interface InvoiceLine {
  inv_line_id: string;
  gr_no: string;
  item_desc: string;
  receipt_amount: number;
  unit: string;
  po_no: string;
  part_no: string;
  // Add more fields as needed
}

const InvoiceDetail = () => {
  const router = useRouter();
  const { invoiceNumber } = router.query;
  const [lineItems, setLineItems] = useState<InvoiceLine[]>([]);
  const [lineLoading, setLineLoading] = useState(true);

  useEffect(() => {
    if (invoiceNumber) {
      const fetchLines = async () => {
        setLineLoading(true);
        try {
          const token = localStorage.getItem('access_token');
          const res = await fetch(
            API_Inv_Line_By_Inv_No_Admin() + invoiceNumber,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          if (res.ok) {
            const result = await res.json();
            let lines: InvoiceLine[] = [];
            if (Array.isArray(result.data)) {
              lines = result.data;
            } else if (result.data && typeof result.data === 'object') {
              lines = Object.values(result.data);
            }
            setLineItems(lines);
          } else {
            setLineItems([]);
          }
        } catch {
          setLineItems([]);
        } finally {
          setLineLoading(false);
        }
      };
      fetchLines();
    }
  }, [invoiceNumber]);

  return (
    <div className="max-w-4xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-bold text-gray-700 mb-4">Invoice Line Detail</h2>
      <div className="mt-8">
        {lineLoading ? (
          <div className="text-center text-gray-500">Loading line items...</div>
        ) : lineItems.length === 0 ? (
          <div className="text-center text-gray-500">No line items found.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 text-sm">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-3 py-2 border">GR No</th>
                  <th className="px-3 py-2 border">PO No</th>
                  <th className="px-3 py-2 border">Part No</th>
                  <th className="px-3 py-2 border">Item Description</th>
                  <th className="px-3 py-2 border">Receipt Amount</th>
                  <th className="px-3 py-2 border">Unit</th>
                </tr>
              </thead>
              <tbody>
                {lineItems.map((line) => (
                  <tr key={line.inv_line_id}>
                    <td className="px-3 py-2 border text-center">{line.gr_no}</td>
                    <td className="px-3 py-2 border text-center">{line.po_no}</td>
                    <td className="px-3 py-2 border text-center">{line.part_no}</td>
                    <td className="px-3 py-2 border">{line.item_desc}</td>
                    <td className="px-3 py-2 border text-right">{line.receipt_amount?.toLocaleString()}</td>
                    <td className="px-3 py-2 border text-center">{line.unit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
