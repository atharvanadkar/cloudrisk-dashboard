import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import axios from 'axios';

const API_BASE_URL = 'https://cloudrisk-dashboard.onrender.com/api';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  // ========== GET USER ROLE ==========
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const isAdmin = user.role === 'admin';

  // Check authentication
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
    }
  }, [navigate]);

  // Fetch users on load
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([
        { username: 'johndoe', email: 'john@company.com', department: 'Finance', login_attempts: 15, last_location: 'Russia', mfa_enabled: false, issue_fixed: false, risk_level: 'HIGH' },
        { username: 'janedoe', email: 'jane@company.com', department: 'HR', login_attempts: 2, last_location: 'USA', mfa_enabled: true, issue_fixed: true, risk_level: 'LOW' },
        { username: 'bobsmith', email: 'bob@company.com', department: 'IT', login_attempts: 8, last_location: 'Nigeria', mfa_enabled: false, issue_fixed: false, risk_level: 'MEDIUM' },
        { username: 'alicewonder', email: 'alice@company.com', department: 'Marketing', login_attempts: 1, last_location: 'USA', mfa_enabled: true, issue_fixed: true, risk_level: 'LOW' }
      ]);
    }
  };

  const handleSeedUsers = async () => {
    setSeeding(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/seed-users`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('✅ Users seeded successfully!');
      await fetchUsers();
    } catch (error) {
      alert('❌ Error seeding users.');
      console.error('Seed error:', error);
    } finally {
      setSeeding(false);
    }
  };

  const handleAISearch = async () => {
    if (!searchUser.trim()) {
      alert('Please enter a username!');
      return;
    }

    setLoading(true);
    setAiResult(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/analyze/${searchUser}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAiResult(response.data);
      const risk = response.data.risk_level;
      const emoji = risk === 'HIGH' ? '🚨' : risk === 'MEDIUM' ? '⚠️' : '✅';
      alert(`${emoji} Risk Analysis for ${searchUser}: ${risk}\n\n${response.data.reason}`);
      
      await fetchUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Analysis failed. User not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssue = async (username) => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/fix/${username}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert(`✅ ${username} marked as fixed! Thank you email sent.`);
      await fetchUsers();
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/login');
      }
      alert('Error marking as fixed.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  // Risk color renderer
  const riskLevelRenderer = (params) => {
    const value = params.value;
    let bgColor, textColor;
    
    if (value === 'HIGH') {
      bgColor = '#ffcccc';
      textColor = '#cc0000';
    } else if (value === 'MEDIUM') {
      bgColor = '#fff3b0';
      textColor = '#cc9900';
    } else {
      bgColor = '#ccffcc';
      textColor = '#006600';
    }
    
    return (
      <span style={{
        backgroundColor: bgColor,
        color: textColor,
        fontWeight: 'bold',
        padding: '4px 12px',
        borderRadius: '12px',
        display: 'inline-block',
        width: '100%',
        textAlign: 'center'
      }}>
        {value}
      </span>
    );
  };

  const columnDefs = [
    { field: 'username', headerName: 'Username', width: 130 },
    { field: 'department', headerName: 'Department', width: 140 },
    { field: 'login_attempts', headerName: 'Failed Logins', width: 140 },
    { field: 'last_location', headerName: 'Location', width: 130 },
    { 
      field: 'mfa_enabled', 
      headerName: 'MFA', 
      width: 100,
      cellRenderer: (params) => params.value ? '✅' : '❌'
    },
    { 
      field: 'risk_level', 
      headerName: 'Risk Level', 
      width: 150,
      cellRenderer: riskLevelRenderer
    },
    {
      field: 'issue_fixed',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params) => params.value ? '✅ Fixed' : '⚠️ Pending'
    },
    {
      headerName: 'Actions',
      width: 160,
      cellRenderer: (params) => (
        <button
          onClick={() => handleFixIssue(params.data.username)}
          disabled={params.data.issue_fixed}
          style={{
            background: params.data.issue_fixed ? '#6c757d' : '#007bff',
            color: 'white',
            padding: '6px 14px',
            borderRadius: '4px',
            border: 'none',
            cursor: params.data.issue_fixed ? 'not-allowed' : 'pointer',
            fontSize: '12px',
            fontWeight: '500',
          }}
        >
          {params.data.issue_fixed ? '✅ Fixed' : 'Mark as Fixed'}
        </button>
      ),
    }
  ];

  return (
    <div className="dashboard-container" style={styles.container}>
      {/* Header */}
      <div className="dashboard-header" style={styles.header}>
        <div>
          <h1 style={styles.headerTitle}>🛡️ CloudRisk AI</h1>
          <p style={styles.headerSubtitle}>Security Risk Assessment</p>
        </div>
        
        <div className="dashboard-header-actions" style={styles.headerActions}>
          {/* Role Badge */}
          <span className="role-badge" style={{
            ...styles.roleBadge,
            background: isAdmin ? '#2563eb' : '#6b7280',
          }}>
            {isAdmin ? '👑 Admin' : '👤 User'}
          </span>
          
          <span className="user-greeting" style={styles.userGreeting}>
            Welcome, {user?.username || 'User'}
          </span>

          {/* Seed Users - Only for Admins */}
          {isAdmin && (
            <button 
              onClick={handleSeedUsers}
              disabled={seeding}
              style={{
                ...styles.seedButton,
                opacity: seeding ? 0.7 : 1,
                cursor: seeding ? 'not-allowed' : 'pointer',
              }}
            >
              {seeding ? '⏳ Seeding...' : '🌱 Seed Users'}
            </button>
          )}
          
          <button 
            onClick={handleLogout}
            className="logout-button"
            style={styles.logoutButton}
          >
            Logout
          </button>
        </div>
      </div>

      {/* AI Search Section */}
      <div className="search-section" style={styles.searchSection}>
        <h3 style={styles.searchTitle}>🤖 AI Risk Predictor</h3>
        <div className="search-container" style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Enter username (e.g., johndoe)"
            value={searchUser}
            onChange={(e) => setSearchUser(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleAISearch()}
            style={styles.searchInput}
          />
          <button
            onClick={handleAISearch}
            disabled={loading}
            style={{
              ...styles.searchButton,
              opacity: loading ? 0.7 : 1,
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? '🔍 Analyzing...' : '🔍 Analyze'}
          </button>
        </div>
        {aiResult && (
          <div className="ai-result" style={styles.aiResult}>
            <strong>Last Analysis for {aiResult.username}:</strong>{' '}
            <span className="ai-result-badge" style={{
              ...styles.aiResultBadge,
              background: aiResult.risk_level === 'HIGH' ? '#dc3545' : 
                         aiResult.risk_level === 'MEDIUM' ? '#ffc107' : '#28a745',
              color: aiResult.risk_level === 'MEDIUM' ? '#333' : 'white',
            }}>
              {aiResult.risk_level}
            </span>
            <span style={styles.aiResultReason}>{aiResult.reason}</span>
          </div>
        )}
      </div>

      {/* Role-based info message for regular users */}
      {!isAdmin && users.length > 0 && (
        <div className="info-message" style={styles.infoMessage}>
          ℹ️ You are viewing your own data only.
          <span style={{ fontWeight: '500' }}> {user?.username}</span>
        </div>
      )}

      {/* AG-Grid Table */}
      <div className="ag-theme-alpine" style={styles.tableContainer}>
        <AgGridReact
          rowData={users}
          columnDefs={columnDefs}
          pagination={true}
          paginationPageSize={10}
          defaultColDef={{ 
            sortable: true, 
            filter: true, 
            resizable: true,
            flex: 1,
            minWidth: 80,
          }}
          animateRows={true}
        />
      </div>
    </div>
  );
};

// ========== STYLES ==========
const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
    padding: '16px 24px',
    background: 'white',
    borderRadius: '12px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  headerTitle: {
    margin: 0,
    fontSize: '24px',
  },
  headerSubtitle: {
    margin: '4px 0 0',
    fontSize: '14px',
    color: '#64748b',
  },
  headerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  roleBadge: {
    color: 'white',
    padding: '4px 14px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '500',
  },
  userGreeting: {
    fontSize: '14px',
    color: '#64748b',
  },
  seedButton: {
    padding: '8px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
  },
  logoutButton: {
    padding: '8px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  searchSection: {
    background: '#f8f9fa',
    padding: '24px',
    borderRadius: '10px',
    marginBottom: '24px',
    border: '1px solid #dee2e6',
  },
  searchTitle: {
    marginTop: 0,
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  searchInput: {
    padding: '10px 16px',
    width: '300px',
    border: '1px solid #ced4da',
    borderRadius: '5px',
    fontSize: '16px',
  },
  searchButton: {
    padding: '10px 30px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '5px',
    fontSize: '16px',
  },
  aiResult: {
    marginTop: '15px',
    padding: '15px',
    background: 'white',
    borderRadius: '5px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  aiResultBadge: {
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: 'bold',
  },
  aiResultReason: {
    marginLeft: '5px',
  },
  infoMessage: {
    background: '#e8f4fd',
    border: '1px solid #b8d4e8',
    borderRadius: '8px',
    padding: '12px 16px',
    marginBottom: '16px',
    color: '#1a4b6d',
    fontSize: '14px',
  },
  tableContainer: {
    height: '500px',
    width: '100%',
  },
};

export default Dashboard;