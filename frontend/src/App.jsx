import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import ThemeProvider from './components/providers/ThemeProvider';

// Layouts
import DashboardLayout from './components/operator/DashboardLayout';
import AdminDashboardLayout from './components/admin/AdminDashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import OperatorLoginPage from './pages/auth/OperatorLoginPage';
import OperatorRegisterPage from './pages/auth/OperatorRegisterPage';
import TripManagerLoginPage from './pages/auth/TripManagerLoginPage';
import AdminLoginPage from './pages/auth/AdminLoginPage';
import CustomerLoginPage from './pages/auth/CustomerLoginPage';
import CustomerRegisterPage from './pages/auth/CustomerRegisterPage';

// Operator Dashboard Pages
import DashboardPage from './pages/operator/DashboardPage';
import RoutesPage from './pages/operator/RoutesPage';
import BusesPage from './pages/operator/BusesPage';
import OperatorTripsPage from './pages/operator/TripsPage';
import EmployeesPage from './pages/operator/EmployeesPage';
import ReportsPage from './pages/operator/ReportsPage';
import VouchersPage from './pages/operator/VouchersPage';
import OperatorReviewsPage from './pages/OperatorReviewsPage';

// Customer Pages
import NewHomePage from './pages/NewHomePage';
import NewsPage from './pages/NewsPage';
import TripsPage from './pages/TripsPage';
import TripDetailPage from './pages/TripDetailPage';
import PassengerInfoPage from './pages/PassengerInfoPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import ProfilePage from './pages/customer/ProfilePage';
import MyTicketsPage from './pages/customer/MyTicketsPage';
import MyReviewsPage from './pages/MyReviewsPage';
import MyComplaintsPage from './pages/MyComplaintsPage';
import ComplaintDetailPage from './pages/ComplaintDetailPage';
import LoyaltyOverviewPage from './pages/LoyaltyOverviewPage';
import LoyaltyHistoryPage from './pages/LoyaltyHistoryPage';
import GuestTicketLookupPage from './pages/GuestTicketLookupPage';
import CancelTicketPage from './pages/CancelTicketPage';

// Payment Pages
import VNPayReturn from './pages/payment/VNPayReturn';
import BookingSuccess from './pages/payment/BookingSuccess';
import BookingFailure from './pages/payment/BookingFailure';

// Trip Manager Pages
import TripManagerDashboard from './pages/trip-manager/TripManagerDashboard';
import ActiveTripPage from './pages/trip-manager/ActiveTripPage';
import QRScannerPage from './pages/trip-manager/QRScannerPage';
import PassengersPage from './pages/trip-manager/PassengersPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import OperatorManagementPage from './pages/admin/OperatorManagementPage';
import ComplaintManagementPage from './pages/admin/ComplaintManagementPage';
import ContentManagementPage from './pages/admin/ContentManagementPage';
import AdminReportsPage from './pages/admin/ReportsPage';

