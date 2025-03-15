import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileIcon, FolderIcon, ChevronRight, Terminal, ChevronDown, Code, Eye, CheckCircle2, Circle, Timer } from 'lucide-react';
import Editor from "@monaco-editor/react";

const BuilderPage = () => {
  const location = useLocation();
  const { prompt } = location.state || {};
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const mockSteps = [
    { id: 1, title: 'Initialize Project', status: 'completed' },
    { id: 2, title: 'Install Dependencies', status: 'in-progress' },
    { id: 3, title: 'Generate Components', status: 'pending' },
    { id: 4, title: 'Setup Routing', status: 'pending' },
    { id: 5, title: 'Add Styling', status: 'pending' },
  ];

  const mockFiles = {
    src: {
      components: {
        'Header.tsx': 'export const Header = () => {\n  return <header>Header Component</header>;\n};',
        'Footer.tsx': 'export const Footer = () => {\n  return <footer>Footer Component</footer>;\n};',
      },
      pages: {
        'Home.tsx': 'export const Home = () => {\n  return <div>Home Page</div>;\n};',
        'About.tsx': 'export const About = () => {\n  return <div>About Page</div>;\n};',
      },
      'App.tsx': 'import React from "react";\n\nexport const App = () => {\n  return <div>App Component</div>;\n};',
      'index.tsx': 'import React from "react";\nimport ReactDOM from "react-dom";\nimport { App } from "./App";\n\nReactDOM.render(<App />, document.getElementById("root"));',
    },
    'package.json': '{\n  "name": "my-app",\n  "version": "1.0.0"\n}',
    'tsconfig.json': '{\n  "compilerOptions": {\n    "jsx": "react"\n  }\n}',
  };

  const toggleFolder = (path: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const getFileContent = (path: string): string => {
    const parts = path.split('/');
    let current: any = mockFiles;
    for (const part of parts) {
      current = current[part];
    }
    return typeof current === 'string' ? current : JSON.stringify(current, null, 2);
  };

  const getFileLanguage = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'ts':
      case 'tsx':
        return 'typescript';
      case 'js':
      case 'jsx':
        return 'javascript';
      case 'json':
        return 'json';
      case 'css':
        return 'css';
      case 'html':
        return 'html';
      default:
        return 'plaintext';
    }
  };

  const getStepIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      case 'in-progress':
        return <Timer className="w-5 h-5 text-blue-400 animate-pulse" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const renderFileTree = (structure: any, path = '') => {
    return Object.entries(structure).map(([key, value]) => {
      const fullPath = path ? `${path}/${key}` : key;
      const isDirectory = typeof value === 'object';
      const isExpanded = expandedFolders.has(fullPath);

      return (
        <div key={fullPath}>
          <div 
            className={`flex items-center py-1.5 px-2 rounded cursor-pointer hover:bg-gray-800 ${
              selectedFile === fullPath ? 'bg-gray-800' : ''
            }`}
            onClick={() => isDirectory ? toggleFolder(fullPath) : setSelectedFile(fullPath)}
          >
            <div className="w-4 h-4 mr-1">
              {isDirectory && (isExpanded ? <ChevronDown className="w-4 h-4 text-gray-400" /> : <ChevronRight className="w-4 h-4 text-gray-400" />)}
            </div>
            {isDirectory ? (
              <FolderIcon className="w-4 h-4 text-yellow-500 mr-2" />
            ) : (
              <FileIcon className="w-4 h-4 text-blue-400 mr-2" />
            )}
            <span className="text-gray-300">{key}</span>
          </div>
          {isDirectory && isExpanded && (
            <div className="ml-4">
              {renderFileTree(value, fullPath)}
            </div>
          )}
        </div>
      );
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex text-gray-300">
      {/* Steps Panel */}
      <motion.div
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-80 bg-gray-800/50 backdrop-blur-sm border-r border-gray-700/50 p-6"
      >
        <div className="flex items-center mb-6">
          <Terminal className="w-5 h-5 text-purple-400 mr-2" />
          <h2 className="text-xl font-semibold text-gray-200">Build Steps</h2>
        </div>
        <div className="space-y-4">
          {mockSteps.map((step) => (
            <div
              key={step.id}
              className={`flex items-center p-4 rounded-lg ${
                step.status === 'completed'
                  ? 'bg-green-900/20 text-green-400 border border-green-500/20'
                  : step.status === 'in-progress'
                  ? 'bg-blue-900/20 text-blue-400 border border-blue-500/20'
                  : 'bg-gray-800/50 text-gray-400 border border-gray-700/50'
              }`}
            >
              {getStepIcon(step.status)}
              <span className="ml-3">{step.title}</span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* File Explorer and Content */}
      <motion.div
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="flex-1 grid grid-cols-2 gap-6 p-6"
      >
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-6 border border-gray-700/50">
          <h2 className="text-xl font-semibold mb-6 text-gray-200">Project Files</h2>
          <div className="font-mono text-sm">
            {renderFileTree(mockFiles)}
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg overflow-hidden border border-gray-700/50">
          <div className="flex border-b border-gray-700/50">
            <button
              className={`flex items-center px-4 py-2 ${
                activeTab === 'code'
                  ? 'bg-gray-900/50 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('code')}
            >
              <Code className="w-4 h-4 mr-2" />
              Code
            </button>
            <button
              className={`flex items-center px-4 py-2 ${
                activeTab === 'preview'
                  ? 'bg-gray-900/50 text-white border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700/50'
              }`}
              onClick={() => setActiveTab('preview')}
            >
              <Eye className="w-4 h-4 mr-2" />
              Preview
            </button>
          </div>
          
          <div className="h-[calc(100%-42px)]">
            {activeTab === 'code' ? (
              selectedFile ? (
                <Editor
                  height="100%"
                  defaultLanguage={getFileLanguage(selectedFile)}
                  value={getFileContent(selectedFile)}
                  theme="vs-dark"
                  options={{
                    readOnly: true,
                    minimap: { enabled: false },
                    fontSize: 14,
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                  }}
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 italic">
                  Select a file to view its contents
                </div>
              )
            ) : (
              <iframe
                src="/"
                className="w-full h-full bg-white"
                title="Preview"
              />
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default BuilderPage;