import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { 
  Sun, Moon, Play, Send, Code2, FileText, Check, X, Clock, 
  Cpu, Trophy, Zap, Flame, Sparkles, ChevronRight, TrendingUp,
  AlertCircle, Loader2, CheckCircle, RotateCcw, BarChart3
} from 'lucide-react';
import axiosClient from '../utils/axiosClient';
import StreakBadgePopup from '../components/StreakBadgePopup';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const DailyChallengePage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [userStreak, setUserStreak] = useState({ 
    currentStreak: 0, 
    longestStreak: 0, 
    completedToday: false 
  });
  const [dayNumber, setDayNumber] = useState(1);
  const [showBadgePopup, setShowBadgePopup] = useState(false);
  const [isFloating, setIsFloating] = useState(false);
  const [particles, setParticles] = useState([]);
  const editorRef = useRef(null);
  const headerRef = useRef(null);

  useEffect(() => {
    fetchDailyChallenge();
    
    // Create floating particles
    const interval = setInterval(() => {
      if (darkMode && Math.random() > 0.7) {
        setParticles(prev => [
          ...prev.slice(-10),
          {
            id: Date.now(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 2 + 1,
            duration: Math.random() * 3000 + 2000
          }
        ]);
      }
    }, 500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    if (problem) {
      const initialCode = problem.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
    }
  }, [selectedLanguage, problem]);

  useEffect(() => {
    // Floating animation for streak badge
    const interval = setInterval(() => {
      setIsFloating(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  const fetchDailyChallenge = async () => {
    setLoading(true);
    try {
      const response = await axiosClient.get('/daily-challenge/today');
      setProblem(response.data.challenge);
      setDayNumber(response.data.dayNumber);
      setUserStreak(response.data.userStreak);
      
      const initialCode = response.data.challenge.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';
      setCode(initialCode);
      
      // Add success particles
      if (response.data.userStreak.completedToday) {
        createCelebrationParticles();
      }
      
      setLoading(false);
    } catch (error) {
      console.error('Error fetching daily challenge:', error);
      setLoading(false);
    }
  };

  const createCelebrationParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 30; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 1,
        duration: Math.random() * 1000 + 500,
        color: ['#f59e0b', '#10b981', '#3b82f6'][Math.floor(Math.random() * 3)]
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleEditorChange = (value) => {
    setCode(value || '');
  };

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor;
  };

  const handleLanguageChange = (language) => {
    setSelectedLanguage(language);
  };

  const handleRun = async () => {
    setLoading(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post('/daily-challenge/run', {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
      
      // Add particles for run
      if (response.data.success) {
        createSuccessParticles();
      }
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setLoading(false);
      setActiveRightTab('testcase');
    }
  };

  const createSuccessParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 1500 + 500,
        color: '#10b981'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post('/daily-challenge/submit', {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      
      if (response.data.accepted) {
        // Update streak info
        const streakResponse = await axiosClient.get('/daily-challenge/streak');
        setUserStreak({
          currentStreak: streakResponse.data.currentStreak,
          longestStreak: streakResponse.data.longestStreak,
          completedToday: true
        });
        
        // Show badge popup
        setShowBadgePopup(true);
        
        // Create celebration particles
        createCelebrationParticles();
      }
      
      setLoading(false);
      setActiveRightTab('result');
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setLoading(false);
      setActiveRightTab('result');
    }
  };

  const getLanguageForMonaco = (lang) => {
    switch (lang) {
      case 'javascript': return 'javascript';
      case 'java': return 'java';
      case 'cpp': return 'cpp';
      default: return 'javascript';
    }
  };

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
      case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
      case 'hard': return 'text-rose-500 bg-rose-500/10 border-rose-500/20';
      default: return 'text-slate-500 bg-slate-500/10 border-slate-500/20';
    }
  };

  if (loading && !problem) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-gradient-to-br from-slate-950 to-gray-900' : 'bg-gradient-to-br from-slate-50 to-blue-50'}`}>
        <div className="relative">
          <div className="relative">
            <div className={`w-16 h-16 border-4 ${darkMode ? 'border-purple-500/30' : 'border-purple-300'} rounded-full animate-spin`}></div>
            <div className={`absolute inset-0 border-4 ${darkMode ? 'border-transparent border-t-purple-500' : 'border-transparent border-t-purple-600'} rounded-full animate-spin`} style={{ animationDuration: '1.5s' }}></div>
          </div>
          <div className={`absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-semibold ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Loading Challenge...
            </span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950' : 'bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50'}`}>
      {/* Animated Background Particles */}
      {darkMode && particles.map(particle => (
        <div
          key={particle.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            backgroundColor: particle.color || '#3b82f6',
            opacity: 0.3,
            animation: `float ${particle.duration}ms ease-in-out forwards`,
            filter: 'blur(1px)'
          }}
          onAnimationEnd={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}

      {/* Badge Popup */}
      <StreakBadgePopup
        isOpen={showBadgePopup}
        onClose={() => setShowBadgePopup(false)}
        dayNumber={dayNumber}
        currentStreak={userStreak.currentStreak}
      />

      {/* Header */}
      <div 
        ref={headerRef}
        className={`sticky top-0 z-50 border-b backdrop-blur-xl transition-all duration-500 ${
          darkMode 
            ? 'bg-slate-900/80 border-slate-800 shadow-xl shadow-blue-900/5' 
            : 'bg-white/80 border-slate-200 shadow-lg shadow-blue-100/30'
        }`}
      >
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div 
              className={`p-2 rounded-xl transition-all duration-500 ${isFloating ? 'translate-y-[-4px]' : ''} ${
                darkMode 
                  ? 'bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 shadow-lg shadow-orange-500/20' 
                  : 'bg-gradient-to-br from-orange-500 via-red-500 to-pink-500 shadow-lg shadow-orange-500/30'
              }`}
            >
              <Flame className="w-6 h-6 text-white animate-pulse" />
            </div>
            <div>
              <h1 className={`text-2xl font-bold bg-gradient-to-r ${darkMode ? 'from-orange-400 to-red-400' : 'from-orange-600 to-red-600'} bg-clip-text text-transparent`}>
                Daily Challenge
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all duration-300 ${
                  darkMode 
                    ? 'bg-orange-500/20 text-orange-400 hover:bg-orange-500/30' 
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}>
                  <Flame className="w-3 h-3" />
                  <span className="animate-pulse">Day {dayNumber}</span>
                </div>
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' 
                      : 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200'
                  }`}
                >
                  <Trophy className="w-3 h-3" />
                  <span className="font-mono">{userStreak.currentStreak}</span> day streak
                </div>
                {userStreak.completedToday && (
                  <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold animate-in ${
                    darkMode 
                      ? 'bg-emerald-500/20 text-emerald-400' 
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <CheckCircle className="w-3 h-3" />
                    Completed Today
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchDailyChallenge()}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 relative overflow-hidden group ${
                darkMode 
                  ? 'bg-gradient-to-br from-slate-800 to-gray-900 text-amber-400' 
                  : 'bg-gradient-to-br from-slate-100 to-white text-slate-700'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              {darkMode ? <Sun className="w-5 h-5 relative z-10" /> : <Moon className="w-5 h-5 relative z-10" />}
            </button>
          </div>
        </div>
      </div>

      <div className="flex h-[calc(100vh-73px)]">
        {/* Left Panel */}
        <div className={`w-1/2 flex flex-col border-r transition-all duration-500 ${
          darkMode ? 'border-slate-800' : 'border-slate-200'
        }`}>
          {/* Left Content */}
          <div className={`flex-1 overflow-y-auto transition-colors duration-500 ${
            darkMode ? 'bg-gradient-to-b from-slate-900 to-gray-900' : 'bg-white'
          }`}>
            <div className="p-6">
              {problem && (
                <div className="space-y-8 animate-in fade-in slide-in-from-left-5 duration-500">
                  {/* Problem Header */}
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div className="space-y-3">
                        <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {problem.title}
                        </h1>
                        <div className="flex items-center gap-3">
                          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-300 hover:scale-105 ${getDifficultyColor(problem.difficulty)}`}>
                            {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                          </span>
                          <div className="flex gap-2">
                            {problem.tags?.split(',').map((tag, index) => (
                              <span 
                                key={index}
                                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all duration-300 ${
                                  darkMode 
                                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' 
                                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                }`}
                              >
                                {tag.trim()}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Problem Description */}
                  <div className="space-y-6">
                    <h2 className={`text-xl font-semibold flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                      <FileText className="w-5 h-5" />
                      Description
                    </h2>
                    <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                      <pre className={`whitespace-pre-wrap font-sans leading-relaxed text-lg ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {problem.description}
                      </pre>
                    </div>
                  </div>

                  {/* Examples */}
                  <div className="space-y-6">
                    <h3 className={`text-xl font-semibold flex items-center gap-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                      <Zap className="w-5 h-5" />
                      Examples
                    </h3>
                    <div className="space-y-4">
                      {problem.visibleTestCases?.map((example, index) => (
                        <div
                          key={index}
                          className={`rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                            darkMode
                              ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
                              : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <h4 className={`font-bold mb-4 flex items-center gap-2 text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                            <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                              <span className="font-mono">{index + 1}</span>
                            </div>
                            Example {index + 1}
                          </h4>
                          <div className="space-y-4 font-mono">
                            <div className="space-y-1">
                              <div className={`text-sm font-semibold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                                Input:
                              </div>
                              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                {example.input}
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className={`text-sm font-semibold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                Output:
                              </div>
                              <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                {example.output}
                              </div>
                            </div>
                            {example.explanation && (
                              <div className="space-y-1">
                                <div className={`text-sm font-semibold ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  Explanation:
                                </div>
                                <div className={`p-3 rounded-lg italic ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {example.explanation}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`w-1/2 flex flex-col transition-colors duration-500 ${
          darkMode ? 'bg-gradient-to-b from-slate-900 to-gray-900' : 'bg-white'
        }`}>
          {/* Right Header with Tabs and Action Buttons */}
          <div className={`flex items-center justify-between border-b transition-colors duration-500 ${
            darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white border-slate-200'
          }`}>
            {/* Right Tabs */}
            <div className="flex">
              {[
                { id: 'code', label: 'Code', icon: Code2 },
                { id: 'testcase', label: 'Test Cases', icon: Play },
                { id: 'result', label: 'Result', icon: Trophy }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveRightTab(tab.id)}
                  className={`relative flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all duration-300 border-b-2 group ${
                    activeRightTab === tab.id
                      ? darkMode
                        ? 'text-purple-400 border-purple-400'
                        : 'text-purple-600 border-purple-600'
                      : darkMode
                        ? 'text-slate-400 border-transparent hover:text-slate-300'
                        : 'text-slate-600 border-transparent hover:text-slate-900'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                  {activeRightTab === tab.id && (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full ${
                      darkMode ? 'bg-purple-400' : 'bg-purple-600'
                    }`} />
                  )}
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 px-6">
              <button
                onClick={handleRun}
                disabled={loading && activeRightTab !== 'result'}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'bg-gradient-to-r from-slate-800 to-gray-900 text-white hover:from-slate-700 hover:to-gray-800 border border-slate-700'
                    : 'bg-gradient-to-r from-white to-slate-50 text-slate-900 hover:from-slate-50 hover:to-slate-100 border border-slate-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Play className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {loading && activeRightTab === 'testcase' ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Running...
                    </span>
                  ) : 'Run'}
                </span>
              </button>
              <button
                onClick={handleSubmitCode}
                disabled={loading && activeRightTab === 'result' || userStreak.completedToday}
                className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 overflow-hidden shadow-lg ${
                  userStreak.completedToday
                    ? 'bg-gradient-to-r from-gray-500 to-gray-600 cursor-not-allowed'
                    : darkMode
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-600 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 shadow-emerald-500/30'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <Send className="w-4 h-4 relative z-10" />
                <span className="relative z-10">
                  {userStreak.completedToday 
                    ? 'Completed' 
                    : loading && activeRightTab === 'result' 
                      ? 'Submitting...' 
                      : 'Submit'
                  }
                </span>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col">
            {activeRightTab === 'code' && (
              <div className="flex-1 flex flex-col animate-in fade-in slide-in-from-right-5 duration-500">
                {/* Language Selector */}
                <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-slate-800' : 'border-slate-200'}`}>
                  <div className="flex gap-3">
                    {['javascript', 'java', 'cpp'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden group ${
                          selectedLanguage === lang
                            ? darkMode
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-purple-500/30'
                            : darkMode
                              ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                              : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                        <span className="relative z-10">
                          {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Monaco Editor */}
                <div className="flex-1 relative">
                  <div className={`absolute inset-0 ${darkMode ? 'bg-slate-900' : 'bg-white'}`}>
                    <Editor
                      height="100%"
                      language={getLanguageForMonaco(selectedLanguage)}
                      value={code}
                      onChange={handleEditorChange}
                      onMount={handleEditorDidMount}
                      theme={darkMode ? "vs-dark" : "light"}
                      options={{
                        fontSize: 14,
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        automaticLayout: true,
                        tabSize: 2,
                        insertSpaces: true,
                        wordWrap: 'on',
                        lineNumbers: 'on',
                        glyphMargin: false,
                        folding: true,
                        lineDecorationsWidth: 10,
                        lineNumbersMinChars: 3,
                        renderLineHighlight: 'line',
                        selectOnLineNumbers: true,
                        roundedSelection: false,
                        readOnly: false,
                        cursorStyle: 'line',
                        mouseWheelZoom: true,
                        suggestOnTriggerCharacters: true,
                        acceptSuggestionOnEnter: 'on',
                        scrollbar: {
                          vertical: 'visible',
                          horizontal: 'visible',
                          useShadows: false
                        },
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {activeRightTab === 'testcase' && (
              <div className="flex-1 p-6 overflow-y-auto animate-in fade-in duration-500">
                <h3 className={`text-xl font-semibold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Play className="w-5 h-5 text-blue-500" />
                  </div>
                  Test Results
                </h3>
                {runResult ? (
                  <div className={`rounded-2xl border p-8 transition-all duration-300 ${
                    runResult.success
                      ? darkMode 
                        ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border-emerald-700' 
                        : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                      : darkMode 
                        ? 'bg-gradient-to-br from-rose-900/20 to-rose-900/10 border-rose-700' 
                        : 'bg-gradient-to-br from-rose-50 to-white border-rose-200'
                  }`}>
                    {runResult.success ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${darkMode ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                            <Check className="w-6 h-6 text-emerald-500" />
                          </div>
                          <div>
                            <h4 className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                              All Test Cases Passed! 🎉
                            </h4>
                            <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              Your code successfully passed all test cases
                            </p>
                          </div>
                        </div>
                        {(runResult.runtime || runResult.memory) && (
                          <div className="flex gap-6">
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                              <Clock className="w-5 h-5 text-blue-500" />
                              <div>
                                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Runtime</div>
                                <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {runResult.runtime} sec
                                </div>
                              </div>
                            </div>
                            <div className={`flex items-center gap-3 px-4 py-3 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                              <Cpu className="w-5 h-5 text-purple-500" />
                              <div>
                                <div className={`text-xs ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memory</div>
                                <div className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {runResult.memory} KB
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                        <div className="space-y-4 mt-6">
                          <h5 className={`font-semibold ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                            Test Cases ({runResult.testCases?.length})
                          </h5>
                          {runResult.testCases?.map((tc, i) => (
                            <div 
                              key={i} 
                              className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                                darkMode 
                                  ? 'bg-slate-800/50 border-slate-700 hover:border-emerald-500/50' 
                                  : 'bg-white border-slate-200 hover:border-emerald-300'
                              }`}
                            >
                              <div className="space-y-3 font-mono">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Input</div>
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                      {tc.stdin}
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Output</div>
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                      {tc.stdout}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                    darkMode 
                                      ? 'bg-emerald-500/20 text-emerald-400' 
                                      : 'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    ✓ Passed
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-full ${darkMode ? 'bg-rose-500/20' : 'bg-rose-100'}`}>
                            <X className="w-6 h-6 text-rose-500" />
                          </div>
                          <div>
                            <h4 className={`text-2xl font-bold ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                              Test Cases Failed
                            </h4>
                            <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                              {runResult.error || 'Some test cases did not pass'}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-4">
                          {runResult.testCases?.map((tc, i) => (
                            <div 
                              key={i} 
                              className={`p-4 rounded-xl border transition-all duration-300 ${
                                darkMode 
                                  ? 'bg-slate-800/50 border-slate-700' 
                                  : 'bg-white border-slate-200'
                              } ${tc.status_id !== 3 ? 'ring-2 ring-rose-500/20' : ''}`}
                            >
                              <div className="space-y-3 font-mono">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Input</div>
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                      {tc.stdin}
                                    </div>
                                  </div>
                                  <div>
                                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Expected</div>
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                      {tc.expected_output}
                                    </div>
                                  </div>
                                  <div className="col-span-2">
                                    <div className={`text-xs font-semibold mb-1 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>Your Output</div>
                                    <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900 text-slate-300' : 'bg-slate-100 text-slate-800'}`}>
                                      {tc.stdout}
                                    </div>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                    tc.status_id === 3
                                      ? darkMode 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : 'bg-emerald-100 text-emerald-700'
                                      : darkMode 
                                        ? 'bg-rose-500/20 text-rose-400' 
                                        : 'bg-rose-100 text-rose-700'
                                  }`}>
                                    {tc.status_id === 3 ? '✓ Passed' : '✗ Failed'}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-16 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="relative inline-block mb-4">
                      <Play className="w-16 h-16 mx-auto opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    </div>
                    <p className="text-lg">Click "Run" to test your code with example test cases</p>
                    <p className="text-sm mt-2 opacity-75">Make sure to test all edge cases!</p>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === 'result' && (
              <div className="flex-1 p-6 overflow-y-auto animate-in fade-in duration-500">
                <h3 className={`text-xl font-semibold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
                    <Trophy className="w-5 h-5 text-amber-500" />
                  </div>
                  Submission Result
                </h3>
                {submitResult ? (
                  <div className={`rounded-2xl border p-8 transition-all duration-300 ${
                    submitResult.accepted
                      ? darkMode 
                        ? 'bg-gradient-to-br from-emerald-900/20 to-emerald-900/10 border-emerald-700' 
                        : 'bg-gradient-to-br from-emerald-50 to-white border-emerald-200'
                      : darkMode 
                        ? 'bg-gradient-to-br from-rose-900/20 to-rose-900/10 border-rose-700' 
                        : 'bg-gradient-to-br from-rose-50 to-white border-rose-200'
                  }`}>
                    {submitResult.accepted ? (
                      <div className="space-y-8 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-500/10 to-transparent -translate-x-full animate-shimmer" />
                          <Trophy className={`relative w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${darkMode ? 'from-emerald-400 to-green-400' : 'from-emerald-600 to-green-600'} bg-clip-text text-transparent`}>
                            🎉 Challenge Completed!
                          </h4>
                          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Excellent work! Your solution is efficient and correct.
                          </p>
                        </div>
                        <div className={`grid grid-cols-3 gap-4 pt-8 border-t ${darkMode ? 'border-emerald-700/30' : 'border-emerald-200'}`}>
                          <div className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                            darkMode ? 'bg-slate-800/50' : 'bg-white'
                          }`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.passedTestCases}/{submitResult.totalTestCases}
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                              100% Passed
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                            darkMode ? 'bg-slate-800/50' : 'bg-white'
                          }`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Runtime</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.runtime}s
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              Faster than 90%
                            </div>
                          </div>
                          <div className={`p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                            darkMode ? 'bg-slate-800/50' : 'bg-white'
                          }`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memory</div>
                            <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.memory}KB
                            </div>
                            <div className={`text-xs mt-1 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`}>
                              Memory efficient
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => setShowBadgePopup(true)}
                          className={`mt-8 px-6 py-3 rounded-xl font-semibold transition-all duration-300 hover:scale-105 ${
                            darkMode
                              ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg hover:shadow-purple-500/30'
                              : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-500/30'
                          }`}
                        >
                          View Your Achievement
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8 text-center">
                        <div className="relative">
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full animate-shimmer" />
                          <X className={`relative w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                        </div>
                        <div>
                          <h4 className={`text-3xl font-bold mb-3 ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                            Needs Improvement
                          </h4>
                          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            {submitResult.error || 'Your solution needs some adjustments.'}
                          </p>
                        </div>
                        <div className={`p-6 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-white'}`}>
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                              <div className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {submitResult.passedTestCases}/{submitResult.totalTestCases}
                              </div>
                              <div className={`text-xs mt-2 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                                {Math.round((submitResult.passedTestCases / submitResult.totalTestCases) * 100)}% Passed
                              </div>
                            </div>
                            <div>
                              <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Accuracy</div>
                              <div className="relative pt-2">
                                <div className={`h-2 rounded-full overflow-hidden ${darkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>
                                  <div 
                                    className={`h-full rounded-full transition-all duration-1000 ${
                                      darkMode ? 'bg-gradient-to-r from-rose-500 to-pink-500' : 'bg-gradient-to-r from-rose-600 to-pink-600'
                                    }`}
                                    style={{ width: `${(submitResult.passedTestCases / submitResult.totalTestCases) * 100}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className={`p-4 rounded-xl ${darkMode ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                          <p className={`text-sm ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            💡 <strong>Tip:</strong> Review your logic for edge cases and consider time/space complexity.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-16 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="relative inline-block mb-4">
                      <Trophy className="w-16 h-16 mx-auto opacity-50" />
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                    </div>
                    <p className="text-lg">Submit your solution to see detailed results</p>
                    <p className="text-sm mt-2 opacity-75">Earn points and maintain your streak!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom CSS for Advanced Animations */}
      <style jsx>{`
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

        @keyframes slide-in-from-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-from-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0;
          }
          10% {
            opacity: 0.5;
          }
          90% {
            opacity: 0.5;
          }
          50% {
            transform: translateY(-20px) translateX(10px);
            opacity: 0.3;
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes pulse-glow {
          0%, 100% {
            opacity: 1;
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
          }
          50% {
            opacity: 0.8;
            box-shadow: 0 0 40px rgba(59, 130, 246, 0.8);
          }
        }

        .animate-in {
          animation: fade-in 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide-in-from-left-5 {
          animation: slide-in-from-left 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .slide-in-from-right-5 {
          animation: slide-in-from-right 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        ::-webkit-scrollbar-track {
          background: transparent;
        }

        ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 4px;
        }

        ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }

        .dark ::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.2);
        }

        .dark ::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.4);
        }
      `}</style>
    </div>
  );
};

export default DailyChallengePage;