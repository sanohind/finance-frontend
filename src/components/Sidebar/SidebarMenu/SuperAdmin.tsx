import Dashboard from './component/Dashboard';  // Ensure correct path
import ListUser from './component/ListUser';  // Ensure correct path
import AddUser from './component/AddUser';  // Ensure correct path

export const SuperAdmin = () => {
    console.log("Rendering SuperAdmin Menu");

    return (
        <div>
            <h3 className="mb-4 ml-4 text-sm font-semibold text-black-2 dark:text-bodydark2">
                SUPER ADMIN MENU
            </h3>
            <ul className="mb-6 flex flex-col gap-1.5">
                {/* Menu Items for SuperAdmin */}
                <li>
                    <Dashboard />
                </li>
                <li>
                    <ListUser />
                </li>
                <li>
                    <AddUser />
                </li>
            </ul>
        </div>
    );
};
