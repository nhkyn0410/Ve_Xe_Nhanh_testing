import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  Table,
  Tag,
  Button,
  Space,
  message,
  Statistic,
  Row,
  Col,
  Empty,
  Modal,
  Alert,
} from 'antd';
import {
  CarOutlined,
  QrcodeOutlined,
  TeamOutlined,
  ClockCircleOutlined,
  EnvironmentOutlined,
  CalendarOutlined,
  PlayCircleOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import useTripManagerAuthStore from '../../store/tripManagerAuthStore';
import useActiveTripStore from '../../store/activeTripStore';
import api from '../../services/api';
import tripManagerApi from '../../services/tripManagerApi';

const TripManagerDashboard = () => {
  const navigate = useNavigate();
  const { tripManager: user, logout } = useTripManagerAuthStore();
  const { startTrip, hasActiveTrip, getActiveTripId } = useActiveTripStore();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTrips: 0,
    upcomingTrips: 0,
    ongoingTrips: 0,
    completedTrips: 0,
  });
  const [actionLoading, setActionLoading] = useState(false);

  // Fetch assigned trips
  const fetchTrips = async () => {
    setLoading(true);
    try {
      // Get trips assigned to this trip manager
      const response = await api.get('/employees/my-trips');

      if (response.status === 'success') {
        const tripsData = response.data.trips || [];
        setTrips(tripsData);

        // Calculate stats
        setStats({
          totalTrips: tripsData.length,
          upcomingTrips: tripsData.filter((t) => t.status === 'scheduled').length,
          ongoingTrips: tripsData.filter((t) => t.status === 'ongoing').length,
          completedTrips: tripsData.filter((t) => t.status === 'completed').length,
        });
      }
    } catch (error) {
      console.error('Fetch trips error:', error);
      message.error(error || 'Không thể tải danh sách chuyến xe');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrips();
    // Check if there's an active trip, redirect to it
    if (hasActiveTrip()) {
      message.info('Đang chuyển đến chuyến xe đang hoạt động...');
      navigate('/trip-manager/active-trip');
    }
  }, []);

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/trip-manager/login');
  };

  // Handle status update
  const handleUpdateStatus = async (tripId, status, reason = null) => {
    setActionLoading(true);
    try {
      const response = await tripManagerApi.updateTripStatus(tripId, {
        status,
        reason,
      });

      if (response.success) {
        message.success(response.message || 'Cập nhật trạng thái thành công');
        fetchTrips(); // Reload trips
      } else {
        message.error(response.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      console.error('Update status error:', error);
      message.error(error.message || 'Không thể cập nhật trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  // Handle start trip - navigate to active trip page
  const handleStartTrip = async (trip) => {
    Modal.confirm({
      title: 'Bắt đầu chuyến xe',
      content: (
        <div>
          <p>
            Bạn có chắc muốn bắt đầu chuyến <strong>{trip.route?.routeName}</strong>?
          </p>
          <Alert
            message="Lưu ý"
            description="Sau khi bắt đầu, bạn sẽ được chuyển đến trang quản lý chuyến xe và không thể quay về cho đến khi hoàn thành chuyến."
            type="info"
            showIcon
            className="mt-3"
          />
        </div>
      ),
      icon: <PlayCircleOutlined />,
      okText: 'Bắt đầu',
      cancelText: 'Hủy',
      width: 500,
      onOk: async () => {
        setActionLoading(true);
        try {
          // Update trip status to ongoing
          const response = await tripManagerApi.updateTripStatus(trip._id, {
            status: 'ongoing',
          });

          if (response.success) {
            // Save to active trip store
            startTrip(trip);
            message.success('Đã bắt đầu chuyến xe!');
            // Navigate to active trip page
            navigate('/trip-manager/active-trip');
          } else {
            message.error(response.message || 'Không thể bắt đầu chuyến');
          }
        } catch (error) {
          console.error('Start trip error:', error);
          message.error(error.message || 'Có lỗi xảy ra');
        } finally {
          setActionLoading(false);
        }
      },
    });
  };

  // Handle complete trip
  const handleCompleteTrip = (trip) => {
    Modal.confirm({
      title: 'Xác nhận hoàn thành chuyến xe',
      content: `Bạn có chắc muốn hoàn thành chuyến ${trip.route?.routeName}?`,
      icon: <CheckCircleOutlined />,
      okText: 'Hoàn thành',
      cancelText: 'Hủy',
      onOk: () => handleUpdateStatus(trip._id, 'completed'),
    });
  };

  // Get status tag
  const getStatusTag = (status) => {
    const statusConfig = {
      scheduled: { color: 'blue', text: 'Chưa bắt đầu' },
      ongoing: { color: 'green', text: 'Đang diễn ra' },
      completed: { color: 'default', text: 'Hoàn thành' },
      cancelled: { color: 'red', text: 'Đã hủy' },
    };

    const config = statusConfig[status] || { color: 'default', text: status };
    return <Tag color={config.color}>{config.text}</Tag>;
  };

  // Table columns
  const columns = [
    {
      title: 'Tuyến đường',
      dataIndex: ['route', 'routeName'],
      key: 'route',
      render: (routeName) => (
        <div>
          <EnvironmentOutlined className="mr-1" />
          {routeName}
        </div>
      ),
    },
    {
      title: 'Ngày giờ đi',
      dataIndex: 'departureTime',
      key: 'departureTime',
      render: (time) => (
        <div>
          <CalendarOutlined className="mr-1" />
          {dayjs(time).format('DD/MM/YYYY HH:mm')}
        </div>
      ),
    },
    {
      title: 'Xe',
      dataIndex: ['bus', 'busNumber'],
      key: 'bus',
      render: (busNumber) => (
        <div>
          <CarOutlined className="mr-1" />
          {busNumber}
        </div>
      ),
    },
    {
      title: 'Số ghế',
      key: 'seats',
      render: (_, record) => (
        <div>
          {record.bookedSeats?.length || 0} / {record.totalSeats}
        </div>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      render: (status) => getStatusTag(status),
    },
    {
      title: 'Thao tác',
      key: 'actions',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space wrap size="small">
          {record.status === 'scheduled' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartTrip(record)}
              loading={actionLoading}
            >
              Bắt đầu
            </Button>
          )}

          {record.status === 'ongoing' && (
            <Button
              type="primary"
              size="small"
              icon={<CheckCircleOutlined />}
              onClick={() => handleCompleteTrip(record)}
              loading={actionLoading}
              style={{ backgroundColor: '#52c41a' }}
            >
              Hoàn thành
            </Button>
          )}

          {(record.status === 'completed' || record.status === 'cancelled') && (
            <Tag color={record.status === 'completed' ? 'green' : 'red'}>
              {record.status === 'completed' ? 'Đã hoàn thành' : 'Đã hủy'}
            </Tag>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow">
        <div className="max-w-[108rem] mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                <CarOutlined className="mr-2" />
                Trip Manager Dashboard
              </h1>
              <p className="text-gray-600 mt-1">
                Xin chào, <strong>{user?.fullName}</strong>
              </p>
            </div>

            <Button onClick={handleLogout}>Đăng xuất</Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[128rem] mx-auto px-4 py-8">
        {/* Stats */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Tổng số chuyến"
                value={stats.totalTrips}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#1890ff' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Sắp tới"
                value={stats.upcomingTrips}
                prefix={<ClockCircleOutlined />}
                valueStyle={{ color: '#52c41a' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Đang diễn ra"
                value={stats.ongoingTrips}
                prefix={<CarOutlined />}
                valueStyle={{ color: '#faad14' }}
              />
            </Card>
          </Col>

          <Col xs={24} sm={12} lg={6}>
            <Card>
              <Statistic
                title="Hoàn thành"
                value={stats.completedTrips}
                prefix={<TeamOutlined />}
                valueStyle={{ color: '#8c8c8c' }}
              />
            </Card>
          </Col>
        </Row>

        {/* Trips Table */}
        <Card title="Chuyến xe của tôi">
          {trips.length > 0 ? (
            <Table
              columns={columns}
              dataSource={trips}
              rowKey="_id"
              loading={loading}
              scroll={{ x: 1400 }}
              pagination={{
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Tổng ${total} chuyến`,
              }}
            />
          ) : (
            <Empty
              description="Bạn chưa được phân công chuyến nào"
              image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
          )}
        </Card>
      </div>

    </div>
  );
};

export default TripManagerDashboard;
