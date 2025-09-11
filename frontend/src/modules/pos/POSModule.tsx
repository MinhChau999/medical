import { Routes, Route } from 'react-router-dom';
import POSDashboard from './pages/POSDashboard';
import POSSales from './pages/POSSales';
import POSProducts from './pages/POSProducts';
import POSReports from './pages/POSReports';

export default function POSModule() {
  return (
    <Routes>
      <Route path="/" element={<POSDashboard />} />
      <Route path="/sales" element={<POSSales />} />
      <Route path="/products" element={<POSProducts />} />
      <Route path="/reports" element={<POSReports />} />
    </Routes>
  );
}