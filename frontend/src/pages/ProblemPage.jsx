import { useState, useEffect, useRef } from 'react';
import Editor from '@monaco-editor/react';
import { useParams } from 'react-router';
import { Sun, Moon, Play, Send, Code2, FileText, Lightbulb, History, MessageSquare, Check, X, Clock, Cpu, Trophy, ChevronRight, Zap, Sparkles, Target, Award, CheckCircle2, XCircle } from 'lucide-react';
import axiosClient from "../utils/axiosClient";
import SubmissionHistory from "../components/SubmissionHistory";
import ChatAi from '../components/ChatAi';
import Editorial from '../components/Editorial';
import StaticComplexityAnalyzer from '../components/StaticComplexityAnalyzer';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

const ProblemPage = () => {
  const [darkMode, setDarkMode] = useState(true);
  const [problem, setProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState('description');
  const [activeRightTab, setActiveRightTab] = useState('code');
  const editorRef = useRef(null);
  let { problemId } = useParams();

  useEffect(() => {
    const fetchProblem = async () => {
      setLoading(true);
      try {
        const response = await axiosClient.get(`/problem/problemById/${problemId}`);
        const initialCode = response.data.startCode.find(sc => sc.language === langMap[selectedLanguage])?.initialCode || '';

        setProblem(response.data);
        setCode(initialCode);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching problem:', error);
        setLoading(false);
      }
    };

    fetchProblem();
  }, [problemId]);

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
      const response = await axiosClient.post(`/submission/run/${problemId}`, {
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setLoading(false);
      setActiveRightTab('testcase');
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

  const handleSubmitCode = async () => {
    setLoading(true);
    setSubmitResult(null);

    try {
      const response = await axiosClient.post(`/submission/submit/${problemId}`, {
        code: code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
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
      case 'easy': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
      case 'medium': return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
      case 'hard': return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/30';
    }
  };

  const tabs = [
    { id: 'description', label: 'Description', icon: FileText },
    { id: 'editorial', label: 'Editorial', icon: Lightbulb },
    { id: 'solutions', label: 'Solutions', icon: Code2 },
    { id: 'submissions', label: 'Submissions', icon: History },
    { id: 'chatAI', label: 'AI Assistant', icon: MessageSquare },
    { id: 'complexity', label: 'Complexity', icon: Cpu }
  ];

  const rightTabs = [
    { id: 'code', label: 'Code', icon: Code2 },
    { id: 'testcase', label: 'Test Cases', icon: Play },
    { id: 'result', label: 'Result', icon: Trophy }
  ];

  if (loading && !problem) {
    return (
      <div className={`flex justify-center items-center min-h-screen ${darkMode ? 'bg-slate-950' : 'bg-slate-50'}`}>
        <div className="relative">
          <div className="absolute inset-0 blur-2xl opacity-30">
            <div className="w-32 h-32 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full animate-pulse"></div>
          </div>
          <div className="relative">
            <div className={`w-16 h-16 border-4 ${darkMode ? 'border-slate-700' : 'border-slate-300'} rounded-full animate-spin border-t-transparent border-r-transparent`}></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Code2 className={`w-6 h-6 ${darkMode ? 'text-purple-400' : 'text-purple-600'} animate-pulse`} />
            </div>
          </div>
          <p className={`mt-6 text-sm font-medium ${darkMode ? 'text-slate-400' : 'text-slate-600'} animate-pulse`}>
            Loading Problem...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-all duration-500 ${darkMode ? 'dark bg-slate-950' : 'bg-slate-50'}`}>
      {/* Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute -top-1/2 -left-1/2 w-full h-full bg-gradient-to-br ${darkMode ? 'from-blue-600/5 via-purple-600/5 to-pink-600/5' : 'from-blue-400/5 via-purple-400/5 to-pink-400/5'} blur-3xl animate-blob`}></div>
        <div className={`absolute -bottom-1/2 -right-1/2 w-full h-full bg-gradient-to-tl ${darkMode ? 'from-emerald-600/5 via-cyan-600/5 to-blue-600/5' : 'from-emerald-400/5 via-cyan-400/5 to-blue-400/5'} blur-3xl animate-blob animation-delay-2000`}></div>
      </div>

      {/* Header */}
      <div className={`relative border-b backdrop-blur-xl ${darkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/80 border-slate-200'} transition-all duration-300`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 group">
            <div className={`relative p-2.5 rounded-xl ${darkMode ? 'bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600' : 'bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500'} shadow-lg transition-all duration-300 group-hover:scale-110 group-hover:shadow-2xl group-hover:shadow-purple-500/50`}>
              <Code2 className="w-6 h-6 text-white animate-pulse-slow" />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-blue-400 to-purple-400 blur-xl opacity-0 group-hover:opacity-60 transition-opacity duration-300"></div>
            </div>
            <div>
              <h1 className={`text-xl font-bold bg-gradient-to-r ${darkMode ? 'from-blue-400 via-purple-400 to-pink-400' : 'from-blue-600 via-purple-600 to-pink-600'} bg-clip-text text-transparent`}>
                CodeArena
              </h1>
              <p className={`text-xs ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>
                Master the Art of Coding
              </p>
            </div>
          </div>

          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`relative p-3 rounded-xl transition-all duration-500 group overflow-hidden ${darkMode
              ? 'bg-slate-800 hover:bg-slate-700 text-amber-400'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              } hover:scale-110 hover:shadow-lg`}
          >
            <div className={`absolute inset-0 ${darkMode ? 'bg-amber-400/20' : 'bg-slate-700/10'} transform scale-0 group-hover:scale-100 transition-transform duration-500 rounded-xl`}></div>
            {darkMode ? (
              <Sun className="w-5 h-5 relative z-10 animate-spin-slow" />
            ) : (
              <Moon className="w-5 h-5 relative z-10" />
            )}
          </button>
        </div>
      </div>

      <div className="relative flex h-[calc(100vh-73px)]">
        {/* Left Panel */}
        <div className={`w-1/2 flex flex-col border-r ${darkMode ? 'border-slate-800/50' : 'border-slate-200'} transition-all duration-300`}>
          {/* Left Tabs */}
          <div className={`flex border-b backdrop-blur-sm ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'} transition-all duration-300 overflow-x-auto scrollbar-hide`}>
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveLeftTab(tab.id)}
                  className={`relative flex items-center gap-2 px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 whitespace-nowrap group ${activeLeftTab === tab.id
                    ? darkMode
                      ? 'text-blue-400 border-blue-400 bg-slate-800/70'
                      : 'text-blue-600 border-blue-600 bg-blue-50'
                    : darkMode
                      ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/40'
                      : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                    }`}
                >
                  <Icon className={`w-4 h-4 transition-all duration-300 ${activeLeftTab === tab.id ? 'animate-bounce-subtle' : 'group-hover:scale-110'}`} />
                  {tab.label}
                  {activeLeftTab === tab.id && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 animate-shimmer"></div>
                  )}
                </button>
              );
            })}
          </div>

          {/* Left Content */}
          <div className={`flex-1 overflow-y-auto ${darkMode ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-sm transition-all duration-300 scrollbar-thin ${darkMode ? 'scrollbar-thumb-slate-700 scrollbar-track-slate-900' : 'scrollbar-thumb-slate-300 scrollbar-track-slate-100'}`}>
            <div className="p-6">
              {activeLeftTab === 'description' && problem && (
                <div className="space-y-6 animate-slide-in-left">
                  <div className="flex items-start justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${darkMode ? 'bg-gradient-to-br from-blue-600/20 to-purple-600/20' : 'bg-gradient-to-br from-blue-100 to-purple-100'}`}>
                          <Target className={`w-5 h-5 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                        </div>
                        <h1 className={`text-3xl font-bold bg-gradient-to-r ${darkMode ? 'from-white via-blue-100 to-purple-100' : 'from-slate-900 via-blue-900 to-purple-900'} bg-clip-text text-transparent animate-gradient`}>
                          {problem.title}
                        </h1>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`px-4 py-1.5 rounded-full text-xs font-bold border-2 ${getDifficultyColor(problem.difficulty)} backdrop-blur-sm transition-all duration-300 hover:scale-105 hover:shadow-lg animate-fade-in`}>
                          {problem.difficulty?.charAt(0).toUpperCase() + problem.difficulty?.slice(1)}
                        </span>
                        <span className={`px-4 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm border ${darkMode ? 'bg-slate-800/50 text-slate-300 border-slate-700' : 'bg-slate-100/50 text-slate-700 border-slate-200'
                          } transition-all duration-300 hover:scale-105 animate-fade-in animation-delay-100`}>
                          {problem.tags}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`prose max-w-none ${darkMode ? 'prose-invert' : ''}`}>
                    <div className={`p-6 rounded-2xl border-2 ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-white/50 border-slate-200'} backdrop-blur-sm transition-all duration-300 hover:border-blue-500/30 hover:shadow-xl animate-fade-in animation-delay-200`}>
                      <pre className={`whitespace-pre-wrap font-sans leading-relaxed ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {problem.description}
                      </pre>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h3 className={`text-xl font-bold flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'} animate-fade-in animation-delay-300`}>
                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-gradient-to-br from-amber-600/20 to-orange-600/20' : 'bg-gradient-to-br from-amber-100 to-orange-100'}`}>
                        <Zap className="w-5 h-5 text-amber-500 animate-pulse" />
                      </div>
                      Examples
                    </h3>
                    {problem.visibleTestCases?.map((example, index) => (
                      <div
                        key={index}
                        className={`rounded-2xl border-2 p-5 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl animate-fade-in-up ${darkMode
                          ? 'bg-slate-800/40 border-slate-700/50 hover:border-blue-500/50 hover:bg-slate-800/60'
                          : 'bg-white/70 border-slate-200 hover:border-blue-300 hover:bg-white'
                          } backdrop-blur-sm`}
                        style={{ animationDelay: `${(index + 4) * 100}ms` }}
                      >
                        <h4 className={`font-bold mb-4 flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                          <CheckCircle2 className="w-5 h-5" />
                          Example {index + 1}
                        </h4>
                        <div className="space-y-3 text-sm font-mono">
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} ${darkMode ? 'text-slate-300' : 'text-slate-700'} transition-all duration-300 hover:scale-[1.01]`}>
                            <span className={`font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>Input:</span> {example.input}
                          </div>
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} ${darkMode ? 'text-slate-300' : 'text-slate-700'} transition-all duration-300 hover:scale-[1.01]`}>
                            <span className={`font-bold ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>Output:</span> {example.output}
                          </div>
                          <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} ${darkMode ? 'text-slate-400' : 'text-slate-600'} transition-all duration-300 hover:scale-[1.01]`}>
                            <span className="font-bold">Explanation:</span> {example.explanation}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {activeLeftTab === 'editorial' && problem && (
                <div className="animate-slide-in-left">
                  <Editorial
                    secureUrl={problem.secureUrl}
                    thumbnailUrl={problem.thumbnailUrl}
                    duration={problem.duration}
                  />
                </div>
              )}

              {activeLeftTab === 'solutions' && problem && (
                <div className="animate-slide-in-left">
                  <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Sparkles className="w-6 h-6 text-purple-500 animate-pulse" />
                    Solutions
                  </h2>
                  {problem.referenceSolution?.length > 0 ? (
                    <div className="space-y-4">
                      {problem.referenceSolution.map((solution, index) => (
                        <div key={index} className={`rounded-2xl border-2 overflow-hidden transition-all duration-500 hover:scale-[1.01] hover:shadow-2xl animate-fade-in-up ${darkMode ? 'border-slate-700/50 hover:border-purple-500/50' : 'border-slate-200 hover:border-purple-300'}`} style={{ animationDelay: `${index * 100}ms` }}>
                          <div className={`px-5 py-4 ${darkMode ? 'bg-gradient-to-r from-slate-800/50 to-slate-800/30' : 'bg-gradient-to-r from-slate-100 to-slate-50'} backdrop-blur-sm`}>
                            <h3 className={`font-bold flex items-center gap-2 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              <Code2 className="w-5 h-5 text-purple-500" />
                              {problem?.title} - {solution?.language}
                            </h3>
                          </div>
                          <div className="p-5">
                            <pre className={`p-5 rounded-xl text-sm overflow-x-auto ${darkMode ? 'bg-slate-900/50' : 'bg-slate-50'} border ${darkMode ? 'border-slate-800' : 'border-slate-200'} transition-all duration-300 hover:border-purple-500/30`}>
                              <code className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{solution?.completeCode}</code>
                            </pre>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className={`text-center py-12 rounded-2xl border-2 ${darkMode ? 'bg-slate-800/30 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} backdrop-blur-sm`}>
                      <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium">Solutions will be available after you solve the problem.</p>
                    </div>
                  )}
                </div>
              )}

              {activeLeftTab === 'submissions' && (
                <div className="animate-slide-in-left">
                  <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <History className="w-6 h-6 text-blue-500 animate-pulse" />
                    My Submissions
                  </h2>
                  <SubmissionHistory problemId={problemId} />
                </div>
              )}

              {activeLeftTab === 'chatAI' && problem && (
                <div className="animate-slide-in-left">
                  <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <MessageSquare className="w-6 h-6 text-purple-500 animate-bounce-subtle" />
                    AI Assistant
                  </h2>
                  <ChatAi problem={problem} />
                </div>
              )}

              {activeLeftTab === 'complexity' && problem && (
                <div className="animate-slide-in-left">
                  <h2 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <Cpu className="w-6 h-6 text-cyan-500 animate-pulse" />
                    Complexity Analysis
                  </h2>
                  <StaticComplexityAnalyzer code={code} language={selectedLanguage} problem={problem} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div className={`w-1/2 flex flex-col ${darkMode ? 'bg-slate-900/50' : 'bg-white/50'} backdrop-blur-sm transition-all duration-300`}>
          {/* Right Header with Tabs and Action Buttons */}
          <div className={`flex items-center justify-between border-b backdrop-blur-sm ${darkMode ? 'bg-slate-900/50 border-slate-800' : 'bg-white/50 border-slate-200'} transition-all duration-300`}>
            {/* Right Tabs */}
            <div className="flex">
              {rightTabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveRightTab(tab.id)}
                    className={`relative flex items-center gap-2 px-5 py-3.5 text-sm font-medium transition-all duration-300 border-b-2 group ${activeRightTab === tab.id
                      ? darkMode
                        ? 'text-purple-400 border-purple-400 bg-slate-800/70'
                        : 'text-purple-600 border-purple-600 bg-purple-50'
                      : darkMode
                        ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/40'
                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                      }`}
                  >
                    <Icon className={`w-4 h-4 transition-all duration-300 ${activeRightTab === tab.id ? 'animate-bounce-subtle' : 'group-hover:scale-110'}`} />
                    {tab.label}
                    {activeRightTab === tab.id && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-red-500 animate-shimmer"></div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 px-4">
              <button
                onClick={handleRun}
                disabled={loading && activeRightTab !== 'result'}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden group shadow-xl ${darkMode
                  ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-blue-500/40'
                  : 'bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white shadow-blue-500/40'
                  } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-2xl hover:-translate-y-0.5`}
              >
                {/* Animated Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-xl blur-lg opacity-0 group-hover:opacity-60 transition-all duration-500"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                <Play className={`w-5 h-5 relative z-10 ${loading && activeRightTab === 'testcase' ? 'animate-spin' : 'group-hover:scale-110 transition-transform'}`} strokeWidth={2.5} />
                <span className="relative z-10 font-extrabold">{loading && activeRightTab === 'testcase' ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={loading && activeRightTab === 'result'}
                className={`relative flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 overflow-hidden group shadow-2xl ${darkMode
                  ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 shadow-emerald-500/50'
                  : 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 hover:from-emerald-600 hover:via-green-600 hover:to-teal-600 shadow-emerald-500/50'
                  } disabled:opacity-50 disabled:cursor-not-allowed hover:scale-110 hover:shadow-emerald-500/60 hover:-translate-y-0.5 animate-pulse-slow`}
              >
                {/* Animated Glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 rounded-xl blur-xl opacity-60 group-hover:opacity-100 transition-all duration-500 animate-pulse"></div>

                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700"></div>

                {/* Sparkle Effect */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                  <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping animation-delay-200"></div>
                </div>

                <Send className={`w-5 h-5 relative z-10 ${loading && activeRightTab === 'result' ? 'animate-bounce' : 'group-hover:scale-110 group-hover:rotate-12 transition-all'}`} strokeWidth={2.5} />
                <span className="relative z-10 font-extrabold">{loading && activeRightTab === 'result' ? 'Submitting...' : 'Submit Solution'}</span>

                {/* Bottom Accent */}
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-yellow-400 via-emerald-300 to-cyan-400 transform scale-x-0 group-hover:scale-x-100 transition-all duration-500"></div>
              </button>
            </div>
          </div>

          {/* Right Content */}
          <div className="flex-1 flex flex-col overflow-hidden">
            {activeRightTab === 'code' && (
              <div className="flex-1 flex flex-col animate-slide-in-right">
                {/* Language Selector */}
                <div className={`flex items-center justify-between p-4 border-b ${darkMode ? 'border-slate-800/50' : 'border-slate-200'} backdrop-blur-sm`}>
                  <div className="flex gap-2">
                    {['javascript', 'java', 'cpp'].map((lang) => (
                      <button
                        key={lang}
                        onClick={() => handleLanguageChange(lang)}
                        className={`relative px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 overflow-hidden group ${selectedLanguage === lang
                          ? darkMode
                            ? 'bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white shadow-xl shadow-purple-500/40'
                            : 'bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-xl shadow-purple-500/40'
                          : darkMode
                            ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-purple-500'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 hover:border-purple-400'
                          } hover:scale-105`}
                      >
                        {selectedLanguage === lang && (
                          <div className="absolute inset-0 bg-white/20 animate-pulse-ring"></div>
                        )}
                        <span className="relative z-10">
                          {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JavaScript' : 'Java'}
                        </span>
                      </button>
                    ))}
                  </div>
                  <button
                    onClick={() => setActiveRightTab('testcase')}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 ${darkMode
                      ? 'text-slate-400 hover:text-slate-300 hover:bg-slate-800 border border-transparent hover:border-slate-700'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border border-transparent hover:border-slate-200'
                      }`}
                  >
                    Console
                  </button>
                </div>

                {/* Monaco Editor with fancy border */}
                <div className="flex-1 relative">
                  <div className={`absolute inset-0 border-4 ${darkMode ? 'border-slate-800/30' : 'border-slate-200/30'} rounded-lg pointer-events-none z-10`}></div>
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
                      smoothScrolling: true,
                      cursorBlinking: 'smooth',
                    }}
                  />
                </div>
              </div>
            )}

            {activeRightTab === 'testcase' && (
              <div className="flex-1 p-6 overflow-y-auto animate-slide-in-right scrollbar-thin scrollbar-thumb-slate-700 scrollbar-track-slate-900">
                <h3 className={`text-2xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`relative p-3 rounded-xl ${darkMode ? 'bg-gradient-to-br from-blue-600/20 to-cyan-600/20' : 'bg-gradient-to-br from-blue-100 to-cyan-100'} shadow-lg`}>
                    <Play className="w-6 h-6 text-blue-500" strokeWidth={2.5} />
                    <div className="absolute inset-0 bg-blue-500/20 rounded-xl blur-md"></div>
                  </div>
                  Test Results
                </h3>
                {runResult ? (
                  <div className={`rounded-2xl border-2 p-8 transition-all duration-500 animate-scale-in backdrop-blur-sm ${runResult.success
                    ? darkMode ? 'bg-gradient-to-br from-emerald-900/30 to-green-900/20 border-emerald-500/50 shadow-2xl shadow-emerald-500/30' : 'bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-400 shadow-2xl shadow-emerald-500/30'
                    : darkMode ? 'bg-gradient-to-br from-rose-900/30 to-red-900/20 border-rose-500/50 shadow-2xl shadow-rose-500/30' : 'bg-gradient-to-br from-rose-50 to-red-50 border-rose-400 shadow-2xl shadow-rose-500/30'
                    }`}>
                    {runResult.success ? (
                      <div className="space-y-6">
                        {/* Success Header */}
                        <div className="flex items-center gap-4 animate-bounce-in">
                          <div className="relative">
                            <div className="absolute inset-0 bg-emerald-500/40 rounded-full blur-2xl animate-pulse"></div>
                            <div className={`relative p-4 rounded-2xl ${darkMode ? 'bg-emerald-600/20' : 'bg-emerald-100'} shadow-xl`}>
                              <Check className="w-12 h-12 text-emerald-500" strokeWidth={3} />
                            </div>
                          </div>
                          <div>
                            <h4 className={`text-3xl font-black ${darkMode ? 'text-emerald-400' : 'text-emerald-700'} mb-1`}>
                              All Tests Passed! 🎉
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-emerald-300/70' : 'text-emerald-600/70'}`}>
                              Your code executed successfully
                            </p>
                          </div>
                        </div>

                        {/* Stats Cards */}
                        {runResult.runtime && runResult.memory && (
                          <div className="grid grid-cols-2 gap-4">
                            <div className={`relative group p-5 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-slate-800/60 border-slate-700 hover:border-blue-500/50' : 'bg-white/80 border-slate-200 hover:border-blue-400'} shadow-lg`}>
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                              <div className="relative">
                                <div className={`flex items-center gap-2 mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  <Clock className="w-5 h-5 text-blue-500" strokeWidth={2.5} />
                                  <span className="text-sm font-bold">Runtime</span>
                                </div>
                                <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {runResult.runtime} <span className="text-lg text-slate-500">sec</span>
                                </div>
                              </div>
                            </div>
                            <div className={`relative group p-5 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-slate-800/60 border-slate-700 hover:border-purple-500/50' : 'bg-white/80 border-slate-200 hover:border-purple-400'} shadow-lg`}>
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                              <div className="relative">
                                <div className={`flex items-center gap-2 mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  <Cpu className="w-5 h-5 text-purple-500" strokeWidth={2.5} />
                                  <span className="text-sm font-bold">Memory</span>
                                </div>
                                <div className={`text-2xl font-black ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {runResult.memory} <span className="text-lg text-slate-500">KB</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* Test Cases */}
                        <div className="space-y-3 mt-6">
                          <h5 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>Test Case Details</h5>
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className={`relative group p-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${darkMode ? 'bg-slate-800/60 border-emerald-700/50 hover:border-emerald-500/70' : 'bg-white/80 border-emerald-300 hover:border-emerald-400'} shadow-lg`} style={{ animationDelay: `${i * 100}ms` }}>
                              <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-green-500 rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-500"></div>
                              <div className="relative space-y-3 text-sm font-mono">
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-emerald-300' : 'bg-emerald-50 text-emerald-800'} border ${darkMode ? 'border-slate-700' : 'border-emerald-200'}`}>
                                  <span className="font-bold text-emerald-500">Input:</span> {tc.stdin}
                                </div>
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-blue-300' : 'bg-blue-50 text-blue-800'} border ${darkMode ? 'border-slate-700' : 'border-blue-200'}`}>
                                  <span className="font-bold text-blue-500">Expected:</span> {tc.expected_output}
                                </div>
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-cyan-300' : 'bg-cyan-50 text-cyan-800'} border ${darkMode ? 'border-slate-700' : 'border-cyan-200'}`}>
                                  <span className="font-bold text-cyan-500">Output:</span> {tc.stdout}
                                </div>
                                <div className="flex items-center gap-2 text-emerald-500 font-bold pt-2">
                                  <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} />
                                  <span className="text-base">Test Case Passed ✓</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Error Header */}
                        <div className="flex items-center gap-4 animate-shake">
                          <div className="relative">
                            <div className="absolute inset-0 bg-rose-500/40 rounded-full blur-2xl animate-pulse"></div>
                            <div className={`relative p-4 rounded-2xl ${darkMode ? 'bg-rose-600/20' : 'bg-rose-100'} shadow-xl`}>
                              <X className="w-12 h-12 text-rose-500" strokeWidth={3} />
                            </div>
                          </div>
                          <div>
                            <h4 className={`text-3xl font-black ${darkMode ? 'text-rose-400' : 'text-rose-700'} mb-1`}>
                              {runResult.error || 'Tests Failed'} ❌
                            </h4>
                            <p className={`text-sm ${darkMode ? 'text-rose-300/70' : 'text-rose-600/70'}`}>
                              Review the failed test cases below
                            </p>
                          </div>
                        </div>

                        {/* Failed Test Cases */}
                        <div className="space-y-3">
                          <h5 className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'} mb-3`}>Test Case Details</h5>
                          {runResult.testCases?.map((tc, i) => (
                            <div key={i} className={`relative group p-5 rounded-xl border-2 backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] animate-fade-in-up ${darkMode ? 'bg-slate-800/60 border-rose-700/50 hover:border-rose-500/70' : 'bg-white/80 border-rose-300 hover:border-rose-400'} shadow-lg`} style={{ animationDelay: `${i * 100}ms` }}>
                              <div className={`absolute -inset-0.5 bg-gradient-to-r ${tc.status_id === 3 ? 'from-emerald-500 to-green-500' : 'from-rose-500 to-red-500'} rounded-xl blur opacity-0 group-hover:opacity-20 transition-all duration-500`}></div>
                              <div className="relative space-y-3 text-sm font-mono">
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-50 text-slate-700'} border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <span className="font-bold">Input:</span> {tc.stdin}
                                </div>
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-50 text-slate-700'} border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <span className="font-bold">Expected:</span> {tc.expected_output}
                                </div>
                                <div className={`p-3 rounded-lg ${darkMode ? 'bg-slate-900/60 text-slate-300' : 'bg-slate-50 text-slate-700'} border ${darkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                                  <span className="font-bold">Output:</span> {tc.stdout}
                                </div>
                                <div className={`flex items-center gap-2 font-bold pt-2 ${tc.status_id === 3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                                  {tc.status_id === 3 ? <CheckCircle2 className="w-6 h-6" strokeWidth={2.5} /> : <XCircle className="w-6 h-6" strokeWidth={2.5} />}
                                  <span className="text-base">{tc.status_id === 3 ? 'Test Case Passed ✓' : 'Test Case Failed ✗'}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-20 rounded-2xl border-2 backdrop-blur-sm ${darkMode ? 'bg-slate-800/30 border-slate-700/50' : 'bg-slate-50 border-slate-200'} shadow-xl`}>
                    <div className="relative inline-block mb-6">
                      <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl animate-pulse"></div>
                      <Play className={`relative w-20 h-20 mx-auto ${darkMode ? 'text-slate-600' : 'text-slate-400'} animate-pulse`} strokeWidth={1.5} />
                    </div>
                    <p className={`text-xl font-bold ${darkMode ? 'text-slate-400' : 'text-slate-500'} mb-2`}>No Test Results Yet</p>
                    <p className={`text-sm ${darkMode ? 'text-slate-500' : 'text-slate-400'}`}>Click "Run Code" to test your solution</p>
                  </div>
                )}
              </div>
            )}

            {activeRightTab === 'result' && (
              <div className="flex-1 p-6 overflow-y-auto animate-slide-in-right">
                <h3 className={`text-xl font-bold mb-6 flex items-center gap-3 ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-amber-600/20' : 'bg-amber-100'}`}>
                    <Trophy className="w-5 h-5 text-amber-500 animate-bounce" />
                  </div>
                  Submission Result
                </h3>
                {submitResult ? (
                  <div className={`rounded-2xl border-2 p-10 transition-all duration-500 animate-scale-in ${submitResult.accepted
                    ? darkMode ? 'bg-emerald-900/20 border-emerald-600/50 shadow-2xl shadow-emerald-500/30' : 'bg-emerald-50 border-emerald-300 shadow-2xl shadow-emerald-500/30'
                    : darkMode ? 'bg-rose-900/20 border-rose-600/50 shadow-2xl shadow-rose-500/30' : 'bg-rose-50 border-rose-300 shadow-2xl shadow-rose-500/30'
                    }`}>
                    {submitResult.accepted ? (
                      <div className="space-y-8 text-center">
                        <div className="animate-bounce-in">
                          <div className="relative inline-block">
                            <Trophy className={`w-20 h-20 mx-auto mb-4 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                            <div className="absolute inset-0 bg-emerald-500/30 blur-2xl animate-pulse"></div>
                          </div>
                          <h4 className={`text-3xl font-extrabold mb-3 ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                            🎉 Accepted!
                          </h4>
                          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Congratulations! Your solution passed all test cases.
                          </p>
                        </div>
                        <div className={`grid grid-cols-2 gap-4 pt-6 border-t-2 ${darkMode ? 'border-emerald-700/30' : 'border-emerald-200'}`}>
                          <div className={`p-6 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 animate-fade-in ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                            <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.passedTestCases}/{submitResult.totalTestCases}
                            </div>
                          </div>
                          <div className={`p-6 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 animate-fade-in animation-delay-100 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Runtime</div>
                            <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.runtime} sec
                            </div>
                          </div>
                          <div className={`p-6 rounded-xl col-span-2 backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 animate-fade-in animation-delay-200 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Memory</div>
                            <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.memory} KB
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-8 text-center">
                        <div className="animate-shake">
                          <div className="relative inline-block">
                            <X className={`w-20 h-20 mx-auto mb-4 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
                            <div className="absolute inset-0 bg-rose-500/30 blur-2xl animate-pulse"></div>
                          </div>
                          <h4 className={`text-3xl font-extrabold mb-3 ${darkMode ? 'text-rose-400' : 'text-rose-700'}`}>
                            ❌ {submitResult.error || 'Submission Failed'}
                          </h4>
                          <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                            Your solution needs improvement. Check the details below.
                          </p>
                        </div>
                        <div className={`grid grid-cols-2 gap-4 pt-6 border-t-2 ${darkMode ? 'border-rose-700/30' : 'border-rose-200'}`}>
                          <div className={`p-6 rounded-xl backdrop-blur-sm border-2 transition-all duration-300 hover:scale-105 ${darkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Test Cases</div>
                            <div className={`text-3xl font-extrabold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                              {submitResult.passedTestCases}/{submitResult.totalTestCases}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className={`text-center py-16 rounded-2xl border-2 ${darkMode ? 'bg-slate-800/30 border-slate-700/50 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'} backdrop-blur-sm`}>
                    <Trophy className="w-16 h-16 mx-auto mb-4 opacity-50 animate-pulse" />
                    <p className="text-lg font-medium">Click "Submit" to submit your solution</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        /* Scrollbar Styles */
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .scrollbar-thin::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }
        
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb {
          background: rgb(51 65 85);
          border-radius: 4px;
        }
        
        .scrollbar-thumb-slate-700::-webkit-scrollbar-thumb:hover {
          background: rgb(71 85 105);
        }
        
        .scrollbar-track-slate-900::-webkit-scrollbar-track {
          background: rgb(15 23 42);
        }

        /* Background Animations */
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          25% {
            transform: translate(20px, -50px) scale(1.1);
          }
          50% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          75% {
            transform: translate(50px, 50px) scale(1.05);
          }
        }
        
        .animate-blob {
          animation: blob 20s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }

        /* Slide Animations */
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-slide-in-left {
          animation: slide-in-left 0.5s ease-out;
        }
        
        .animate-slide-in-right {
          animation: slide-in-right 0.5s ease-out;
        }

        /* Fade Animations */
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.5s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
          animation-fill-mode: both;
        }
        
        .animation-delay-100 {
          animation-delay: 0.1s;
        }
        
        .animation-delay-200 {
          animation-delay: 0.2s;
        }
        
        .animation-delay-300 {
          animation-delay: 0.3s;
        }

        /* Scale Animations */
        @keyframes scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-scale-in {
          animation: scale-in 0.4s ease-out;
        }

        /* Bounce Animations */
        @keyframes bounce-in {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            transform: scale(1);
          }
        }
        
        .animate-bounce-in {
          animation: bounce-in 0.6s ease-out;
        }
        
        @keyframes bounce-subtle {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-3px);
          }
        }
        
        .animate-bounce-subtle {
          animation: bounce-subtle 2s ease-in-out infinite;
        }

        /* Shake Animation */
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          10%, 30%, 50%, 70%, 90% {
            transform: translateX(-5px);
          }
          20%, 40%, 60%, 80% {
            transform: translateX(5px);
          }
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }

        /* Shimmer Animation */
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 3s linear infinite;
        }

        /* Pulse Animations */
        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 3s ease-in-out infinite;
        }
        
        @keyframes pulse-ring {
          0% {
            transform: scale(0.95);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.7;
          }
          100% {
            transform: scale(0.95);
            opacity: 1;
          }
        }
        
        .animate-pulse-ring {
          animation: pulse-ring 2s ease-in-out infinite;
        }

        /* Spin Animation */
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }

        /* Gradient Animation */
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 3s ease infinite;
        }

        /* Glow Effect */
        @keyframes glow {
          0%, 100% {
            box-shadow: 0 0 5px rgba(59, 130, 246, 0.5),
                        0 0 10px rgba(59, 130, 246, 0.3);
          }
          50% {
            box-shadow: 0 0 20px rgba(59, 130, 246, 0.8),
                        0 0 30px rgba(59, 130, 246, 0.5);
          }
        }

        /* Hover Effects */
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        
        .hover-lift:hover {
          transform: translateY(-5px);
        }

        /* Loading Spinner Enhancement */
        @keyframes spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* Float Animation */
        @keyframes float {
          0%, 100% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        /* Card Reveal Animation */
        @keyframes card-reveal {
          from {
            opacity: 0;
            transform: rotateX(-15deg);
          }
          to {
            opacity: 1;
            transform: rotateX(0deg);
          }
        }

        /* Glassmorphism Effect */
        .glass-effect {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Text Gradient */
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        /* Button Hover Shine */
        @keyframes shine {
          0% {
            left: -100%;
          }
          100% {
            left: 100%;
          }
        }

        /* Tooltip Animation */
        @keyframes tooltip-appear {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        /* Custom Scrollbar for modern browsers */
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(100, 116, 139, 0.5) transparent;
        }

        *::-webkit-scrollbar {
          width: 8px;
          height: 8px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: rgba(100, 116, 139, 0.5);
          border-radius: 4px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(100, 116, 139, 0.7);
        }

        /* Dark mode scrollbar */
        .dark *::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.5);
        }

        .dark *::-webkit-scrollbar-thumb:hover {
          background: rgba(71, 85, 105, 0.7);
        }

        /* Smooth transitions for all interactive elements */
        button, a, input, textarea {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Focus styles for accessibility */
        button:focus-visible,
        a:focus-visible {
          outline: 2px solid rgba(59, 130, 246, 0.5);
          outline-offset: 2px;
        }

        /* Prevent text selection on buttons */
        button {
          user-select: none;
          -webkit-user-select: none;
          -moz-user-select: none;
        }

        /* Code block styling enhancement */
        pre {
          position: relative;
        }

        pre:hover {
          border-color: rgba(59, 130, 246, 0.3);
        }

        /* Improve readability */
        .dark {
          color-scheme: dark;
        }
      `}</style>
    </div>
  );
};

export default ProblemPage; 