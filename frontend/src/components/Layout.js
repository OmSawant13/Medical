import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';

const Layout = ({ role }) => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const patientMenu = [
    { path: '/patient/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/patient/appointments', label: 'Appointments', icon: '📅' },
    { path: '/patient/search-doctors', label: 'Search Doctors', icon: '🔍' },
    { path: '/patient/history', label: 'Health Locker', icon: '🏥' },
    { path: '/patient/nearby-hospitals', label: 'Nearby Hospitals', icon: '📍' },
    { path: '/patient/notifications', label: 'Notifications', icon: '🔔' },
    { path: '/patient/settings', label: 'Settings', icon: '⚙️' }
  ];

  const doctorMenu = [
    { path: '/doctor/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/doctor/long-term-patients', label: 'Long-Term Patients', icon: '👥' }
  ];

  const hospitalMenu = [
    { path: '/hospital/dashboard', label: 'Dashboard', icon: '📊' }
  ];

  const menu = role === 'patient' ? patientMenu : role === 'doctor' ? doctorMenu : hospitalMenu;

  const isActive = (path) => location.pathname === path;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: 'var(--gray-50)' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '280px' : '80px',
        background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
        color: 'white',
        transition: 'width 0.3s ease',
        padding: '0',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: 'var(--shadow-lg)',
        position: 'relative'
      }}>
        {/* Logo/Brand */}
        <div style={{ 
          padding: '1.5rem', 
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <div style={{ 
            fontSize: '2rem',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'var(--primary)',
            borderRadius: 'var(--radius-md)'
          }}>
            🏥
          </div>
          {sidebarOpen && (
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: 'white' }}>
                Health-Link
              </h2>
              <p style={{ fontSize: '0.75rem', opacity: 0.7, margin: 0 }}>
                Healthcare Platform
              </p>
            </div>
          )}
        </div>

        {/* User Info */}
        {sidebarOpen && (
          <div style={{ 
            padding: '1rem 1.5rem', 
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            background: 'rgba(255,255,255,0.05)'
          }}>
            <p style={{ 
              fontSize: '0.875rem', 
              opacity: 0.8, 
              marginBottom: '0.25rem',
              textTransform: 'capitalize'
            }}>
              {role}
            </p>
            <p style={{ 
              fontSize: '1rem', 
              fontWeight: 600, 
              margin: 0,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>
              {user.name || 'User'}
            </p>
          </div>
        )}
        
        {/* Navigation */}
        <nav style={{ flex: 1, padding: '1rem 0', overflowY: 'auto' }}>
          {menu.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1.5rem',
                  color: active ? 'white' : 'rgba(255,255,255,0.7)',
                  textDecoration: 'none',
                  transition: 'all 0.2s ease',
                  background: active ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                  borderLeft: active ? '3px solid var(--primary)' : '3px solid transparent',
                  marginLeft: '0.5rem',
                  marginRight: '0.5rem',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: '0.25rem'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.1)';
                    e.currentTarget.style.color = 'white';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.color = 'rgba(255,255,255,0.7)';
                  }
                }}
              >
                <span style={{ 
                  fontSize: '1.25rem', 
                  marginRight: sidebarOpen ? '0.75rem' : '0',
                  minWidth: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span style={{ 
                    fontSize: '0.875rem', 
                    fontWeight: active ? 600 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {item.label}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Toggle Button */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex',
          justifyContent: 'center'
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              padding: '0.5rem',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '1.25rem',
              transition: 'all 0.2s ease',
              width: '100%'
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
          >
            {sidebarOpen ? '◀' : '▶'}
          </button>
        </div>

        {/* Logout Button */}
        <div style={{ 
          padding: '1rem', 
          borderTop: '1px solid rgba(255,255,255,0.1)'
        }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '0.75rem',
              background: 'rgba(239, 68, 68, 0.2)',
              color: 'white',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              borderRadius: 'var(--radius-md)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.5)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)';
              e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.3)';
            }}
          >
            <span>🚪</span>
            {sidebarOpen && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        overflowY: 'auto',
        minHeight: '100vh'
      }}>
        <Outlet />
      </div>
    </div>
  );
};

export default Layout;
