import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { userAPI, aiAPI } from '../services/api';

const Dashboard = () => {
  const [users, setUsers] = useState([]);
  const [searchUser, setSearchUser] = useState('');
  const [aiResult, setAiResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  // Check if user is logged in
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/');
    }
  }, [navigate]);

  // Fetch users on load
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // ✅ NEW CODE - Paste this
const fetchUsers = useCallback(async () => {
  try {
    const response = await userAPI.getAll();
    setUsers(response.data);
  } catch (error) {
    if (error.response?.status === 401) {
      navigate('/');
    }
    console.error('Error fetching users:', error);
  }
}, [navigate]);

  const handleAISearch = async () => {
    if (!searchUser.trim()) {
      alert('Please enter a username!');
      return;
    }

    setLoading(true);
    setAiResult(null);

    try {
      const response = await aiAPI.analyze(searchUser);
      setAiResult(response.data);
      
      // Refresh user list
      await fetchUsers();

      // Show alert based on risk level
      const risk = response.data.risk_level;
      const emoji = risk === 'HIGH' ? '🚨' : risk === 'MEDIUM' ? '⚠️' : '✅';
      alert(`${emoji} Risk Analysis for ${searchUser}: ${risk}\n\n${response.data.reason}`);
    } catch (error) {
      if (error.response?.status === 401) {
        navigate('/');
      }
      alert(error.response?.data?.error || 'Analysis failed. User not found.');
    } finally {
      setLoading(false);
    }
  };

  const handleFixIssue = async (username) => {
  try {
    await aiAPI.fix(username);
    alert(`✅ ${username} marked as fixed! Thank you email sent.`);
    await fetchUsers();
  } catch (error) {
    if (error.response?.status === 401) {
      navigate('/');
    }
    alert('Error marking as fixed.');
  }
};

  const handleSeedUsers = async () => {
    setSeeding(true);
    try {
      const response = await userAPI.seed();
      alert(`✅ ${response.data.message}`);
      await fetchUsers();
    } catch (error) {
      alert('Error seeding users.');
    } finally {
      setSeeding(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
  };

  // AG-Grid Column Definitions
  const columnDefs = [
    { 
      field: 'username', 
      headerName: 'Username', 
      width: 130,
      pinned: 'left',
    },
    { 
      field: 'department', 
      headerName: 'Department', 
      width: 140,
      editable: true,
    },
    { 
      field: 'login_attempts', 
      headerName: 'Failed Logins', 
      width: 140,
      type: 'numericColumn',
    },
    { 
      field: 'last_location', 
      headerName: 'Location', 
      width: 130,
    },
    { 
      field: 'mfa_enabled', 
      headerName: 'MFA', 
      width: 100,
      cellRenderer: (params) => params.value ? '✅' : '❌',
    },
    { 
      field: 'risk_level', 
      headerName: 'Risk Level', 
      width: 130,
      cellStyle: (params) => {
        const value = params.value;
        if (value === 'HIGH') {
          return { backgroundColor: '#ffcccc', fontWeight: 'bold', color: '#cc0000' };
        } else if (value === 'MEDIUM') {
          return { backgroundColor: '#fff3b0', fontWeight: 'bold', color: '#cc9900' };
        } else {
          return { backgroundColor: '#ccffcc', fontWeight: 'bold', color: '#006600' };
        }
      },
    },
    {
      field: 'issue_fixed',
      headerName: 'Status',
      width: 120,
      cellRenderer: (params) => params.value ? '✅ Fixed' : '⚠️ Pending',
    },
    {
      headerName: 'Actions',
      width: 160,
      pinned: 'right',
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
    },
  ];

  const defaultColDef = {
    sortable: true,
    filter: true,
    resizable: true,
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.headerTitle}>🛡️ CloudRisk AI</h1>
          <span style={styles.headerBadge}>Risk Assessment Dashboard</span>
        </div>
        <div style={styles.headerRight}>
          <button onClick={handleSeedUsers} disabled={seeding} style={styles.seedButton}>
            {seeding ? '⏳ Seeding...' : '🌱 Seed Users'}
          </button>
          <button onClick={handleLogout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>

      {/* AI Search Section */}
      <div style={styles.aiSection}>
        <div style={styles.aiHeader}>
          <span style={styles.aiIcon}>🤖</span>
          <div>
            <h2 style={styles.aiTitle}>AI Risk Predictor</h2>
            <p style={styles.aiSubtitle}>Enter a username to analyze security risk using AI</p>
          </div>
        </div>
        <div style={styles.searchContainer}>
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
            }}
          >
            {loading ? '🔍 Analyzing...' : '🔍 Analyze'}
          </button>
        </div>
        {aiResult && (
          <div style={styles.aiResult}>
            <span style={styles.aiResultLabel}>Last Analysis:</span>
            <span
              style={{
                ...styles.aiResultBadge,
                background:
                  aiResult.risk_level === 'HIGH'
                    ? '#dc3545'
                    : aiResult.risk_level === 'MEDIUM'
                    ? '#ffc107'
                    : '#28a745',
                color: aiResult.risk_level === 'MEDIUM' ? '#333' : 'white',
              }}
            >
              {aiResult.risk_level}
            </span>
            <span style={styles.aiResultReason}>{aiResult.reason}</span>
          </div>
        )}
      </div>

      {/* AG-Grid Table */}
      <div style={styles.tableContainer}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>📋 User Database</h3>
          <span style={styles.tableCount}>{users.length} users</span>
        </div>
        <div className="ag-theme-alpine" style={styles.table}>
          <AgGridReact
            rowData={users}
            columnDefs={columnDefs}
            defaultColDef={defaultColDef}
            pagination={true}
            paginationPageSize={10}
            animateRows={true}
            rowHeight={45}
          />
        </div>
      </div>

      {/* Footer */}
      <footer style={styles.footer}>
        <p>© 2026 CloudRisk AI Security Dashboard | Built with React + AG-Grid</p>
      </footer>
    </div>
  );
};

