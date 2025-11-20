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
      color: 'bg-primary',
      features: ['Object Detection', 'Color Analysis', 'Text Extraction', 'Batch Processing']
    },
    {
      title: 'Smart Data Generator',
      description: 'Create custom data tables by defining horizontal and vertical headers. AI generates realistic data for each intersection.',
      icon: Table,
      link: '/data-generator',
      color: 'bg-chart-2',
      features: ['Custom Headers', 'AI Generation', 'Export Options', 'Templates']
    },
    {
      title: 'API Endpoint Mapper',
      description: 'Connect two API endpoints with intelligent data mapping and transformation capabilities.',
      icon: GitBranch,
      link: '/api-mapper',
      color: 'bg-chart-3',
      features: ['Endpoint Testing', 'Data Mapping', 'Transformations', 'Real-time Validation']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="text-center py-20">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center mb-6">
            <Sparkles aria-hidden="true" className="h-12 w-12 text-primary mr-4" />
            <h1 className="text-5xl md:text-6xl font-bold text-foreground">
              AI Power Tools
            </h1>
          </div>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Harness the power of artificial intelligence with three specialized tools for image analysis, 
            data generation, and API integration. Transform your workflow with intelligent automation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/image-extraction"
              className="inline-flex items-center px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary transition-colors"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              to="/data-generator"
              className="inline-flex items-center px-6 py-3 border border-border text-foreground font-medium rounded-lg hover:bg-muted transition-colors"
            >
              Explore Tools
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-foreground mb-12">
            Powerful AI Tools at Your Fingertips
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="bg-card rounded-xl shadow-lg hover:shadow-xl transition-shadow p-8 border border-border"
                >
                  <div className={`${feature.color} w-16 h-16 rounded-lg flex items-center justify-center mb-6`}>
                    <Icon aria-hidden="true" className="h-8 w-8 text-primary-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {feature.description}
                  </p>
                  <ul className="space-y-2 mb-8">
                    {feature.features.map((item, idx) => (
                      <li key={idx} className="flex items-center text-sm text-muted-foreground">
                        <Zap aria-hidden="true" className="h-4 w-4 text-primary mr-2" />
                        {item}
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={feature.link}
                    className="inline-flex items-center text-primary hover:text-primary font-medium"
                  >
                    Try it now
                    <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-muted">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-foreground mb-8">
            Trusted by Developers Worldwide
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary mb-2">50K+</div>
              <div className="text-muted-foreground">Images Analyzed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-2 mb-2">10K+</div>
              <div className="text-muted-foreground">Data Sets Generated</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-chart-3 mb-2">5K+</div>
              <div className="text-muted-foreground">API Connections</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-foreground mb-2">99.9%</div>
              <div className="text-muted-foreground">Uptime</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;