function App() {
  return (
    <ThemeProvider>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 3000,
          style: {
            background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)',
            color: '#fff',
            borderRadius: '12px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            backdropFilter: 'blur(10px)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)',
            },
          },
          loading: {
            iconTheme: {
              primary: '#3b82f6',
              secondary: '#fff',
            },
            style: {
              background: 'linear-gradient(135deg, #2563eb 0%, #3b82f6 100%)',
            },
          },
        }}
      />

      <Routes>
        {/* Customer Auth Routes */}
        <Route path="/login" element={<CustomerLoginPage />} />
        <Route path="/register" element={<CustomerRegisterPage />} />

        {/* Customer Booking Flow */}
        <Route path="/" element={<NewHomePage />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/trips" element={<TripsPage />} />
        <Route path="/search-results" element={<TripsPage />} />
        <Route path="/trips/:tripId" element={<TripDetailPage />} />
        <Route path="/booking/passenger-info" element={<PassengerInfoPage />} />
        <Route path="/booking/confirmation/:bookingCode" element={<BookingConfirmationPage />} />

        {/* Customer Ticket Management */}
        <Route path="/my-tickets" element={<MyTicketsPage />} />
        <Route path="/tickets/lookup" element={<GuestTicketLookupPage />} />
        <Route path="/tickets/cancel" element={<CancelTicketPage />} />

        {/* Customer Profile */}
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Customer Reviews */}
        <Route
          path="/my-reviews"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MyReviewsPage />
            </ProtectedRoute>
          }
        />

        {/* Customer Complaints */}
        <Route
          path="/complaints"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <MyComplaintsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/complaints/:id"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <ComplaintDetailPage />
            </ProtectedRoute>
          }
        />

        {/* Customer Loyalty Program */}
        <Route
          path="/loyalty"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <LoyaltyOverviewPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/loyalty/history"
          element={
            <ProtectedRoute allowedRoles={['customer']}>
              <LoyaltyHistoryPage />
            </ProtectedRoute>
          }
        />

        {/* Payment Routes */}
        <Route path="/payment/vnpay-return" element={<VNPayReturn />} />
        <Route path="/booking/success" element={<BookingSuccess />} />
        <Route path="/booking/failure" element={<BookingFailure />} />
        <Route path="/payment/success" element={<BookingSuccess />} />
        <Route path="/payment/failure" element={<BookingFailure />} />
        <Route path="/payment/error" element={<BookingFailure />} />

        {/* Operator Auth Routes */}
        <Route path="/operator/login" element={<OperatorLoginPage />} />
        <Route path="/operator/register" element={<OperatorRegisterPage />} />

        {/* Operator Dashboard Routes - Protected */}
        <Route
          path="/operator"
          element={
            <ProtectedRoute allowedRoles={['operator']}>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/operator/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="routes" element={<RoutesPage />} />
          <Route path="buses" element={<BusesPage />} />
          <Route path="trips" element={<OperatorTripsPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="vouchers" element={<VouchersPage />} />
          <Route path="reviews" element={<OperatorReviewsPage />} />
        </Route>

        {/* Trip Manager Auth Routes */}
        <Route path="/trip-manager/login" element={<TripManagerLoginPage />} />

        {/* Trip Manager Routes - Protected */}
        <Route
          path="/trip-manager/dashboard"
          element={
            <ProtectedRoute allowedRoles={['trip_manager']}>
              <TripManagerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip-manager/active-trip"
          element={
            <ProtectedRoute allowedRoles={['trip_manager']}>
              <ActiveTripPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip-manager/trips/:tripId/scan"
          element={
            <ProtectedRoute allowedRoles={['trip_manager']}>
              <QRScannerPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/trip-manager/trips/:tripId/passengers"
          element={
            <ProtectedRoute allowedRoles={['trip_manager']}>
              <PassengersPage />
            </ProtectedRoute>
          }
        />

        {/* Admin Auth Routes */}
        <Route path="/admin/login" element={<AdminLoginPage />} />

        {/* Admin Dashboard Routes - Protected */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="users" element={<UserManagementPage />} />
          <Route path="operators" element={<OperatorManagementPage />} />
          <Route path="complaints" element={<ComplaintManagementPage />} />
          <Route path="content" element={<ContentManagementPage />} />
          <Route path="reports" element={<AdminReportsPage />} />
        </Route>

        {/* 404 Not Found */}
        <Route
          path="*"
          element={
            <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-purple-50 flex items-center justify-center">
              <div className="text-center p-8">
                <div className="mb-8">
                  <div className="text-8xl font-bold text-gradient-primary mb-4">404</div>
                  <div className="w-24 h-1 bg-gradient-primary mx-auto rounded-full"></div>
                </div>
                <h2 className="text-2xl font-semibold text-neutral-800 mb-4">
                  Trang không tồn tại
                </h2>
                <p className="text-neutral-600 mb-8 max-w-md mx-auto">
                  Trang bạn đang tìm kiếm có thể đã được di chuyển, xóa hoặc không tồn tại.
                </p>
                <a 
                  href="/" 
                  className="inline-flex items-center px-6 py-3 bg-gradient-primary text-white font-medium rounded-lg hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                  Về trang chủ
                </a>
              </div>
            </div>
          }
        />
      </Routes>
    </ThemeProvider>
  );
}

export default App;
