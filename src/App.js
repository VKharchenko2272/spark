import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useMatch } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async';
import './css/style.css';
import Home from './Components/Home';
import Header from './Components/Header/';
import Footer from './Components/Footer';
import NavMenu from './Components/NavMenu';
import DepMetrics from './Components/DepMetrics';
import People from './Components/People';
import Login from './Components/Login';
import LineChart from './Components/Charts/LineChart';
import EvaluationComponent from './Components/EvaluationComponent';
import Eval from './Components/Eval';
import PrivateRoute from './Components/PrivateRoute';
import ViewComponent from './Components/ViewComponent';
import AddUser from './Components/AddUser';
import EditUser from './Components/EditUser';
import AddDepartment from './Components/AddDepartment';
import { AuthProvider } from './auth/AuthContext';

const Layout = () => {
  const location = useLocation();
  const rightPanelComponents = {};
  const headerComponent = {
    '/Header': <Header />,
  };
  const footerComponent = {
    '/Footer': <Footer />,
  };
  const matchEval = useMatch('/Eval/:id');
  const matchView = useMatch('/View/:id');
  const matchEdit = useMatch('/EditUser/:id');
  const notApplyPages = ['/People', '/Login', '/EvaluationComponent', matchEval?.pathname, matchView?.pathname, matchEdit?.pathname];
  const notApplyHeaderAndFooter = ['/Login'];
  const notApplyNavMenu = ['/EvaluationComponent', matchEval?.pathname, '/Login', matchView?.pathname];
  const RightPanelComponent = rightPanelComponents[location.pathname];
  const HeaderComponent = headerComponent[location.pathname] || <Header />;
  const FooterComponent = footerComponent[location.pathname] || <Footer />;
  const displayRightPanel = !notApplyPages.includes(location.pathname);
  const displayHeaderFooter = !notApplyHeaderAndFooter.includes(location.pathname);
  const displayNavMenu = !notApplyNavMenu.includes(location.pathname);

  return (
    <div className="app-shell">
      {HeaderComponent && displayHeaderFooter && (
        <>
          <Header />
          <Helmet className="helmet" />
        </>
      )}
      <main className="app-main-area">
        <div className="app-content-row">
          {displayNavMenu && <NavMenu />}
          <div className="app-route-content">
            <Routes>
              <Route path="/Login" element={<Login />} />
              <Route path="/Charts/LineChart" element={<LineChart scores={[]} />} />
              <Route path="/home/:id" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']}><Home /></PrivateRoute>} />
              <Route path="/DepMetrics" element={<PrivateRoute allowedRoles={['admin', 'manager']}><DepMetrics /></PrivateRoute>} />
              <Route path="/People" element={<PrivateRoute allowedRoles={['admin', 'manager']}><People /></PrivateRoute>} />
              <Route path="/EvaluationComponent" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']}><EvaluationComponent /></PrivateRoute>} />
              <Route path="/Eval/:id" element={<PrivateRoute allowedRoles={['admin', 'manager']}><Eval /></PrivateRoute>} />
              <Route path="/View/:id" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']}><ViewComponent /></PrivateRoute>} />
              <Route path="/Add" element={<PrivateRoute allowedRoles={['admin']}><AddUser /></PrivateRoute>} />
              <Route path="/EditUser/:id" element={<PrivateRoute allowedRoles={['admin']}><EditUser /></PrivateRoute>} />
              <Route path="/AddDepartment" element={<PrivateRoute allowedRoles={['admin']}><AddDepartment /></PrivateRoute>} />
              <Route path="*" element={<Navigate to="/Login" />} />
            </Routes>
          </div>
          {displayRightPanel && RightPanelComponent && (
            <aside className="app-right-panel">
              {RightPanelComponent}
            </aside>
          )}
        </div>
      </main>
      {displayHeaderFooter && FooterComponent && (
        <>
          <Footer />
        </>
      )}
    </div>
  );
};

function App() {
  return (
    <HelmetProvider>
      <AuthProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <Layout />
        </Router>
      </AuthProvider>
    </HelmetProvider>
  );
}

export default App;
