import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Platform from './pages/Platform';
import DecisionEngine from './pages/DecisionEngine';
import Templates from './pages/Templates';
import ApiDocs from './pages/ApiDocs';
import OpExGuide from './pages/OpExGuide';
import DeveloperDocs from './pages/DeveloperDocs';
import Pricing from './pages/Pricing';
import './index.css';

function App() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div style={{ flex: '1 0 auto' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/platform" element={<Platform />} />
          <Route path="/decision-engineering" element={<DecisionEngine />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/api-docs" element={<ApiDocs />} />
          <Route path="/opex" element={<OpExGuide />} />
          <Route path="/developers" element={<DeveloperDocs />} />
          <Route path="/pricing" element={<Pricing />} />
        </Routes>
      </div>
      <Footer />
    </div>
  );
}

export default App;
