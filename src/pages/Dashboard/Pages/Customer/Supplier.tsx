import React, { useEffect, useState } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import {
  API_Dashboard,
  API_Get_News,
  API_Stream_News_Admin,
  API_Stream_News_Carousel,
} from '../../../../api/api';
import CardDataStats from '../../../../components/CardDataStats';
import ListProgress from '../../../../components/ListProgress';
import {
  FaFileInvoice,
  FaHourglassHalf,
  FaTimesCircle,
  FaMoneyCheckAlt,
  FaMoneyBillWave,
  FaExpand,
} from 'react-icons/fa';
import { AiFillFilePdf } from 'react-icons/ai';

interface CarouselImage {
  path: string;
  url: string;
  filename: string;
}

interface NewsItem {
  id: string;
  title: string;
  carousel_images: CarouselImage[];
  start_date: string;
  end_date: string;
  document: string;
  created_by: string;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

const DashboardSupplier: React.FC = () => {
  // State for invoice stats
  const [newInvoice, setNewInvoice] = useState('0');
  const [inProcessInvoice, setInProcessInvoice] = useState('0');
  const [rejectedInvoice, setRejectedInvoice] = useState('0');
  const [readyToPaymentInvoice, setReadyToPaymentInvoice] = useState('0');
  const [paidInvoice, setPaidInvoice] = useState('0');

  // State for news and carousel
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState<number>(0);

  // Fetch supplier dashboard data
  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token');
      const response = await fetch(API_Dashboard(), {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.success) {
          const data = result.data;
          setNewInvoice(data.new_invoices?.toString() || '0');
          setInProcessInvoice(data.in_process_invoices?.toString() || '0');
          setRejectedInvoice(data.rejected_invoices?.toString() || '0');
          setReadyToPaymentInvoice(
            data.ready_to_payment_invoices?.toString() || '0',
          );
          setPaidInvoice(data.paid_invoices?.toString() || '0');
        } else {
          toast.error(`Error fetching dashboard data: ${result.message}`);
        }
      } else {
        toast.error(`Gagal mengambil data: ${response.status}`);
      }
    } catch (error) {
      if (error instanceof Error) {
        toast.error(`Error fetching dashboard data: ${error.message}`);
      } else {
        toast.error('Error fetching dashboard data');
      }
    }
  };

  // Fetch news for carousel and table
  const fetchNews = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_Get_News(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch news');
      const result = await response.json();

      let newsData: NewsItem[] = [];
      if (result.data && Array.isArray(result.data)) {
        newsData = result.data;
      } else if (Array.isArray(result)) {
        newsData = result;
      }

      newsData = newsData.map((item) => ({
        ...item,
        carousel_images: Array.isArray(item.carousel_images)
          ? item.carousel_images
          : [],
      }));

      setNews(newsData);
      setCurrentImageIndex(0);
    } catch (error) {
      console.error('Error fetching news:', error);
      toast.error('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  // Auto-play carousel every 5 seconds
  useEffect(() => {
    const allCarouselImages: CarouselImage[] = news.reduce(
      (acc: CarouselImage[], item) => {
        if (item.carousel_images && item.carousel_images.length > 0) {
          return [...acc, ...item.carousel_images];
        }
        return acc;
      },
      [],
    );

    if (allCarouselImages.length > 1) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % allCarouselImages.length);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [news]);

  useEffect(() => {
    fetchDashboardData();
    fetchNews();
  }, []);

  const handleStreamDocument = async (documentPath: string) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    const filename = documentPath.includes('/')
      ? documentPath.substring(documentPath.lastIndexOf('/') + 1)
      : documentPath;

    try {
      toast.info('Fetching document...', { autoClose: 2000 });
      const response = await fetch(`${API_Stream_News_Admin()}/${filename}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        let errorText = `Failed to stream document. Status: ${response.status}`;
        try {
          const errorData = await response.json();
          if (errorData && errorData.message) {
            errorText = errorData.message;
          }
        } catch (e) {
          // Ignore parsing errors
        }
        throw new Error(errorText);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const newWindow = window.open(url, '_blank');
      if (!newWindow) {
        toast.error(
          "Failed to open document. Please check your browser's pop-up settings.",
        );
        window.URL.revokeObjectURL(url);
      }
    } catch (error: any) {
      toast.error(
        error.message ||
          'An error occurred while trying to stream the document.',
      );
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const newsWithTitle = news
    .filter(
      (item) =>
        item.title &&
        item.title.trim() !== '' &&
        item.title.trim().toLowerCase() !== 'untitled news',
    )
    .sort((a, b) => {
      // Sort by created_at in descending order (newest first)
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return dateB - dateA;
    });

  const allCarouselImages: CarouselImage[] = news.reduce(
    (acc: CarouselImage[], item) => {
      if (item.carousel_images && item.carousel_images.length > 0) {
        return [...acc, ...item.carousel_images];
      }
      return acc;
    },
    [],
  );

  const currentImage = allCarouselImages[currentImageIndex];

  const nextImage = () => {
    if (allCarouselImages.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % allCarouselImages.length);
    }
  };

  const prevImage = () => {
    if (allCarouselImages.length > 0) {
      setCurrentImageIndex(
        (prev) =>
          (prev - 1 + allCarouselImages.length) % allCarouselImages.length,
      );
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">Dashboard Supplier</h1>
      </div>
      <ToastContainer position="top-right" />
      {/* Carousel and News Section - 50:50 Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Left Side: Carousel Images */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 p-4 h-full">
            <h2 className="text-xl font-semibold mb-4">
              News Images
              {allCarouselImages.length > 0 && (
                <span className="text-sm text-gray-500 ml-2">
                  ({allCarouselImages.length} images)
                </span>
              )}
            </h2>
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <p className="text-gray-500">Loading...</p>
              </div>
            ) : allCarouselImages.length > 0 ? (
              <div className="relative">
                <div className="relative w-full h-96 bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={currentImage.url}
                    alt={`Carousel ${currentImageIndex + 1}`}
                    className="w-full h-full object-contain"
                    onError={(e) => {
                      const filename =
                        currentImage.filename ||
                        (currentImage.path
                          ? currentImage.path.split('/').pop()
                          : '');
                      if (filename) {
                        const token = localStorage.getItem('access_token');
                        const imgElement = e.target as HTMLImageElement;
                        if (token) {
                          fetch(`${API_Stream_News_Carousel()}/${filename}`, {
                            headers: { Authorization: `Bearer ${token}` },
                          })
                            .then((res) => {
                              if (res.ok) return res.blob();
                              throw new Error('Failed to load image');
                            })
                            .then((blob) => {
                              const url = URL.createObjectURL(blob);
                              imgElement.src = url;
                            })
                            .catch((error) => {
                              console.error('Image load error:', error);
                              imgElement.alt = 'Image not available';
                            });
                        } else {
                          imgElement.src = `${API_Stream_News_Carousel()}/${filename}`;
                        }
                      }
                    }}
                  />
                </div>
                {allCarouselImages.length > 1 && (
                  <>
                    <button
                      onClick={prevImage}
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      aria-label="Previous image"
                    >
                      ‹
                    </button>
                    <button
                      onClick={nextImage}
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-75 transition"
                      aria-label="Next image"
                    >
                      ›
                    </button>
                    <div className="flex justify-center mt-4 space-x-2">
                      {allCarouselImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setCurrentImageIndex(index)}
                          className={`w-2 h-2 rounded-full ${
                            index === currentImageIndex
                              ? 'bg-purple-900'
                              : 'bg-gray-300'
                          }`}
                          aria-label={`Go to image ${index + 1}`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 bg-gray-100 rounded-lg">
                <p className="text-gray-500">No images available</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Side: News Table */}
        <div className="col-span-1">
          <div className="bg-white rounded-lg shadow-md border border-gray-300 overflow-hidden flex flex-col h-full">
            <h2 className="text-xl font-semibold p-4 border-b">News</h2>
            <div className="overflow-y-auto" style={{ maxHeight: '450px' }}>
              <table className="w-full text-sm text-left">
                <thead className="bg-white sticky top-0 z-10">
                  <tr>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border bg-white">
                      Title
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border bg-white">
                      Document
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border bg-white">
                      Create Date
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : newsWithTitle.length > 0 ? (
                    newsWithTitle.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.title || '-'}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.document ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleStreamDocument(item.document);
                              }}
                              className="text-red-500 hover:text-red-700 flex items-center justify-center w-full h-full bg-transparent border-none cursor-pointer p-0"
                              title={`View ${item.document}`}
                            >
                              <AiFillFilePdf className="h-5 w-5" />
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {formatDate(item.created_at)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No news available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Overview Cards - Moved to Bottom */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <CardDataStats
          title={
            <span className="text-sm font-font-medium text-blue-400">
              New Invoice
            </span>
          }
          total={
            <span className="text-2xl font-semibold text-blue-400">
              {newInvoice}
            </span>
          }
          rate=""
          levelUp={Number(newInvoice) > 0}
          levelDown={Number(newInvoice) <= 0}
        >
          <FaFileInvoice className="fill-blue-400 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={
            <span className="text-sm font-font-medium text-yellow-300">
              In Process Invoice
            </span>
          }
          total={
            <span className="text-2xl font-semibold text-yellow-300">
              {inProcessInvoice}
            </span>
          }
          rate=""
          levelUp={Number(inProcessInvoice) > 0}
          levelDown={Number(inProcessInvoice) <= 0}
        >
          <FaHourglassHalf
            className="fill-yellow-300 dark:fill-white"
            size={24}
          />
        </CardDataStats>

        <CardDataStats
          title={
            <span className="text-sm font-font-medium text-red-500">
              Reject Invoice
            </span>
          }
          total={
            <span className="text-2xl font-semibold text-red-500">
              {rejectedInvoice}
            </span>
          }
          rate=""
          levelUp={Number(rejectedInvoice) > 0}
          levelDown={Number(rejectedInvoice) <= 0}
        >
          <FaTimesCircle className="fill-red-500 dark:fill-white" size={24} />
        </CardDataStats>

        <CardDataStats
          title={
            <span className="text-sm font-font-medium text-green-500">
              Ready to Payment
            </span>
          }
          total={
            <span className="text-2xl font-semibold text-green-500">
              {readyToPaymentInvoice}
            </span>
          }
          rate=""
          levelUp={Number(readyToPaymentInvoice) > 0}
          levelDown={Number(readyToPaymentInvoice) <= 0}
        >
          <FaMoneyCheckAlt
            className="fill-green-500 dark:fill-white"
            size={24}
          />
        </CardDataStats>

        <CardDataStats
          title={
            <span className="text-sm font-medium text-blue-800">
              Paid Invoice
            </span>
          }
          total={
            <span className="text-2xl font-semibold text-blue-800">
              {paidInvoice}
            </span>
          }
          rate=""
          levelUp={Number(paidInvoice) > 0}
          levelDown={Number(paidInvoice) <= 0}
        >
          <FaMoneyBillWave
            className="fill-blue-800 dark:fill-white"
            size={24}
          />
        </CardDataStats>
      </div>

      {/* List Progress untuk Invoice */}
      <div className="bg-white p-4 md:p-2 rounded-lg shadow">
        <ListProgress />
      </div>
    </div>
  );
};

export default DashboardSupplier;
