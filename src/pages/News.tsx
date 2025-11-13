import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Button from '../components/Forms/Button';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import {
  API_Get_News,
  API_Create_News_Admin,
  API_Get_News_Edit_Admin,
  API_Update_News_Admin,
  API_Delete_News_Admin,
  API_Stream_News_Admin,
  API_Stream_News_Carousel,
  API_Upload_Carousel_Image,
  API_Update_Carousel_Image,
  API_Delete_Carousel_Image,
} from '../api/api';
import { AiFillFilePdf } from 'react-icons/ai';
import {
  FaImage,
  FaTrash as FaTrashIcon,
  FaEdit as FaEditIcon,
} from 'react-icons/fa';

interface CarouselImage {
  path: string;
  url: string;
  filename: string;
}

interface NewsItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  document: string;
  carousel_images?: CarouselImage[];
  created_by: string;
  updated_by: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showAddCarouselModal, setShowAddCarouselModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: '',
  });
  const [file, setFile] = useState<File | null>(null);
  const [carouselFiles, setCarouselFiles] = useState<File[]>([]);
  const [carouselForm, setCarouselForm] = useState({
    start_date: '',
    end_date: '',
  });

  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: '',
  });
  const [initialEditForm, setInitialEditForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: '',
  });
  const [editFile, setEditFile] = useState<File | null>(null);
  const [editCarouselImages, setEditCarouselImages] = useState<CarouselImage[]>(
    [],
  );
  const [newCarouselFiles, setNewCarouselFiles] = useState<File[]>([]);
  const [showCarouselModal, setShowCarouselModal] = useState(false);
  const [showEditCarouselModal, setShowEditCarouselModal] = useState(false);
  const [editingImageIndex, setEditingImageIndex] = useState<number | null>(
    null,
  );
  const [replacementImageFile, setReplacementImageFile] = useState<File | null>(
    null,
  );
  const [showImageViewModal, setShowImageViewModal] = useState(false);
  const [viewingImages, setViewingImages] = useState<CarouselImage[]>([]);
  const [viewingImageIndex, setViewingImageIndex] = useState<number>(0);
  const [showFullImageModal, setShowFullImageModal] = useState(false);
  const [fullImageUrl, setFullImageUrl] = useState<string>('');
  const [fullImageFilename, setFullImageFilename] = useState<string>('');
  const [imageBlobUrls, setImageBlobUrls] = useState<Map<string, string>>(
    new Map(),
  );
  const [editImageBlobUrls, setEditImageBlobUrls] = useState<
    Map<string, string>
  >(new Map());

  useEffect(() => {
    fetchNews();
  }, []);

  // Auto-swipe for viewing images modal
  useEffect(() => {
    if (showImageViewModal && viewingImages.length > 1) {
      const interval = setInterval(() => {
        setViewingImageIndex((prev) => (prev + 1) % viewingImages.length);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [showImageViewModal, viewingImages.length]);

  // Load images as blob URLs when viewing modal opens
  useEffect(() => {
    if (!showImageViewModal || viewingImages.length === 0) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const loadImages = async () => {
      const newBlobUrls = new Map<string, string>();
      const loadPromises = viewingImages.map(async (image) => {
        const filename =
          image.filename || (image.path ? image.path.split('/').pop() : '');
        if (filename) {
          try {
            const response = await fetch(
              `${API_Stream_News_Carousel()}/${filename}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              newBlobUrls.set(filename, url);
            }
          } catch (error) {
            console.error('Failed to load image:', filename);
          }
        }
      });
      await Promise.all(loadPromises);
      setImageBlobUrls((prev) => {
        const merged = new Map(prev);
        newBlobUrls.forEach((url, key) => merged.set(key, url));
        return merged;
      });
    };
    loadImages();

    // Cleanup blob URLs when modal closes
    return () => {
      if (!showImageViewModal) {
        setImageBlobUrls((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return new Map();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showImageViewModal, viewingImages.length]);

  // Load images as blob URLs when edit carousel modal opens
  useEffect(() => {
    if (!showEditCarouselModal || editCarouselImages.length === 0) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) return;

    const loadImages = async () => {
      const newBlobUrls = new Map<string, string>();
      const loadPromises = editCarouselImages.map(async (image) => {
        const filename =
          image.filename || (image.path ? image.path.split('/').pop() : '');
        if (filename) {
          try {
            const response = await fetch(
              `${API_Stream_News_Carousel()}/${filename}`,
              {
                headers: { Authorization: `Bearer ${token}` },
              },
            );
            if (response.ok) {
              const blob = await response.blob();
              const url = URL.createObjectURL(blob);
              newBlobUrls.set(filename, url);
            }
          } catch (error) {
            console.error('Failed to load image:', filename);
          }
        }
      });
      await Promise.all(loadPromises);
      setEditImageBlobUrls((prev) => {
        const merged = new Map(prev);
        newBlobUrls.forEach((url, key) => merged.set(key, url));
        return merged;
      });
    };
    loadImages();

    // Cleanup blob URLs when modal closes
    return () => {
      if (!showEditCarouselModal) {
        setEditImageBlobUrls((prev) => {
          prev.forEach((url) => URL.revokeObjectURL(url));
          return new Map();
        });
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showEditCarouselModal, editCarouselImages.length]);

  const fetchNews = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_Get_News(), {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch news');
      const result = await response.json();
      setNews(result.data || []);
    } catch (error) {
      toast.error('Failed to fetch news');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setForm({ ...form, document: e.target.files[0].name });
    }
  };

  const handleCarouselFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setCarouselFiles(files);
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    // All fields are required: title, start_date, end_date, document
    if (!form.title || !form.title.trim()) {
      toast.error('Title is required');
      return;
    }
    if (!form.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!form.end_date) {
      toast.error('End date is required');
      return;
    }
    if (!file) {
      toast.error('Document is required');
      return;
    }

    // Validate dates
    const startDate = new Date(form.start_date);
    const endDate = new Date(form.end_date);
    if (endDate < startDate) {
      toast.error('End date must be greater than or equal to start date');
      return;
    }

    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('title', form.title);
    if (form.description) formData.append('description', form.description);
    formData.append('start_date', form.start_date);
    formData.append('end_date', form.end_date);
    formData.append('document', file);

    try {
      const response = await fetch(API_Create_News_Admin(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to add news');
      }
      toast.success('News added successfully!', { autoClose: 2000 });
      setShowAddModal(false);
      setForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        document: '',
      });
      setFile(null);
      // Reset file input
      const fileInput = document.querySelector(
        'input[name="document"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add news');
    }
  };

  const handleAddCarouselNews = async (e: React.FormEvent) => {
    e.preventDefault();
    // All fields are required
    if (carouselFiles.length === 0) {
      toast.error('Carousel images are required');
      return;
    }
    if (!carouselForm.start_date) {
      toast.error('Start date is required');
      return;
    }
    if (!carouselForm.end_date) {
      toast.error('End date is required');
      return;
    }

    // Validate dates
    const startDate = new Date(carouselForm.start_date);
    const endDate = new Date(carouselForm.end_date);
    if (endDate < startDate) {
      toast.error('End date must be greater than or equal to start date');
      return;
    }

    const token = localStorage.getItem('access_token');
    const formData = new FormData();

    // Append carousel images
    carouselFiles.forEach((file) => {
      formData.append('carousel_images[]', file);
    });

    formData.append('start_date', carouselForm.start_date);
    formData.append('end_date', carouselForm.end_date);

    try {
      const response = await fetch(API_Create_News_Admin(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Failed to add carousel news (status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (response.status === 422 && errorData && errorData.errors) {
            // Format validation errors
            const validationMessages = Object.entries(errorData.errors)
              .map(([field, messages]: [string, any]) => {
                const msgArray = Array.isArray(messages)
                  ? messages
                  : [messages];
                return `${field}: ${msgArray.join(', ')}`;
              })
              .join('; ');
            errorMessage = `Validation failed: ${validationMessages}`;
          } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (parseError) {
          // If JSON parsing fails, try to get text
          try {
            const textError = await response.text();
            if (textError) errorMessage = textError;
          } catch (textEx) {
            // Ignore
          }
        }
        throw new Error(errorMessage);
      }

      const result = await response.json();
      toast.success('Carousel news added successfully!', { autoClose: 2000 });
      setShowAddCarouselModal(false);
      setCarouselFiles([]);
      setCarouselForm({
        start_date: '',
        end_date: '',
      });
      // Reset file input
      const fileInput = document.querySelector(
        'input[name="carousel_images_only"]',
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to add carousel news');
      console.error('Error adding carousel news:', error);
    }
  };

  const handleCarouselFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCarouselForm({ ...carouselForm, [e.target.name]: e.target.value });
  };

  const openEditModal = async (index: number) => {
    setEditIndex(index);
    const item = news[index];
    setEditFile(null);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_Get_News_Edit_Admin()}/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to fetch news for edit');
      const result = await response.json();
      const fetchedData = {
        title: result.data.title || '',
        description: result.data.description || '',
        start_date: result.data.start_date || '',
        end_date: result.data.end_date || '',
        document: result.data.document || '',
      };
      setEditForm(fetchedData);
      setInitialEditForm(fetchedData);
      setEditCarouselImages(result.data.carousel_images || []);
      setNewCarouselFiles([]);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Failed to fetch news for edit');
    }
  };

  const handleEditInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditFile(e.target.files[0]);
      setEditForm({ ...editForm, document: e.target.files[0].name });
    }
  };

  const handleNewCarouselFilesChange = (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setNewCarouselFiles((prev) => [...prev, ...files]);
    }
  };

  const handleEditNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editIndex === null) return;

    if (
      !editForm.title ||
      !editForm.description ||
      !editForm.start_date ||
      !editForm.end_date
    ) {
      toast.error('Please fill all fields');
      return;
    }

    const token = localStorage.getItem('access_token');
    const item = news[editIndex];
    const formData = new FormData();
    let hasChanges = false;

    if (editForm.title !== initialEditForm.title) {
      formData.append('title', editForm.title);
      hasChanges = true;
    }
    if (editForm.description !== initialEditForm.description) {
      formData.append('description', editForm.description);
      hasChanges = true;
    }
    if (editForm.start_date !== initialEditForm.start_date) {
      formData.append('start_date', editForm.start_date);
      hasChanges = true;
    }
    if (editForm.end_date !== initialEditForm.end_date) {
      formData.append('end_date', editForm.end_date);
      hasChanges = true;
    }

    if (editFile) {
      formData.append('document', editFile);
      hasChanges = true;
    }

    // Append new carousel images
    if (newCarouselFiles.length > 0) {
      newCarouselFiles.forEach((file) => {
        formData.append('carousel_images[]', file);
      });
      hasChanges = true;
    }

    if (!hasChanges) {
      toast.info('No changes to save.');
      setShowEditModal(false);
      return;
    }

    formData.append('_method', 'PUT');

    try {
      const response = await fetch(`${API_Update_News_Admin()}/${item.id}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) {
        let errorMessage = `Failed to update news (status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (response.status === 422 && errorData && errorData.errors) {
            const validationMessages = Object.values(errorData.errors)
              .flat()
              .join('; ');
            errorMessage = `Validation failed: ${validationMessages}`;
          } else if (errorData && errorData.message) {
            errorMessage = errorData.message;
          }
        } catch (e) {
          // If response.json() fails or errorData structure is unexpected,
          // errorMessage remains as initialized or could be set to a more generic parsing error.
        }
        throw new Error(errorMessage);
      }

      toast.success('News updated successfully!', { autoClose: 2000 });
      setShowEditModal(false);
      setEditIndex(null);
      setEditForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        document: '',
      });
      setInitialEditForm({
        title: '',
        description: '',
        start_date: '',
        end_date: '',
        document: '',
      });
      setEditFile(null);
      setEditCarouselImages([]);
      setNewCarouselFiles([]);
      fetchNews();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update news');
    }
  };

  const handleDelete = async (id: string) => {
    toast.info('Deleting news...', { autoClose: 1500 });
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_Delete_News_Admin()}/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error('Failed to delete news');
      toast.success('News deleted successfully!', { autoClose: 2000 });
      fetchNews();
    } catch (error) {
      toast.error('Failed to delete news');
    }
  };

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
          } else {
            const textError = await response.text();
            if (textError) errorText = textError;
          }
        } catch (e) {
          try {
            const textError = await response.text();
            if (textError) errorText = textError;
          } catch (textEx) {}
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

  // Carousel Image Management Functions
  const handleUploadCarouselImage = async (newsId: string, imageFile: File) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);

    try {
      const response = await fetch(
        `${API_Upload_Carousel_Image()}/${newsId}/carousel/upload`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to upload carousel image');
      }

      toast.success('Carousel image uploaded successfully!');
      fetchNews();
      // Refresh edit carousel modal data
      if (editIndex !== null && showEditCarouselModal) {
        const item = news[editIndex];
        const editResponse = await fetch(
          `${API_Get_News_Edit_Admin()}/${item.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (editResponse.ok) {
          const editResult = await editResponse.json();
          setEditCarouselImages(editResult.data.carousel_images || []);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to upload carousel image');
    }
  };

  const handleUpdateCarouselImage = async (
    newsId: string,
    imageIndex: number,
    imageFile: File,
  ) => {
    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('_method', 'PUT');

    try {
      const response = await fetch(
        `${API_Update_Carousel_Image()}/${newsId}/carousel/${imageIndex}`,
        {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to update carousel image');
      }

      toast.success('Carousel image updated successfully!');
      setEditingImageIndex(null);
      setReplacementImageFile(null);
      fetchNews();
      // Refresh edit carousel modal data
      if (editIndex !== null && showEditCarouselModal) {
        const item = news[editIndex];
        const editResponse = await fetch(
          `${API_Get_News_Edit_Admin()}/${item.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (editResponse.ok) {
          const editResult = await editResponse.json();
          setEditCarouselImages(editResult.data.carousel_images || []);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update carousel image');
    }
  };

  const handleDeleteCarouselImage = async (
    newsId: string,
    imageIndex: number,
  ) => {
    if (
      !window.confirm('Are you sure you want to delete this carousel image?')
    ) {
      return;
    }

    const token = localStorage.getItem('access_token');
    if (!token) {
      toast.error('Authentication token not found.');
      return;
    }

    try {
      const response = await fetch(
        `${API_Delete_Carousel_Image()}/${newsId}/carousel/${imageIndex}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to delete carousel image');
      }

      toast.success('Carousel image deleted successfully!');
      fetchNews();
      // Refresh edit carousel modal data
      if (editIndex !== null && showEditCarouselModal) {
        const item = news[editIndex];
        const editResponse = await fetch(
          `${API_Get_News_Edit_Admin()}/${item.id}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          },
        );
        if (editResponse.ok) {
          const editResult = await editResponse.json();
          setEditCarouselImages(editResult.data.carousel_images || []);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete carousel image');
    }
  };

  return (
    <>
      <ToastContainer position="top-right" />
      <Breadcrumb pageName="News Manage" />
      <div className="bg-white">
        <div className="p-2 md:p-4 lg:p-6 space-y-6">
          <div className="flex flex-col space-y-6 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
            <div className="flex flex-col space-y-1 sm:flex-row gap-4 w-full lg:w-1/2">
              <Button
                title="Add News"
                onClick={() => setShowAddModal(true)}
                icon={FaPlus}
                className="transition-colors whitespace-nowrap flex items-center justify-center"
              />
              <Button
                title="Add Carousel Images"
                onClick={() => setShowAddCarouselModal(true)}
                icon={FaImage}
                className="transition-colors whitespace-nowrap flex items-center justify-center bg-green-600 hover:bg-green-700"
              />
            </div>
          </div>
          {/* Modal for Add News */}
          {showAddModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add News</h2>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      name="title"
                      value={form.title}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Description{' '}
                      <span className="text-gray-400 text-xs">(optional)</span>
                    </label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={form.start_date}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={form.end_date}
                        onChange={handleInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Document <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                      required
                    />
                    {form.document && (
                      <span className="text-xs text-gray-500">
                        {form.document}
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Allowed: pdf, doc, docx, jpg, jpeg, png (max 5000 KB)
                    </p>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-900 text-white rounded hover:bg-purple-800"
                    >
                      Add
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal for Add Carousel Images Only */}
          {showAddCarouselModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add Carousel Images</h2>
                  <button
                    onClick={() => setShowAddCarouselModal(false)}
                    className="text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleAddCarouselNews} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">
                      Carousel Images <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="file"
                      name="carousel_images_only"
                      onChange={handleCarouselFilesChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      accept=".jpg,.jpeg,.png,.webp"
                      multiple
                      required
                    />
                    {carouselFiles.length > 0 && (
                      <span className="text-xs text-gray-500">
                        {carouselFiles.length} file(s) selected
                      </span>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      Allowed: jpeg, jpg, png, webp (max 2048 KB each)
                    </p>
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">
                        Start Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={carouselForm.start_date}
                        onChange={handleCarouselFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">
                        End Date <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="date"
                        name="end_date"
                        value={carouselForm.end_date}
                        onChange={handleCarouselFormChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddCarouselModal(false);
                        setCarouselFiles([]);
                        setCarouselForm({ start_date: '', end_date: '' });
                      }}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                    >
                      Add Carousel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          {/* Modal for Edit News */}
          {showEditModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Edit News</h2>
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="text-2xl font-bold"
                  >
                    &times;
                  </button>
                </div>
                <form onSubmit={handleEditNews} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Title</label>
                    <input
                      type="text"
                      name="title"
                      value={editForm.title}
                      onChange={handleEditInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editForm.description}
                      onChange={handleEditInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">
                        Start Date
                      </label>
                      <input
                        type="date"
                        name="start_date"
                        value={editForm.start_date}
                        onChange={handleEditInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">End Date</label>
                      <input
                        type="date"
                        name="end_date"
                        value={editForm.end_date}
                        onChange={handleEditInputChange}
                        className="w-full border border-gray-300 rounded px-3 py-2"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block mb-1 font-medium">Document</label>
                    <input
                      type="file"
                      name="document"
                      onChange={handleEditFileChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                    />
                    {editForm.document && (
                      <span className="text-xs text-gray-500">
                        {editForm.document}
                      </span>
                    )}
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowEditModal(false)}
                      className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-purple-900 text-white rounded hover:bg-purple-800"
                    >
                      Save
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
          <div className="relative overflow-hidden shadow-md rounded-lg border border-gray-300">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Title
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Description
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Start Date
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      End Date
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Document
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Carousel Images
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Created By
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Updated By
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Edit News
                    </th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">
                      Delete
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        Loading...
                      </td>
                    </tr>
                  ) : news.length > 0 ? (
                    news.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.title}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.description}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.start_date}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.end_date}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.document ? (
                            <button
                              onClick={() =>
                                handleStreamDocument(item.document)
                              }
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
                          {item.carousel_images &&
                          item.carousel_images.length > 0 ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImages(item.carousel_images || []);
                                setViewingImageIndex(0);
                                setShowImageViewModal(true);
                              }}
                              className="flex items-center justify-center gap-1 text-purple-900 hover:text-purple-700 cursor-pointer"
                              title="View carousel images"
                            >
                              <FaImage className="text-purple-900" size={16} />
                              {item.carousel_images.length}
                            </button>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.created_by}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.updated_by}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          {item.carousel_images &&
                          item.carousel_images.length > 0 ? (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const item = news[index];
                                  setEditIndex(index);
                                  const token =
                                    localStorage.getItem('access_token');
                                  try {
                                    const response = await fetch(
                                      `${API_Get_News_Edit_Admin()}/${item.id}`,
                                      {
                                        headers: {
                                          Authorization: `Bearer ${token}`,
                                        },
                                      },
                                    );
                                    if (response.ok) {
                                      const result = await response.json();
                                      setEditCarouselImages(
                                        result.data.carousel_images || [],
                                      );
                                    } else {
                                      setEditCarouselImages(
                                        item.carousel_images || [],
                                      );
                                    }
                                  } catch (error) {
                                    setEditCarouselImages(
                                      item.carousel_images || [],
                                    );
                                  }
                                  setShowEditCarouselModal(true);
                                }}
                                className="hover:opacity-80 transition-opacity"
                                title="Edit Carousel Images"
                              >
                                <FaImage className="text-xl text-green-600" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-2">
                              <button
                                onClick={() => openEditModal(index)}
                                className="hover:opacity-80 transition-opacity"
                                title="Edit News"
                              >
                                <FaEdit className="text-xl text-purple-900" />
                              </button>
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <button
                            onClick={() => handleDelete(item.id)}
                            className="hover:opacity-80 transition-opacity"
                          >
                            <FaTrash className="text-xl text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={10}
                        className="px-3 py-4 text-center text-gray-500"
                      >
                        No news available for now
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Modal for View Carousel Images */}
      {showImageViewModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-75">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Carousel Images</h2>
              <button
                onClick={() => {
                  setShowImageViewModal(false);
                  setViewingImages([]);
                  setViewingImageIndex(0);
                }}
                className="text-2xl font-bold"
              >
                &times;
              </button>
            </div>
            {viewingImages.length > 0 && (
              <div className="relative">
                <div className="relative w-full h-[70vh] bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                  <img
                    src={(() => {
                      const image = viewingImages[viewingImageIndex];
                      const filename =
                        image.filename ||
                        (image.path ? image.path.split('/').pop() : '');
                      if (filename && imageBlobUrls.has(filename)) {
                        return imageBlobUrls.get(filename)!;
                      }
                      // Fallback to URL if blob not loaded yet
                      return image.url;
                    })()}
                    alt={`Carousel ${viewingImageIndex + 1}`}
                    className="max-w-full max-h-full object-contain cursor-pointer"
                    onClick={async () => {
                      const image = viewingImages[viewingImageIndex];
                      const filename =
                        image.filename ||
                        (image.path ? image.path.split('/').pop() : '');
                      if (filename) {
                        const token = localStorage.getItem('access_token');
                        let imageUrl = image.url;
                        if (token) {
                          try {
                            const response = await fetch(
                              `${API_Stream_News_Carousel()}/${filename}`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            if (response.ok) {
                              const blob = await response.blob();
                              imageUrl = URL.createObjectURL(blob);
                            }
                          } catch (error) {
                            console.error('Failed to load full image');
                          }
                        }
                        setFullImageUrl(imageUrl);
                        setFullImageFilename(filename);
                        setShowFullImageModal(true);
                      } else {
                        setFullImageUrl(image.url);
                        setFullImageFilename('');
                        setShowFullImageModal(true);
                      }
                    }}
                    onError={async (e) => {
                      const image = viewingImages[viewingImageIndex];
                      const filename =
                        image.filename ||
                        (image.path ? image.path.split('/').pop() : '');
                      if (filename) {
                        const token = localStorage.getItem('access_token');
                        const imgElement = e.target as HTMLImageElement;
                        if (token) {
                          try {
                            const response = await fetch(
                              `${API_Stream_News_Carousel()}/${filename}`,
                              {
                                headers: { Authorization: `Bearer ${token}` },
                              },
                            );
                            if (response.ok) {
                              const blob = await response.blob();
                              const url = URL.createObjectURL(blob);
                              imgElement.src = url;
                              // Update blob URLs map
                              setImageBlobUrls((prev) => {
                                const newMap = new Map(prev);
                                newMap.set(filename, url);
                                return newMap;
                              });
                            } else {
                              imgElement.alt = 'Image not available';
                            }
                          } catch (error) {
                            imgElement.alt = 'Image not available';
                          }
                        } else {
                          imgElement.src = `${API_Stream_News_Carousel()}/${filename}`;
                        }
                      }
                    }}
                  />
                </div>
                {viewingImages.length > 1 && (
                  <>
                    <button
                      onClick={() =>
                        setViewingImageIndex(
                          (prev) =>
                            (prev - 1 + viewingImages.length) %
                            viewingImages.length,
                        )
                      }
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition"
                    >
                      ‹
                    </button>
                    <button
                      onClick={() =>
                        setViewingImageIndex(
                          (prev) => (prev + 1) % viewingImages.length,
                        )
                      }
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black bg-opacity-50 text-white p-3 rounded-full hover:bg-opacity-75 transition"
                    >
                      ›
                    </button>
                    <div className="flex justify-center mt-4 space-x-2">
                      {viewingImages.map((_, index) => (
                        <button
                          key={index}
                          onClick={() => setViewingImageIndex(index)}
                          className={`w-3 h-3 rounded-full ${
                            index === viewingImageIndex
                              ? 'bg-purple-900'
                              : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                    <p className="text-center text-sm text-gray-500 mt-2">
                      {viewingImageIndex + 1} / {viewingImages.length}
                    </p>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal for Full Size Image */}
      {showFullImageModal && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black bg-opacity-90"
          onClick={() => {
            setShowFullImageModal(false);
            setFullImageUrl('');
            setFullImageFilename('');
          }}
        >
          <div className="relative max-w-[95vw] max-h-[95vh] flex items-center justify-center">
            <button
              onClick={() => {
                setShowFullImageModal(false);
                setFullImageUrl('');
                setFullImageFilename('');
              }}
              className="absolute top-4 right-4 text-white text-4xl font-bold hover:text-gray-300 z-10"
            >
              &times;
            </button>
            <img
              src={fullImageUrl}
              alt="Full size image"
              className="max-w-full max-h-[95vh] object-contain"
              onError={async (e) => {
                if (fullImageFilename) {
                  const token = localStorage.getItem('access_token');
                  const imgElement = e.target as HTMLImageElement;
                  if (token) {
                    try {
                      const response = await fetch(
                        `${API_Stream_News_Carousel()}/${fullImageFilename}`,
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        },
                      );
                      if (response.ok) {
                        const blob = await response.blob();
                        const url = URL.createObjectURL(blob);
                        imgElement.src = url;
                      } else {
                        imgElement.alt = 'Image not available';
                      }
                    } catch (error) {
                      imgElement.alt = 'Image not available';
                    }
                  }
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Modal for Edit Carousel Images */}
      {showEditCarouselModal && editIndex !== null && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-4xl max-h-[90vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Edit Carousel Images</h2>
              <button
                onClick={() => {
                  setShowEditCarouselModal(false);
                  setEditingImageIndex(null);
                  setReplacementImageFile(null);
                }}
                className="text-2xl font-bold"
              >
                &times;
              </button>
            </div>

            {/* Existing Carousel Images */}
            {editCarouselImages.length > 0 && (
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-3">
                  Existing Images ({editCarouselImages.length}):
                </p>
                <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                  {editCarouselImages.map((image, index) => (
                    <div key={index} className="relative border rounded p-2">
                      <img
                        src={(() => {
                          const filename =
                            image.filename ||
                            (image.path ? image.path.split('/').pop() : '');
                          if (filename && editImageBlobUrls.has(filename)) {
                            return editImageBlobUrls.get(filename)!;
                          }
                          // Fallback to URL if blob not loaded yet
                          return image.url;
                        })()}
                        alt={`Carousel ${index + 1}`}
                        className="w-full h-32 object-cover rounded"
                        onError={async (e) => {
                          const filename =
                            image.filename ||
                            (image.path ? image.path.split('/').pop() : '');
                          if (filename) {
                            const token = localStorage.getItem('access_token');
                            const imgElement = e.target as HTMLImageElement;
                            if (token) {
                              try {
                                const response = await fetch(
                                  `${API_Stream_News_Carousel()}/${filename}`,
                                  {
                                    headers: {
                                      Authorization: `Bearer ${token}`,
                                    },
                                  },
                                );
                                if (response.ok) {
                                  const blob = await response.blob();
                                  const url = URL.createObjectURL(blob);
                                  imgElement.src = url;
                                  // Update blob URLs map
                                  setEditImageBlobUrls((prev) => {
                                    const newMap = new Map(prev);
                                    newMap.set(filename, url);
                                    return newMap;
                                  });
                                } else {
                                  imgElement.alt = 'Image not available';
                                }
                              } catch (error) {
                                imgElement.alt = 'Image not available';
                              }
                            } else {
                              imgElement.src = `${API_Stream_News_Carousel()}/${filename}`;
                            }
                          }
                        }}
                      />
                      <div className="flex gap-1 mt-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingImageIndex(index);
                            setReplacementImageFile(null);
                          }}
                          className="flex-1 text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                        >
                          <FaEditIcon size={10} className="inline mr-1" />
                          Replace
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            if (editIndex !== null) {
                              const item = news[editIndex];
                              handleDeleteCarouselImage(item.id, index);
                            }
                          }}
                          className="flex-1 text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
                        >
                          <FaTrashIcon size={10} className="inline mr-1" />
                          Delete
                        </button>
                      </div>
                      {editingImageIndex === index && (
                        <div className="mt-2 border-t pt-2">
                          <input
                            type="file"
                            accept=".jpg,.jpeg,.png,.webp"
                            onChange={(e) => {
                              if (e.target.files && e.target.files[0]) {
                                setReplacementImageFile(e.target.files[0]);
                              }
                            }}
                            className="w-full text-xs"
                          />
                          <div className="flex gap-1 mt-1">
                            <button
                              type="button"
                              onClick={() => {
                                if (
                                  replacementImageFile &&
                                  editIndex !== null
                                ) {
                                  const item = news[editIndex];
                                  handleUpdateCarouselImage(
                                    item.id,
                                    index,
                                    replacementImageFile,
                                  );
                                }
                              }}
                              className="flex-1 text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600"
                              disabled={!replacementImageFile}
                            >
                              Update
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingImageIndex(null);
                                setReplacementImageFile(null);
                              }}
                              className="flex-1 text-xs bg-gray-500 text-white px-2 py-1 rounded hover:bg-gray-600"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload New Carousel Images */}
            <div className="border-t pt-4">
              <label className="block mb-2 font-medium">
                Upload New Carousel Images
              </label>
              <input
                type="file"
                name="new_carousel_images"
                onChange={handleNewCarouselFilesChange}
                className="w-full border border-gray-300 rounded px-3 py-2"
                accept=".jpg,.jpeg,.png,.webp"
                multiple
              />
              {newCarouselFiles.length > 0 && (
                <span className="text-xs text-gray-500">
                  {newCarouselFiles.length} new file(s) selected
                </span>
              )}
              <p className="text-xs text-gray-400 mt-1">
                Allowed: jpeg, jpg, png, webp (max 2048 KB each)
              </p>
            </div>

            {/* Quick Upload Button */}
            {editIndex !== null && (
              <div className="mt-4 border-t pt-4">
                <label className="block text-sm text-gray-600 mb-2">
                  Or upload single image now:
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={(e) => {
                    if (
                      e.target.files &&
                      e.target.files[0] &&
                      editIndex !== null
                    ) {
                      const item = news[editIndex];
                      handleUploadCarouselImage(item.id, e.target.files[0]);
                      e.target.value = '';
                    }
                  }}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
            )}

            <div className="flex justify-end gap-2 mt-4">
              <button
                type="button"
                onClick={() => {
                  setShowEditCarouselModal(false);
                  setEditingImageIndex(null);
                  setReplacementImageFile(null);
                  setNewCarouselFiles([]);
                }}
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default News;
