
interface SearchMonthProps {
    selectedMonth: string;
    setSelectedMonth: (month: string) => void;
  }
  
  const SearchMonth = ({ selectedMonth, setSelectedMonth }: SearchMonthProps) => {
    return (
      <div className="items-center">
        <div className="flex items-center">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            onClick={handleClick}
            className="px-4 py-1 border rounded-md shadow-md"
          />
        </div>
      </div>
    );
  };
  const handleClick = (e: React.MouseEvent<HTMLInputElement>) => {
    e.currentTarget.showPicker();
  };
  
  export default SearchMonth;
  