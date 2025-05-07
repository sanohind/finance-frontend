import React, { useState, useEffect } from 'react';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import Button from '../components/Forms/Button';
import { FaEdit, FaTrash, FaPlus } from 'react-icons/fa';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { API_Get_News, API_Create_News_Admin, API_Get_News_Edit_Admin, API_Update_News_Admin, API_Delete_News_Admin } from '../api/api';

interface NewsItem {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  document: string;
  created_by: string;
  updated_by: string;
}

const News: React.FC = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: ''
  });
  const [file, setFile] = useState<File | null>(null);

  const [showEditModal, setShowEditModal] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: ''
  });
  const [initialEditForm, setInitialEditForm] = useState({
    title: '',
    description: '',
    start_date: '',
    end_date: '',
    document: ''
  });
  const [editFile, setEditFile] = useState<File | null>(null);

  useEffect(() => {
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(API_Get_News(), {
        headers: { Authorization: `Bearer ${token}` }
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setForm({ ...form, document: e.target.files[0].name });
    }
  };

  const handleAddNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.description || !form.start_date || !form.end_date || !form.document) {
      toast.error('Please fill all fields');
      return;
    }
    const token = localStorage.getItem('access_token');
    const formData = new FormData();
    formData.append('title', form.title);
    formData.append('description', form.description);
    formData.append('start_date', form.start_date);
    formData.append('end_date', form.end_date);
    if (file) formData.append('document', file);
    try {
      const response = await fetch(API_Create_News_Admin(), {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (!response.ok) throw new Error('Failed to add news');
      toast.success('News added successfully!', { autoClose: 2000 });
      setShowAddModal(false);
      setForm({ title: '', description: '', start_date: '', end_date: '', document: '' });
      setFile(null);
      fetchNews();
    } catch (error) {
      toast.error('Failed to add news');
    }
  };

  const openEditModal = async (index: number) => {
    setEditIndex(index);
    const item = news[index];
    setEditFile(null);
    const token = localStorage.getItem('access_token');
    try {
      const response = await fetch(`${API_Get_News_Edit_Admin()}/${item.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to fetch news for edit');
      const result = await response.json();
      const fetchedData = {
        title: result.data.title,
        description: result.data.description,
        start_date: result.data.start_date,
        end_date: result.data.end_date,
        document: result.data.document
      };
      setEditForm(fetchedData);
      setInitialEditForm(fetchedData);
      setShowEditModal(true);
    } catch (error) {
      toast.error('Failed to fetch news for edit');
    }
  };

  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEditFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setEditFile(e.target.files[0]);
      setEditForm({ ...editForm, document: e.target.files[0].name });
    }
  };

  const handleEditNews = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editIndex === null) return;

    if (!editForm.title || !editForm.description || !editForm.start_date || !editForm.end_date) {
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
        body: formData
      });

      if (!response.ok) {
        let errorMessage = `Failed to update news (status: ${response.status})`;
        try {
          const errorData = await response.json();
          if (response.status === 422 && errorData && errorData.errors) {
            const validationMessages = Object.values(errorData.errors).flat().join('; ');
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
      setEditForm({ title: '', description: '', start_date: '', end_date: '', document: '' });
      setInitialEditForm({ title: '', description: '', start_date: '', end_date: '', document: '' });
      setEditFile(null);
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
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete news');
      toast.success('News deleted successfully!', { autoClose: 2000 });
      fetchNews();
    } catch (error) {
      toast.error('Failed to delete news');
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
            </div>
          </div>
          {/* Modal for Add News */}
          {showAddModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Add News</h2>
                  <button onClick={() => setShowAddModal(false)} className="text-2xl font-bold">&times;</button>
                </div>
                <form onSubmit={handleAddNews} className="space-y-4">
                  <div>
                    <label className="block mb-1 font-medium">Title</label>
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
                    <label className="block mb-1 font-medium">Description</label>
                    <textarea
                      name="description"
                      value={form.description}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      rows={3}
                      required
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label className="block mb-1 font-medium">Start Date</label>
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
                      <label className="block mb-1 font-medium">End Date</label>
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
                    <label className="block mb-1 font-medium">Document</label>
                    <input
                      type="file"
                      name="document"
                      onChange={handleFileChange}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                      required
                    />
                    {form.document && <span className="text-xs text-gray-500">{form.document}</span>}
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
          {/* Modal for Edit News */}
          {showEditModal && (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black bg-opacity-50">
              <div className="bg-white p-6 rounded-md shadow-lg w-full max-w-lg">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold">Edit News</h2>
                  <button onClick={() => setShowEditModal(false)} className="text-2xl font-bold">&times;</button>
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
                    <label className="block mb-1 font-medium">Description</label>
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
                      <label className="block mb-1 font-medium">Start Date</label>
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
                    />
                    {editForm.document && <span className="text-xs text-gray-500">{editForm.document}</span>}
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
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Title</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Description</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Start Date</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">End Date</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Document</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Created By</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Updated By</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Edit News</th>
                    <th className="px-3 py-3.5 text-sm font-bold text-gray-700 uppercase tracking-wider text-center border">Delete</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {loading ? (
                    <tr><td colSpan={9} className="px-3 py-4 text-center text-gray-500">Loading...</td></tr>
                  ) : news.length > 0 ? (
                    news.map((item, index) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.title}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.description}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.start_date}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.end_date}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <a href={`/${item.document}`} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">{item.document}</a>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.created_by}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">{item.updated_by}</td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <button onClick={() => openEditModal(index)} className="hover:opacity-80 transition-opacity">
                            <FaEdit className="text-xl text-purple-900" />
                          </button>
                        </td>
                        <td className="px-3 py-3 text-center whitespace-nowrap">
                          <button onClick={() => handleDelete(item.id)} className="hover:opacity-80 transition-opacity">
                            <FaTrash className="text-xl text-red-600" />
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={9} className="px-3 py-4 text-center text-gray-500">
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
    </>
  );
};

export default News;
