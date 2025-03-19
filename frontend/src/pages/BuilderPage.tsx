import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileIcon, FolderIcon, ChevronRight, Terminal, ChevronDown, Code, Eye, CheckCircle2, Circle, Timer } from 'lucide-react';
import Editor from "@monaco-editor/react";
import { BACKEND_URL } from '../config';
import axios from 'axios';
import { FileItem, MockStep, StepType } from '../types';
import { parseXml } from '../steps';
import { useWebContainer } from '../hooks/useWebContainer';
import { FileNode } from '@webcontainer/api';

const BuilderPage = () => {
  const location = useLocation();
  const { prompt } = location.state || {};
  const webcontainer = useWebContainer();
  const [llmMessages, setLlmMessages] = useState<{role: "user" | "assistant", content: string;}[]>([]);
  const [loading, setLoading] = useState(false);
  const [templateSet, setTemplateSet] = useState(false);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['src']));
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'code' | 'preview'>('code');

  const [mockSteps, setMockSteps] = useState<MockStep[]>([]); 

  const [files, setFiles] = useState<FileItem[]>([]);

  useEffect(() => {
    let originalFiles = [...files];
    let updateHappened = false;
    mockSteps.filter(({status}) => status === "pending").map(step => {
      updateHappened = true;
      if (step?.type === StepType.CreateFile) {
        let parsedPath = step.path?.split("/") ?? []; // ["src", "components", "App.tsx"]
        let currentFileStructure = [...originalFiles]; // {}
        let finalAnswerRef = currentFileStructure;
  
        let currentFolder = ""
        while(parsedPath.length) {
          currentFolder =  `${currentFolder}/${parsedPath[0]}`;
          let currentFolderName = parsedPath[0];
          parsedPath = parsedPath.slice(1);

          if (!parsedPath.length) {
            // final file
            let file = currentFileStructure.find(x => x.path === currentFolder)
            if (!file) {
              currentFileStructure.push({
                name: currentFolderName,
                type: 'file',
                path: currentFolder,
                content: step.code
              })
            } else {
              file.content = step.code;
            }
          } else {
            /// in a folder
            let folder = currentFileStructure.find(x => x.path === currentFolder)
            if (!folder) {
              // create the folder
              currentFileStructure.push({
                name: currentFolderName,
                type: 'folder',
                path: currentFolder,
                children: []
              })
            }

            currentFileStructure = currentFileStructure.find(x => x.path === currentFolder)!.children!;
          }
        }
        originalFiles = finalAnswerRef;
      }

    })

    if (updateHappened) {

      setFiles(originalFiles)
      setMockSteps(mockSteps => mockSteps.map((s: MockStep) => {
        return {
          ...s,
          status: "completed"
        }
        
      }))
    }
    console.log(files);
  }, [mockSteps, files]);

  useEffect(() => {
    const createMountStructure = (files: FileItem[]): Record<string, any> => {
      const mountStructure: Record<string, any> = {};
  
      const processFile = (file: FileItem, isRootFolder: boolean) => {  
        if (file.type === 'folder') {
          // For folders, create a directory entry
          mountStructure[file.name] = {
            directory: file.children ? 
              Object.fromEntries(
                file.children.map(child => [child.name, processFile(child, false)])
              ) 
              : {}
          };
        } else if (file.type === 'file') {
          if (isRootFolder) {
            mountStructure[file.name] = {
              file: {
                contents: file.content || ''
              }
            };
          } else {
            // For files, create a file entry with contents
            return {
              file: {
                contents: file.content || ''
              }
            };
          }
        }
        
        return mountStructure[file.name];
      };
  
      // Process each top-level file/folder
      files.forEach(file => processFile(file, true));
  
      return mountStructure;
    };
  
    const mountStructure = createMountStructure(files);
  
    // Mount the structure if WebContainer is available
    console.log(mountStructure);
    webcontainer?.mount(mountStructure);
  }, [files, webcontainer]);

  async function init() {
    const response = await axios.post(`${BACKEND_URL}/template`, {
      prompt: prompt.trim()
    });
    setTemplateSet(true);
    
    const {prompts, uiPrompts} = response.data;

    setMockSteps(parseXml(uiPrompts[0]).map((x: MockStep) => ({
      ...x,
      status: "pending"
    })));

    setLoading(true);
    const stepsResponse = await axios.post(`${BACKEND_URL}/chat`, {
      messages: [...prompts, prompt].map(content => ({
        role: "user",
        content
      }))
    })

    setLoading(false);

    setMockSteps(s => [...s, ...parseXml(stepsResponse.data.response).map(x => ({
      ...x,
      status: "pending" as "pending"
    }))]);

    setLlmMessages([...prompts, prompt].map(content => ({
      role: "user",
      content
    })));

    setLlmMessages(x => [...x, {role: "assistant", content: stepsResponse.data.response}])
  }

  useEffect(() => {
    init();
  }, [])

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
    const findFile = (items: FileItem[]): FileItem | undefined => {
      for (const item of items) {
        if (item.path === path) {
          return item;
        }
        if (item.type === 'folder' && item.children) {
          const found = findFile(item.children);
          if (found) return found;
        }
      }
      return undefined;
    };

    const file = findFile(files);
    return file?.content || '';
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

  const renderFileTree = (structure: FileItem[]) => {
    return structure.map((item) => {
      const fullPath = item.path;
      const isDirectory = item.type === 'folder';
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
            <span className="text-gray-300">{item.name}</span>
          </div>
          {isDirectory && isExpanded && item.children && (
            <div className="ml-4">
              {renderFileTree(item.children)}
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
            {renderFileTree(files)}
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