// Styles
const styles = {
  container: {
    minHeight: '100vh',
    background: '#f8f9fa',
    padding: '20px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'white',
    padding: '16px 24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  headerTitle: {
    fontSize: '22px',
    fontWeight: 'bold',
    margin: 0,
    color: '#333',
  },
  headerBadge: {
    background: '#e9ecef',
    padding: '4px 12px',
    borderRadius: '20px',
    fontSize: '12px',
    color: '#666',
  },
  headerRight: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  seedButton: {
    padding: '8px 20px',
    background: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  logoutButton: {
    padding: '8px 20px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  aiSection: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    marginBottom: '24px',
  },
  aiHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    marginBottom: '16px',
  },
  aiIcon: {
    fontSize: '32px',
  },
  aiTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  },
  aiSubtitle: {
    fontSize: '14px',
    color: '#666',
    margin: '4px 0 0 0',
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
  },
  searchInput: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #dee2e6',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.3s',
  },
  searchButton: {
    padding: '12px 32px',
    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
  },
  aiResult: {
    marginTop: '16px',
    padding: '16px',
    background: '#f8f9fa',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
  },
  aiResultLabel: {
    fontWeight: '500',
    color: '#666',
  },
  aiResultBadge: {
    padding: '4px 16px',
    borderRadius: '20px',
    fontWeight: 'bold',
    fontSize: '14px',
  },
  aiResultReason: {
    color: '#555',
    fontSize: '14px',
  },
  tableContainer: {
    background: 'white',
    padding: '24px',
    borderRadius: '12px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  tableTitle: {
    fontSize: '18px',
    fontWeight: '600',
    margin: 0,
    color: '#333',
  },
  tableCount: {
    fontSize: '14px',
    color: '#666',
    background: '#e9ecef',
    padding: '4px 12px',
    borderRadius: '20px',
  },
  table: {
    height: '450px',
    width: '100%',
  },
  footer: {
    textAlign: 'center',
    padding: '20px',
    color: '#888',
    fontSize: '13px',
    marginTop: '20px',
  },
};

export default Dashboard;