import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Image, 
  Table, 
  GitBranch, 
  ArrowRight,
  Sparkles,
  Upload,
  Database,
  Zap
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      title: 'AI Image Metadata Extraction',
      description: 'Upload multiple images and let AI extract detailed metadata including objects, colors, text, and visual information.',
      icon: Image,
      link: '/image-extraction',
      color: 'bg-purple-500',
      features: ['Object Detection', 'Color Analysis', 'Text Extraction', 'Batch Processing']
    },
    {
      title: 'Smart Data Generator',
      description: 'Create custom data tables by defining horizontal and vertical headers. AI generates realistic data for each intersection.',
      icon: Table,
      link: '/data-generator',
      color: 'bg-teal-500',
      features: ['Custom Headers', 'AI Generation', 'Export Options', 'Templates']
    },
    {
      title: 'API Endpoint Mapper',
      description: 'Connect two API endpoints with intelligent data mapping and transformation capabilities.',
      icon: GitBranch,
      link: '/api-mapper',
      color: 'bg-orange-500',
      features: ['Endpoint Testing', 'Data Mapping', 'Transformations', 'Real-time Validation']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Sparkles className="h-12 w-12 text-purple-600 mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900">
              AI Power Tools
            </h1>
          </div>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Harness the power of artificial intelligence with three specialized tools for image analysis, 
            data generation, and API integration. Transform your workflow with intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/image-extraction"
              className="inline-flex items-center px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
            <Link
              to="/data-generator"
              className="inline-flex items-center px-6 py-3 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 transition-colors"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Powerful AI Tools at Your Fingertips
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-gray-100"
                >
                  <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 mb-8">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-gray-600">
                        <Zap className="h-4 w-4 text-purple-500 mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={feature.link}
                    className="inline-flex items-center text-purple-600 hover:text-purple-700 font-medium"
                  >
                    Try it now
                    <ArrowRight className="ml-1 h-4 w-4" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gray-100">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-8">
            Trusted by Developers Worldwide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
              <div className="text-gray-600">Images Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-600 mb-2">10K+</div>
              <div className="text-gray-600">Data Sets Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600 mb-2">5K+</div>
              <div className="text-gray-600">API Connections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-900 mb-2">99.9%</div>
              <div className="text-gray-600">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;