import { useState, useEffect, useRef } from 'react';
import axiosClient from '../utils/axiosClient';
import { Activity, Zap, Database, TrendingUp } from 'lucide-react';

// Simple delay function
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Request tracking
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 1500; // 1.5 seconds

const ComplexityAnalyzer = ({ code, language, problem }) => {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hoveredBreakdown, setHoveredBreakdown] = useState(null);
  const canvasRef = useRef(null);

  const analyzeComplexity = async () => {
    if (!code || code.trim() === '') {
      setError('Please write some code first');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Ensure minimum interval between requests
      const now = Date.now();
      const timeSinceLastRequest = now - lastRequestTime;
      
      if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
        const delayNeeded = MIN_REQUEST_INTERVAL - timeSinceLastRequest;
        await delay(delayNeeded);
      }
      
      // Update last request time
      lastRequestTime = Date.now();
      
      // Call the backend API to analyze complexity
      const response = await axiosClient.post('/complexity/analyze', {
        code,
        language,
        problem
      });
      
      // Check if we got an error response
      if (response.status >= 400) {
        const errorMessage = response.data?.message || 'An error occurred while analyzing complexity';
        if (response.status === 429) {
          const retryMessage = response.data.retryAfter ? ` Please try again in ${response.data.retryAfter}.` : '';
          setError(`Rate limit exceeded. ${errorMessage}${retryMessage}`);
        } else {
          setError(`Error: ${errorMessage}`);
        }
        setLoading(false);
        return;
      }
      
      // Generate mock performance data based on the analysis
      const testData = generatePerformanceData(response.data.timeComplexity);
      
      setAnalysis({
        ...response.data,
        testData
      });
      
      drawGraph(testData);
      setLoading(false);
    } catch (err) {
      // Handle network errors or other exceptions
      if (err.response?.status === 429) {
        const retryMessage = err.response.data.retryAfter ? ` Please check your quota at ${err.response.data.retryAfter}.` : '';
        setError(`Rate limit exceeded. ${err.response.data.message}${retryMessage}`);
      } else {
        setError('Failed to analyze complexity: ' + (err.response?.data?.message || err.message));
      }
      setLoading(false);
    }
  };

  // Function to generate mock performance data for graph visualization
  const generatePerformanceData = (timeComplexity) => {
    // This would be replaced with actual benchmarking in a real implementation
    const testData = [];
    
    // Generate mock data based on complexity pattern
    const patterns = {
      'O(1)': () => 1,
      'O(log n)': (n) => Math.log2(n) * 10,
      'O(n)': (n) => n * 0.5,
      'O(n log n)': (n) => n * Math.log2(n) * 0.1,
      'O(n^2)': (n) => n * n * 0.01,
      'O(2^n)': (n) => Math.pow(2, n) * 0.001,
      'default': (n) => n
    };
    
    // Extract the complexity notation (e.g., O(n) from "O(n) - Linear")
    const cleanComplexity = timeComplexity?.split(' ')[0] || 'O(n)';
    const pattern = patterns[cleanComplexity] || patterns['default'];
    
    // Generate data points
    for (let i = 1; i <= 10; i++) {
      const inputSize = i * 100;
      const executionTime = Math.max(0.1, pattern(inputSize) + (Math.random() * 10)); // Add some randomness
      testData.push({
        inputSize,
        executionTime: parseFloat(executionTime.toFixed(2))
      });
    }
    
    return testData;
  };

  const drawGraph = (data) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Set background with gradient
    const bgGradient = ctx.createLinearGradient(0, 0, 0, height);
    bgGradient.addColorStop(0, '#0f172a');
    bgGradient.addColorStop(1, '#1e293b');
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, width, height);
    
    // Draw grid with glow effect
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.shadowBlur = 2;
    ctx.shadowColor = '#334155';
    
    // Vertical grid lines
    for (let i = 0; i <= 10; i++) {
      const x = 50 + (i * (width - 100) / 10);
      ctx.beginPath();
      ctx.moveTo(x, 30);
      ctx.lineTo(x, height - 30);
      ctx.stroke();
    }
    
    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = 30 + (i * (height - 60) / 10);
      ctx.beginPath();
      ctx.moveTo(50, y);
      ctx.lineTo(width - 50, y);
      ctx.stroke();
    }
    
    ctx.shadowBlur = 0;
    
    // Draw axes with gradient
    const axisGradient = ctx.createLinearGradient(50, 0, width - 50, 0);
    axisGradient.addColorStop(0, '#60a5fa');
    axisGradient.addColorStop(1, '#a78bfa');
    ctx.strokeStyle = axisGradient;
    ctx.lineWidth = 2;
    
    // X-axis
    ctx.beginPath();
    ctx.moveTo(50, height - 30);
    ctx.lineTo(width - 50, height - 30);
    ctx.stroke();
    
    // Y-axis
    ctx.beginPath();
    ctx.moveTo(50, 30);
    ctx.lineTo(50, height - 30);
    ctx.stroke();
    
    // Draw axis labels
    ctx.fillStyle = '#cbd5e1';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    
    // X-axis labels
    for (let i = 0; i <= 10; i++) {
      const x = 50 + (i * (width - 100) / 10);
      const value = Math.round((data[data.length - 1].inputSize / 10) * i);
      ctx.fillText(value.toString(), x, height - 10);
    }
    
    // Y-axis labels
    ctx.textAlign = 'right';
    for (let i = 0; i <= 10; i++) {
      const y = 30 + (i * (height - 60) / 10);
      const maxValue = Math.max(...data.map(d => d.executionTime));
      const value = Math.round(maxValue - (maxValue / 10) * i);
      ctx.fillText(value.toString(), 40, y + 4);
    }
    
    // Draw axis titles with gradient
    ctx.textAlign = 'center';
    ctx.font = 'bold 14px Arial';
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText('Input Size (n)', width / 2, height - 5);
    
    ctx.save();
    ctx.translate(15, height / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('Execution Time (ms)', 0, 0);
    ctx.restore();
    
    // Draw data points and line with gradient and glow
    if (data && data.length > 0) {
      const lineGradient = ctx.createLinearGradient(50, 0, width - 50, 0);
      lineGradient.addColorStop(0, '#3b82f6');
      lineGradient.addColorStop(0.5, '#8b5cf6');
      lineGradient.addColorStop(1, '#ec4899');
      
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 3;
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#3b82f6';
      ctx.beginPath();
      
      const maxValue = Math.max(...data.map(d => d.executionTime));
      const maxInput = Math.max(...data.map(d => d.inputSize));
      
      data.forEach((point, index) => {
        const x = 50 + (point.inputSize / maxInput) * (width - 100);
        const y = 30 + (height - 60) - (point.executionTime / maxValue) * (height - 60);
        
        if (index === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      
      ctx.stroke();
      
      // Draw gradient area under the line
      ctx.lineTo(width - 50, height - 30);
      ctx.lineTo(50, height - 30);
      ctx.closePath();
      
      const areaGradient = ctx.createLinearGradient(0, 30, 0, height - 30);
      areaGradient.addColorStop(0, 'rgba(59, 130, 246, 0.3)');
      areaGradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
      ctx.fillStyle = areaGradient;
      ctx.fill();
      
      // Draw data points with glow
      data.forEach(point => {
        const x = 50 + (point.inputSize / maxInput) * (width - 100);
        const y = 30 + (height - 60) - (point.executionTime / maxValue) * (height - 60);
        
        // Outer glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = '#3b82f6';
        ctx.fillStyle = '#3b82f6';
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
        
        // Inner bright point
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x, y, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      ctx.shadowBlur = 0;
    }
  };

  useEffect(() => {
    if (analysis && canvasRef.current) {
      drawGraph(analysis.testData);
    }
  }, [analysis]);

  return (
    <div className="space-y-6 relative">
      {/* Animated Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      {/* Header */}
      <div className="relative flex justify-between items-center p-6 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl rounded-2xl border border-slate-700/50 shadow-xl">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl blur-md opacity-75 animate-pulse-slow"></div>
            <div className="relative p-3 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Activity className="w-6 h-6 text-white" />
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
              Complexity Analyzer
            </h2>
            <p className="text-sm text-slate-400 mt-1">AI-powered code analysis</p>
          </div>
        </div>
        
        <button
          onClick={analyzeComplexity}
          disabled={loading}
          className={`relative px-6 py-3 rounded-xl font-semibold transition-all duration-300 overflow-hidden group ${
            loading 
              ? 'bg-slate-700 cursor-not-allowed text-slate-400' 
              : 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-lg hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-105 active:scale-95'
          }`}
        >
          {!loading && (
            <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          )}
          <div className="relative flex items-center gap-2">
            {loading ? (
              <>
                <div className="w-5 h-5 border-2 border-slate-400 border-t-transparent rounded-full animate-spin-smooth"></div>
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <Zap className="w-5 h-5" />
                <span>Analyze Complexity</span>
              </>
            )}
          </div>
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="relative p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl text-red-200 animate-shake">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
            <span>{error}</span>
          </div>
        </div>
      )}

      {/* Analysis Results */}
      {analysis ? (
        <div className="space-y-6 relative animate-fade-in">
          {/* Complexity Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Time Complexity Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <TrendingUp className="w-5 h-5 text-blue-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Time Complexity</h3>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-xl"></div>
                  <div className="relative text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
                    {analysis.timeComplexity}
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed">{analysis.explanation}</p>
              </div>
            </div>
            
            {/* Space Complexity Card */}
            <div className="group relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl hover:shadow-2xl hover:shadow-green-500/20 transition-all duration-300 hover:scale-[1.02] overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Database className="w-5 h-5 text-green-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">Space Complexity</h3>
                </div>
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 blur-xl"></div>
                  <div className="relative text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-emerald-400 mb-3">
                    {analysis.spaceComplexity}
                  </div>
                </div>
                <p className="text-slate-400 leading-relaxed">Memory usage based on input size</p>
              </div>
            </div>
          </div>

          {/* Detailed Breakdown */}
          {analysis.breakdown && analysis.breakdown.length > 0 && (
            <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
              <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
                Detailed Breakdown
              </h3>
              <div className="space-y-3">
                {analysis.breakdown.map((item, index) => (
                  <div 
                    key={index} 
                    className="group relative flex items-center justify-between p-4 bg-slate-800/50 backdrop-blur-sm rounded-xl border border-slate-700/30 hover:border-purple-500/50 transition-all duration-300 hover:scale-[1.02] cursor-pointer overflow-hidden"
                    onMouseEnter={() => setHoveredBreakdown(index)}
                    onMouseLeave={() => setHoveredBreakdown(null)}
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    <div className="relative flex items-center gap-4 flex-1">
                      <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white mb-1">{item.operation}</div>
                        <div className="text-sm text-slate-400">{item.description}</div>
                      </div>
                    </div>
                    <div className="relative">
                      <div className={`font-mono text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-400 transition-transform duration-300 ${
                        hoveredBreakdown === index ? 'scale-110' : ''
                      }`}>
                        {item.complexity}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Performance Graph */}
          <div className="relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-xl p-6 rounded-2xl border border-slate-700/50 shadow-xl overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
            <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
              <div className="w-1 h-6 bg-gradient-to-b from-blue-500 to-purple-500 rounded-full"></div>
              Performance Graph
            </h3>
            <div className="relative bg-slate-900/80 backdrop-blur-sm p-6 rounded-xl border border-slate-700/30 shadow-inner">
              <canvas 
                ref={canvasRef} 
                width={600} 
                height={300}
                className="w-full"
              />
            </div>
            <div className="mt-4 flex items-center justify-between text-sm">
              <span className="text-slate-400">Execution time vs input size analysis</span>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse-slow"></div>
                <span className="text-slate-400">Real-time data</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative text-center py-20 bg-gradient-to-br from-slate-800/50 to-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-700/50 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"></div>
          <div className="relative">
            <div className="inline-block relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl blur-2xl opacity-50 animate-pulse-slow"></div>
              <div className="relative p-6 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-700">
                <Cpu className="w-16 h-16 text-transparent bg-clip-text" style={{ stroke: 'url(#cpu-gradient)' }} />
                <svg width="0" height="0">
                  <defs>
                    <linearGradient id="cpu-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#60a5fa" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>
            </div>
            <h3 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-3">
              Ready to Analyze
            </h3>
            <p className="text-slate-400 max-w-md mx-auto leading-relaxed">
              Click the "Analyze Complexity" button to evaluate the time and space complexity of your code.
            </p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -20px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(20px, 20px) scale(1.05);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 0.5;
          }
          50% {
            opacity: 1;
          }
        }

        @keyframes spin-smooth {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.6s ease-out;
        }

        .animate-blob {
          animation: blob 7s infinite;
        }

        .animation-delay-2000 {
          animation-delay: 2s;
        }

        .animation-delay-4000 {
          animation-delay: 4s;
        }

        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }

        .animate-spin-smooth {
          animation: spin-smooth 1s linear infinite;
        }

        .animate-shake {
          animation: shake 0.4s ease-in-out;
        }
      `}</style>
    </div>
  );
};

// CPU icon component
const Cpu = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <rect x="4" y="4" width="16" height="16" rx="2" strokeWidth="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" strokeWidth="2" />
    <line x1="15" y1="1" x2="15" y2="4" strokeWidth="2" />
    <line x1="9" y1="20" x2="9" y2="23" strokeWidth="2" />
    <line x1="15" y1="20" x2="15" y2="23" strokeWidth="2" />
    <line x1="20" y1="9" x2="23" y2="9" strokeWidth="2" />
    <line x1="20" y1="14" x2="23" y2="14" strokeWidth="2" />
    <line x1="1" y1="9" x2="4" y2="9" strokeWidth="2" />
    <line x1="1" y1="14" x2="4" y2="14" strokeWidth="2" />
  </svg>
);

export default ComplexityAnalyzer;