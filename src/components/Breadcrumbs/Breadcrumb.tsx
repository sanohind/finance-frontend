import { Link, useNavigate } from 'react-router-dom';
import { FaArrowLeft } from 'react-icons/fa';

interface BreadcrumbProps {
  pageName: string;
  isSubMenu?: boolean;
  parentMenu?: {
    name: string;
    link: string;
  };
}

const Breadcrumb = ({ pageName, isSubMenu = false, parentMenu }: BreadcrumbProps) => {
  const navigate = useNavigate();

  return (
    <div className="mb-6">  
        {/* Existing Breadcrumb */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full">
          <div className='flex items-center gap-4'>
            {/* Back Button - only show if isSubMenu is true */}
            {isSubMenu && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center p-2 text-black hover:text-blue-700 transition-colors"
                title="Go back"
              >
                <FaArrowLeft className="text-xl" />
              </button>
            )}
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-white"> {/* Changed to red-500 */}
              {pageName}
            </h2>
          </div>

          <nav>
            <ol className="flex items-center gap-2 text-sm sm:text-base">
              <li>
                <Link className="font-medium" to="/dashboard">
                  Dashboard /
                </Link>
              </li>
              {isSubMenu && parentMenu && (
              <li>
                <Link className="font-medium text-violet-600" to={parentMenu.link}>
                {parentMenu.name} /
                </Link>
              </li>
              )}
              <li className="font-medium text-violet-800 text-primary">{pageName}</li>
            </ol>
          </nav>
        </div>
    </div>
  );
};

export default Breadcrumb;