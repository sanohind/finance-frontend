import Dashboard from "./component/Dashboard";
import GRTrackingSup from "./component/GRTrackingSup";
import InvoiceCreation from "./component/InvoiceCreation";
import InvoiceReportSup from "./component/InvoiceReportSup";

export const Supplier = () => {

    return (
        <div>
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2  dark:text-bodydark2">
                    SUPPLIER MENU
                </h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                    {/* <!-- Menu Item Dashboard --> */}            
                    <Dashboard />
                    {/* <!-- Menu Item Dashboard --> */}
                    <li>
                    <GRTrackingSup />
                    </li>
                    <li>
                    <InvoiceCreation />
                    </li>
                    <li>
                    <InvoiceReportSup />
                    </li>
                </ul>
            </div>
        </div>
    );
}