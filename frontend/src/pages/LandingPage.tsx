import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Wand2, Code2, Rocket, ArrowRight } from 'lucide-react';
import axios from "axios"
import { BACKEND_URL } from '../config';

const LandingPage = () => {
  const [prompt, setPrompt] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (prompt.trim()) {
      navigate('/builder', { state: { prompt } });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
      <div className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto text-center"
        >
          <h1 className="text-6xl font-bold text-white mb-6">
            Lightening
          </h1>
          <p className="text-xl text-gray-300 mb-12">
            Transform your ideas into reality with lightening speed
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50"
            >
              <div className="flex justify-center mb-4">
                <Wand2 className="w-12 h-12 text-purple-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Magic Prompts</h3>
              <p className="text-gray-400">
                Describe your website in plain English
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50"
            >
              <div className="flex justify-center mb-4">
                <Code2 className="w-12 h-12 text-blue-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Smart Generation</h3>
              <p className="text-gray-400">
                Get production-ready code instantly
              </p>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.05 }}
              className="p-6 bg-gray-800/50 backdrop-blur-sm rounded-xl shadow-lg border border-gray-700/50"
            >
              <div className="flex justify-center mb-4">
                <Rocket className="w-12 h-12 text-pink-400" />
              </div>
              <h3 className="text-xl font-semibold mb-2 text-white">Quick Deploy</h3>
              <p className="text-gray-400">
                Launch your website in minutes
              </p>
            </motion.div>
          </div>

          <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
            <div className="relative flex items-center">
              <input
                type="text"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="Describe your dream website..."
                className="w-full px-6 py-4 text-lg rounded-full bg-gray-800/50 backdrop-blur-sm border-2 border-purple-500/30 focus:border-purple-500 focus:ring focus:ring-purple-500/20 focus:ring-opacity-50 shadow-lg text-white placeholder-gray-400"
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                className="absolute right-2 flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full font-semibold hover:from-purple-700 hover:to-pink-700 transition-all duration-200 group"
              >
                Create
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </div>
          </form>
        </motion.div>
      </div>
    </div>
  );
};

export default LandingPage;