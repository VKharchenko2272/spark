import React from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { HelmetProvider, Helmet } from 'react-helmet-async'; //import HelmetProvider due to last updates as Helmet outdated
import './css/style.css';
import './css/reset.css';
import Home from './Components/Home';
import Header from './Components/Header/';
import Footer from './Components/Footer';
import NavMenu from './Components/NavMenu';
import PageHome from './Components/RightPanel/PageHome';
import PageDepDashboard from './Components/RightPanel/PageDepDashboard';
import DepMetrics from './Components/DepMetrics';
import People from './Components/People';
import Login from './Components/Login';
import LineChart from './Components/Charts/LineChart';
import EvalOverlook from './Components/EvalOverlook';


// Layout component defines the structure of the page with Header, Footer, and dynamic content based on routes.
const Layout = () => {
  // useLocation hook gives the current route location, which can be used to determine the active route.
  const location = useLocation();

  // Object mapping routes to their corresponding RightPanel components.
  const rightPanelComponents = {
    '/': <PageHome />,
    '/DepMetrics': <PageDepDashboard />
  };
  const leftPanelComponents = {
    '/': <NavMenu />
  }
  const headerComponent = {
    '/Header': <Header />
  };
  const footerComponent = {
    '/Footer': <Footer />
  };
  // Array of routes where the RightPanel should not be displayed.
  const notApplyPages = ['/People', '/Login', '/EvalOverlook'];
  const notApplyLeftMenu = ['/Login'];
  const notApplyHeaderAndFooter = ['/Login'];
  // Determine the RightPanel component to display based on the current route.
  // If no specific component is found, default to PageHome.
  const RightPanelComponent = rightPanelComponents[location.pathname] || <PageHome />;
  const LeftPanelComponent = leftPanelComponents[location.pathname] || <NavMenu />;
  const HeaderComponent = headerComponent[location.pathname] || <Header />
  const FooterComponent = footerComponent[location.pathname] || <Footer />
  // Check if the current route is in the list of routes where RightPanel should not be displayed.
  const displayRightPanel = !notApplyPages.includes(location.pathname);
  const displayLeftPanel = !notApplyLeftMenu.includes(location.pathname);
  const displayHeaderFooter = !notApplyHeaderAndFooter.includes(location.pathname);



  return (
    <>
      {/* Header section */}
      {HeaderComponent && displayHeaderFooter && (
        <div className="header">
          <Header />
          {/* Helmet is used for managing the document head, like setting the page title dynamically */}
          <Helmet className="helmet">
          </Helmet>
        </div>
      )}
      {/* Main wrapper for the content and navigation */}
      <div className="wrapper">
        {/* Navigation Menu */}
        {displayLeftPanel && LeftPanelComponent && (
          <div className="nav-menu">
            <NavMenu />
          </div>
        )}
        {/* Main content area that changes based on the active route */}
        <div className={`container ${displayRightPanel ? '' : 'full-width'}`}>
          <Routes>
            {/* Define routes and their corresponding components */}
            <Route path='/Charts/LineChart' element={<LineChart />} />
            <Route path="/Login" element={<Login />} />
            <Route path="/" element={<Home />} />
            <Route path="/DepMetrics" element={<DepMetrics />} />
            <Route path="/People" element={<People />} />
            <Route path="/EvalOverlook" element={<EvalOverlook />} />
          </Routes>
        </div>

        {/* Conditionally render the RightPanel if it should be displayed */}
        {displayRightPanel && RightPanelComponent && (
          <div className="right-panel">
            {RightPanelComponent}
          </div>
        )}
      </div>

      {/* Footer section */}
      {displayHeaderFooter && FooterComponent && (
        <div className="footer">
          <Footer />
        </div>
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
