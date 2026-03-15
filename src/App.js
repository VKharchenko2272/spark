import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, Navigate, useMatch } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async'; //import HelmetProvider due to last updates as Helmet outdated
import './css/style.css';
// import './css/reset.css';
import Home from './Components/Home';
import Header from './Components/Header/';
import Footer from './Components/Footer';
import NavMenu from './Components/NavMenu';
import PageDepDashboard from './Components/RightPanel/PageDepDashboard';
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
// import PageHome from './Components/RightPanel/PageHome';

// Layout component defines the structure of the page with Header, Footer, and dynamic content based on routes.
const Layout = () => {

  // useLocation hook gives the current route location, which can be used to determine the active route.
  const location = useLocation();
  // Object mapping routes to their corresponding RightPanel components.
  const rightPanelComponents = {
    // '/home/:id': <PageHome/>,
    // '/DepMetrics': <PageDepDashboard />
  };
  const headerComponent = {
    '/Header': <Header />
  };
  const footerComponent = {
    '/Footer': <Footer />
  };
  // Matching routes that have parameters
  const matchEval = useMatch('/Eval/:id');
  const matchView = useMatch('/View/:id');
  const matchEdit = useMatch('/EditUser/:id');
  // Array of routes where the RightPanel should not be displayed.
  const notApplyPages = ['/People', '/Login', '/EvaluationComponent', matchEval?.pathname, matchView?.pathname, matchEdit?.pathname];
  const notApplyHeaderAndFooter = ['/Login'];
  const notApplyNavMenu = ['/EvaluationComponent', matchEval?.pathname, '/Login', matchView?.pathname];
  // Determine the RightPanel component to display based on the current route.
  // If no specific component is found, default to PageHome.
  const RightPanelComponent = rightPanelComponents[location.pathname];
  const HeaderComponent = headerComponent[location.pathname] || <Header />;
  const FooterComponent = footerComponent[location.pathname] || <Footer />;
  // Check if the current route is in the list of routes where RightPanel should not be displayed.
  const displayRightPanel = !notApplyPages.includes(location.pathname);
  const displayHeaderFooter = !notApplyHeaderAndFooter.includes(location.pathname);
  const displayNavMenu = !notApplyNavMenu.includes(location.pathname);

  return (
    <>
      {/* Header section */}
      {HeaderComponent && displayHeaderFooter && (
        <>
          <Header />
          {/* Helmet is used for managing the document head, like setting the page title dynamically */}
          <Helmet className="helmet">
          </Helmet>
        </>
      )}
      {/* Main wrapper for the content and navigation */}
      <main className="row container-fluid m-0 p-0">
        {/* Navigation Menu */}
        {displayNavMenu && (
          <NavMenu />
        )}
        {/* Main content area that changes based on the active route */}
        <div className='col row m-0'>
        <Routes>
              {/* Define routes and their corresponding components */}
              <Route path="/Login" element={<Login />} /> {/*Public Route*/}
              {/* Private */}
              <Route path='/Charts/LineChart' element={<LineChart />} />
              <Route path="/home/:id" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']}> <Home /> </PrivateRoute>} />
              <Route path="/DepMetrics" element={<PrivateRoute allowedRoles={['admin', 'manager']} > <DepMetrics /> </PrivateRoute>} />
              <Route path="/People" element={<PrivateRoute allowedRoles={['admin', 'manager']} > <People /> </PrivateRoute>} />
              <Route path="/EvaluationComponent" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']} > <EvaluationComponent /> </PrivateRoute>} />
              <Route path="/Eval/:id" element={<PrivateRoute allowedRoles={['admin', 'manager']} > <Eval /> </PrivateRoute>} />
              <Route path="/View/:id" element={<PrivateRoute allowedRoles={['admin', 'manager', 'employee']} > <ViewComponent /> </PrivateRoute>} />
              <Route path="/Add" element={<PrivateRoute allowedRoles={['admin']} > <AddUser /> </PrivateRoute>} />
              <Route path="/EditUser/:id" element={<PrivateRoute allowedRoles={['admin']} > <EditUser /> </PrivateRoute>} />
              <Route path='/AddDepartment' element={<PrivateRoute allowedRoles={['admin']} > <AddDepartment /> </PrivateRoute>} />
              {/* Редирект на страницу логина для несуществующих маршрутов */}
              <Route path="*" element={<Navigate to="/Login" />} />
            </Routes>
        </div>
        {/* Conditionally render the RightPanel if it should be displayed */}
        {displayRightPanel && RightPanelComponent && (
          <div className="col-2">
            {RightPanelComponent}
          </div>
        )}
      </main>

      {/* Footer section */}
      {displayHeaderFooter && FooterComponent && (
        <>
          <div className='py-5' />
          <Footer />
        </>
      )}
    </>
  );
};

// App component wraps everything with HelmetProvider for managing head elements
// Router for handling routing within the application.
function App() {
  return (
    <HelmetProvider>
      <Router>
        <Layout />
      </Router>
    </HelmetProvider>
  );
}

export default App;