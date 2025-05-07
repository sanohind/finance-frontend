import Dashboard from "./component/Dashboard";
import News from "./component/News";
import GRTracking from "./component/GRTracking";
import InvoiceCreation from "./component/InvoiceCreation";
import InvoiceReport from "./component/InvoiceReport";

export const AdminAccounting = () => {

    return (
        <div>
            <div>
                <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2  dark:text-bodydark2">
                    FINANCE MENU
                </h3>
                <ul className="mb-6 flex flex-col gap-1.5">
                    <li>
                    <Dashboard />
                    </li>
                    <li>
                    <News />
                    </li>
                    <li>
                    <GRTracking />
                    </li>
                    <li>
                    <InvoiceCreation />
                    </li>
                    <li>
                    <InvoiceReport />
                    </li>
                </ul>
            </div>
        </div>
    );
}