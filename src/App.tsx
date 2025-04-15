import { HashRouter, Route, Routes } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Loader from './common/Loader';
import SignIn from './pages/Authentication/Pages/SignIn';
import Dashboard from './pages/Dashboard/Dashboard';
import DefaultLayout from './layout/DefaultLayout';
import ProtectedRoute from './pages/Authentication/ProtectedRoute';
import ManageUser from './pages/ManageUser/Pages/ManageUser';  // Ensure this path is correct
import AddUser from './pages/ManageUser/Pages/AddUser';  // Ensure this path is correct
import EditUser from './pages/ManageUser/Pages/EditUser';  // Ensure this path is correct
import { AuthProvider } from './pages/Authentication/AuthContext';
import GrTracking from './pages/GrTracking';
import GrTrackingSup from './pages/GrTrackingSup';
import InvoiceCreation from './pages/InvoiceCreation';
import InvoiceCreationSup from './pages/InvoiceCreationSup';
import InvoiceReport from './pages/InvoiceReport';
import InvoiceReportSup from './pages/InvoiceReportSup';

const App = () => {
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setTimeout(() => setLoading(false), 1000); // Simulate loading state
  }, []);

  if (loading) {
    return <Loader />;  // Show loading screen while loading
  }

  return (
    <AuthProvider>
      <HashRouter>
        <Routes>
          {/* Public Route */}
          <Route path="/auth/login" element={<SignIn />} />

          <Route element={<DefaultLayout/>}>
            <Route
              path="/"
              element={
                <ProtectedRoute allowedRoles={['1','2','3']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['1','2','3']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/list-user"
              element={
                <ProtectedRoute allowedRoles={['1']}>
                  <ManageUser/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/add-user"
              element={
                <ProtectedRoute allowedRoles={['1']}>
                  <AddUser/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/edit-user"
              element={
                <ProtectedRoute allowedRoles={['1']}>
                  <EditUser/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/gr-tracking"
              element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                  <GrTracking/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/grtracking"
              element={
                <ProtectedRoute allowedRoles={['3']}>
                  <GrTrackingSup/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoice-creation"
              element={
                <ProtectedRoute allowedRoles={['1']}>
                  <InvoiceCreation/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoicecreation"
              element={
                <ProtectedRoute allowedRoles={['3']}>
                  <InvoiceCreationSup/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoice-report"
              element={
                <ProtectedRoute allowedRoles={['1', '2']}>
                  <InvoiceReport/>
                </ProtectedRoute>
              }
            />

            <Route
              path="/invoicereport"
              element={
                <ProtectedRoute allowedRoles={['3']}>
                  <InvoiceReportSup/>
                </ProtectedRoute>
              }
            />

          </Route>

          {/* Optional 404 route */}
          <Route path="*" element={<div>Page Not Found</div>} />
        </Routes>
      </HashRouter>
    </AuthProvider>
  );
};

export default App;
