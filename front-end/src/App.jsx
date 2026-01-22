import './App.css';
import {BrowserRouter as Router,Routes,Route,Navigate} from 'react-router-dom'
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import UsersList from './components/Users/UsersList';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AdminRoute from './components/auth/AdminRoute';
import Landing from './components/Landing';
import { AuthProvider } from './context/AuthContext';


function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path='/' element={<Landing/>}/>
          <Route path='/login' element={<Login/>}/>
          <Route path='/register' element={<Register/>}/>
          <Route 
            path='/dashboard' 
            element={
              <ProtectedRoute>
                <Dashboard/>
              </ProtectedRoute>
            }
          />
          <Route 
            path='/users' 
            element={
              <ProtectedRoute>
                <AdminRoute>
                  <UsersList/>
                </AdminRoute>
              </ProtectedRoute>
            }
          />
          {/* Catch-all route for undefined paths */}
          <Route path='*' element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
