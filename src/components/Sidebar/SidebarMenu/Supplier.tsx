import Dashboard from './component/Dashboard';
import GRTrackingSup from './component/GRTrackingSup';
import InvoiceCreationSup from './component/InvoiceCreationSup';
import InvoiceReportSup from './component/InvoiceReportSup';

export const Supplier = () => {
  return (
    <div>
      <div>
        <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2  dark:text-bodydark2">
          SUPPLIER MENU
        </h3>
        <ul className="mb-6 flex flex-col gap-1.5">
          <Dashboard />
          <li>
            <GRTrackingSup />
          </li>
          <li>
            <InvoiceCreationSup />
          </li>
          <li>
            <InvoiceReportSup />
          </li>
        </ul>
      </div>
    </div>
  );
};
