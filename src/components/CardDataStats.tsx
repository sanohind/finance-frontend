import React, { ReactNode } from 'react';

interface CardDataStatsProps {
  title: ReactNode;
  total: ReactNode;
  rate: string;
  levelUp?: boolean;
  levelDown?: boolean;
  children: ReactNode;
}

const CardDataStats: React.FC<CardDataStatsProps> = ({
  title,
  total,
  rate,
  levelUp,
  levelDown,
  children,
}) => {
  return (
    <div className="rounded-lg border border-stroke bg-white p-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {title}
          </span>
          <h4 className="text-3xl font-bold text-black dark:text-white">
            {total}
          </h4>
        </div>

        <div className="text-right">
          <span
            className={`inline-flex items-center gap-1 text-sm font-semibold ${
              levelUp && 'text-meta-3'
            } ${levelDown && 'text-meta-5'} ${
              !levelUp && !levelDown && 'text-gray-600 dark:text-gray-400'
            }`}
          >
            {levelUp && (
              <svg
                className="fill-current"
                width="12"
                height="12"
                viewBox="0 0 10 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4.35716 2.47737L0.908974 5.82987L5.0443e-07 4.94612L5 0.0848689L10 4.94612L9.09103 5.82987L5.64284 2.47737L5.64284 10.0849L4.35716 10.0849L4.35716 2.47737Z"
                  fill=""
                />
              </svg>
            )}
            {levelDown && (
              <svg
                className="fill-current"
                width="12"
                height="12"
                viewBox="0 0 10 11"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M5.64284 7.69237L9.09102 4.33987L10 5.22362L5 10.0849L-8.98488e-07 5.22362L0.908973 4.33987L4.35716 7.69237L4.35716 0.0848701L5.64284 0.0848704L5.64284 7.69237Z"
                  fill=""
                />
              </svg>
            )}
            {rate}
          </span>
        </div>
      </div>
    </div>
  );
};

export default CardDataStats;