import React from 'react';
import ReactApexChart from 'react-apexcharts';
import { ApexOptions } from 'apexcharts';

interface BarChartProps {
  title: string;
  categories: string[];
  data: number[];
  subTitle: string;
  footer: string;
}

const BarChart: React.FC<BarChartProps> = ({ title, categories, data, subTitle, footer }) => {
  const options: ApexOptions = {
    chart: {
      fontFamily: 'Satoshi, sans-serif',
      type: 'bar',
      height: 335,
      toolbar: { show: false },
      zoom: { enabled: false },
      foreColor: '#6B7280',
    },
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: '50%',
        borderRadius: 6,
      },
    },
    dataLabels: { enabled: false },
    xaxis: {
      categories: categories,
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    yaxis: {
      labels: {
        style: {
          fontSize: '12px',
        },
      },
    },
    grid: {
      borderColor: '#E5E7EB',
      strokeDashArray: 5,
    },
    fill: {
      opacity: 1,
      colors: ['#3C50E0'],
    },
    colors: ['#3C50E0'],
    tooltip: {
      theme: 'light',
      x: {
        formatter: function (val) {
          return `${val}`;
        },
      },
      y: {
        formatter: function (val) {
          return `Value: ${val}`;
        },
        title: {
          formatter: () => '',
        },
      },
    },
  };

  return (
    <div className="bg-white rounded-lg p-6 w-full shadow-md">
      <div className="mb-4 flex">
        <div>
          <h1 className="text-xl font-semibold dark:text-white">{title}</h1>
        </div>
        <div className='ml-auto'>
          <h5>{subTitle}</h5>
        </div>
      </div>
      <ReactApexChart options={options} series={[{ data }]} type="bar" height={350} />
      <div>
        <div className="flex justify-center mt-4 space-x-2">
          <div className="flex items-center">
            <span className="text-sm ml-2">{footer}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BarChart;
