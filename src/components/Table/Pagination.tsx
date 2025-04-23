type PaginationProps = {
  totalRows: number;
  rowsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
};

const Pagination = ({ totalRows, rowsPerPage, currentPage, onPageChange }: PaginationProps) => {
  const totalPages = Math.ceil(totalRows / rowsPerPage);
  const maxPageNumbersToShow = 5;
  const pageNumbers = [];

  // Calculate the "showing" numbers
  const firstEntry = (currentPage - 1) * rowsPerPage + 1;
  const lastEntry = Math.min(currentPage * rowsPerPage, totalRows);

  // Rest of the pagination logic remains the same
  if (totalPages <= maxPageNumbersToShow) {
    for (let i = 1; i <= totalPages; i++) {
      pageNumbers.push(i);
    }
  } else {
    pageNumbers.push(1);
    const startPage = Math.max(2, currentPage - 1);
    const endPage = Math.min(totalPages - 1, currentPage + 1);

    if (startPage > 2) {
      pageNumbers.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i);
    }

    if (endPage < totalPages - 1) {
      pageNumbers.push('...');
    }

    pageNumbers.push(totalPages);
  }

  return (
    <div className="flex justify-between items-center mt-6">
      {/* Added showing results text */}
      <div className="text-sm text-gray-700">
        Showing <span className="font-bold">{firstEntry}</span> to <span className="font-bold">{lastEntry}</span> of <span className="font-bold">{totalRows}</span> results
      </div>

      <div className="flex gap-2 items-center pagination">
        <button
          className="px-3 py-3 text-purple bg-gray-200 rounded-md hover:bg-purple-100"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
        >
          <svg className="w-3 h-3 text-purple-900" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
            <path d="M8.766.566A2 2 0 0 0 6.586 1L1 6.586a2 2 0 0 0 0 2.828L6.586 15A2 2 0 0 0 10 13.586V2.414A2 2 0 0 0 8.766.566Z" />
          </svg>
        </button>

        {pageNumbers.map((number, index) => (
          <button
            key={index}
            className={`px-4 py-2 ${
              number === currentPage ? 'bg-purple-900 text-gray' : 'bg-gray-200 text-purple-900'
            } rounded-md hover:bg-purple-100 hover:text-purple ${
              number === '...' ? 'cursor-default' : ''
            }`}
            onClick={() => typeof number === 'number' && onPageChange(number)}
            disabled={number === '...'}
          >
            {number}
          </button>
        ))}

        <button
          className="px-3 py-3 text-white bg-gray-200 rounded-md hover:bg-purple-100"
          disabled={currentPage === totalPages}
          onClick={() => onPageChange(currentPage + 1)}
        >
          <svg className="w-3 h-3 text-purple-900" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 10 16">
            <path d="M1.234 15.434A2 2 0 0 0 3.414 15L9 9.414a2 2 0 0 0 0-2.828L3.414 1A2 2 0 0 0 1 2.414v11.172a2 2 0 0 0 1.234 1.848Z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default Pagination;
