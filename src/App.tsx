import React from 'react';
import { Analytics } from '@vercel/analytics/react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from './components/ui/toaster';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import ImageExtraction from './pages/ImageExtraction';
import DataGenerator from './pages/DataGenerator';
import ApiMapper from './pages/ApiMapper';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/image-extraction" element={<ImageExtraction />} />
            <Route path="/data-generator" element={<DataGenerator />} />
            <Route path="/api-mapper" element={<ApiMapper />} />
          </Routes>
        </main>
        <Toaster />
        <Analytics />
      </div>
    </Router>
  );
}

export default App;