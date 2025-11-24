import React, { useState, useEffect } from 'react';
import { appointmentAPI } from '../../services/api';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const PatientNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await appointmentAPI.getAll();
      const appointments = response.data;
      
      // Convert appointments to notifications
      const notifs = appointments.map(apt => ({
        id: apt.appointment_id,
        type: 'appointment',
        title: `Appointment ${apt.status === 'pending' ? 'Pending' : apt.status === 'accepted' ? 'Accepted' : 'Completed'}`,
        message: `Your appointment with doctor on ${format(new Date(apt.date_time), 'PP')} is ${apt.status}`,
        date: apt.date_time,
        status: apt.status
      }));

      setNotifications(notifs.sort((a, b) => new Date(b.date) - new Date(a.date)));
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <h1>Notifications</h1>
      <div className="card">
        {notifications.length === 0 ? (
          <p>No notifications</p>
        ) : (
          <div>
            {notifications.map((notif) => (
              <div key={notif.id} style={{ padding: '15px', borderBottom: '1px solid #eee' }}>
                <h3>{notif.title}</h3>
                <p>{notif.message}</p>
                <p style={{ fontSize: '12px', color: '#666' }}>
                  {format(new Date(notif.date), 'PPpp')}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientNotifications;

