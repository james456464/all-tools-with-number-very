import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Mail, 
  Copy, 
  Shuffle, 
  Type, 
  Key, 
  Shield, 
  ArrowRight,
  CheckCircle
} from 'lucide-react';
import { useSecurity } from '../contexts/SecurityContext';

const HomePage: React.FC = () => {
  const { logout } = useSecurity();

  const tools = [
    {
      id: 'email-extractor',
      title: 'Email Extractor',
      description: 'Extract and validate email addresses from any text with advanced filtering options.',
      icon: Mail,
      color: 'from-blue-500 to-blue-600',
      hoverColor: 'hover:from-blue-600 hover:to-blue-700',
      path: '/email-extractor',
      features: ['Bulk extraction', 'Domain filtering', 'Export to Excel/TXT']
    },
    {
      id: 'duplicate-remover',
      title: 'Duplicate Remover',
      description: 'Remove duplicate lines and organize your data with intelligent sorting algorithms.',
      icon: Copy,
      color: 'from-purple-500 to-purple-600',
      hoverColor: 'hover:from-purple-600 hover:to-purple-700',
      path: '/duplicate-remover',
      features: ['Smart deduplication', 'Alphabetical sorting', 'Statistics tracking']
    },
    {
      id: 'user-agent-mixer',
      title: 'User Agent Mixer',
      description: 'Mix and randomize user agents from different devices for testing purposes.',
      icon: Shuffle,
      color: 'from-green-500 to-green-600',
      hoverColor: 'hover:from-green-600 hover:to-green-700',
      path: '/user-agent-mixer',
      features: ['Device categorization', 'Random mixing', 'Bulk import/export']
    },
    {
      id: 'text-formatter',
      title: 'Text Formatter',
      description: 'Format, clean, and transform text with multiple formatting options.',
      icon: Type,
      color: 'from-orange-500 to-orange-600',
      hoverColor: 'hover:from-orange-600 hover:to-orange-700',
      path: '/text-formatter',
      features: ['Case conversion', 'Text cleaning', 'Format validation']
    },
    {
      id: 'password-generator',
      title: 'Password Generator',
      description: 'Generate secure passwords with customizable length and character sets.',
      icon: Key,
      color: 'from-red-500 to-red-600',
      hoverColor: 'hover:from-red-600 hover:to-red-700',
      path: '/password-generator',
      features: ['Customizable length', 'Character options', 'Strength meter']
    }
  ];

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-lg border-b border-white/20 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  DevTools Pro
                </h1>
                <p className="text-xs text-gray-500">Professional Utilities</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={logout}
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tools Grid */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Powerful Tools at Your Fingertips
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose from our collection of professional-grade tools designed to streamline your workflow
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {tools.map((tool) => (
              <Link
                key={tool.id}
                to={tool.path}
                className="group relative bg-white/80 backdrop-blur-lg rounded-2xl p-8 shadow-xl border border-white/20 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/50 to-white/20 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <div className="relative">
                  <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r ${tool.color} rounded-xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <tool.icon className="w-8 h-8 text-white" />
                  </div>
                  
                  <h3 className="text-2xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                    {tool.title}
                  </h3>
                  
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {tool.description}
                  </p>
                  
                  <div className="space-y-2 mb-6">
                    {tool.features.map((feature, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        <span className="text-sm text-gray-600">{feature}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${tool.color} text-white`}>
                      Professional
                    </span>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all duration-300" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;