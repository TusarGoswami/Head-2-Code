import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router';
import Editor from '@monaco-editor/react';
import { io } from 'socket.io-client';
import axiosClient from '../utils/axiosClient';
import { 
  Clock, Trophy, Code2, CheckCircle, XCircle, Play, Send, 
  AlertCircle, Users, ArrowLeft, FileText, Flag, Zap, Flame,
  Sparkles, Crown, Target, Award, BarChart3, AlertTriangle,
  Shield, Loader2, RotateCcw, Fullscreen, Maximize2, Volume2,
  Timer, Hash, UserCheck, Medal, Star, ChevronRight, ShieldAlert
} from 'lucide-react';
import { useSelector } from 'react-redux';

const langMap = {
  cpp: 'C++',
  java: 'Java',
  javascript: 'JavaScript'
};

function FriendArenaPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const [arena, setArena] = useState(null);
  const [selectedProblem, setSelectedProblem] = useState(null);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [code, setCode] = useState('');
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [submitResult, setSubmitResult] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [leaderboard, setLeaderboard] = useState([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [tabSwitches, setTabSwitches] = useState(0);
  const [isDisqualified, setIsDisqualified] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(true);
  const [darkMode] = useState(true);
  const [activeRightTab, setActiveRightTab] = useState('code');
  const [particles, setParticles] = useState([]);
  const [isFloating, setIsFloating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const socketRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const userEndTimeRef = useRef(null);
  const tabSwitchCountRef = useRef(0);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  useEffect(() => {
    fetchArena();
    
    // Create floating particles
    const interval = setInterval(() => {
      if (arena?.status === 'active' && Math.random() > 0.7) {
        setParticles(prev => [
          ...prev.slice(-15),
          {
            id: Date.now(),
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 3 + 1,
            duration: Math.random() * 4000 + 2000,
            color: ['#f59e0b', '#3b82f6', '#10b981'][Math.floor(Math.random() * 3)]
          }
        ]);
      }
    }, 600);

    return () => clearInterval(interval);
  }, [roomCode]);

  useEffect(() => {
    // Floating animation for elements
    const interval = setInterval(() => {
      setIsFloating(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Fullscreen detection
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, []);

  useEffect(() => {
    // Tab switch detection
    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (arena?.status === 'active' && !isDisqualified) {
          tabSwitchCountRef.current += 1;
          setTabSwitches(tabSwitchCountRef.current);
          
          // Create warning particles
          setParticles(prev => [
            ...prev.slice(-10),
            ...Array.from({ length: 5 }, (_, i) => ({
              id: Date.now() + i,
              x: Math.random() * 100,
              y: Math.random() * 100,
              size: Math.random() * 2 + 1,
              duration: Math.random() * 2000 + 1000,
              color: '#f59e0b'
            }))
          ]);
          
          // Track tab switch on server
          if (tabSwitchCountRef.current > 0) {
            axiosClient.post('/friend-arena/track-tab-switch', { roomCode })
              .then(response => {
                if (response.data.isDisqualified) {
                  setIsDisqualified(true);
                  createDisqualificationParticles();
                }
              })
              .catch(err => console.error('Error tracking tab switch:', err));
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [arena, roomCode, isDisqualified]);

  const createDisqualificationParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 20; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 3 + 2,
        duration: Math.random() * 3000 + 2000,
        color: '#ef4444'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  const createSuccessParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 15; i++) {
      newParticles.push({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 2 + 1,
        duration: Math.random() * 2000 + 1000,
        color: '#10b981'
      });
    }
    setParticles(prev => [...prev, ...newParticles]);
  };

  useEffect(() => {
    if (!roomCode || !user) return;

    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };

    socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:5000', {
      auth: {
        token: getCookie('token')
      },
      withCredentials: true,
      transports: ['websocket', 'polling']
    });

    socketRef.current.on('connect', () => {
      console.log('Connected to Friend Arena');
      if (roomCode) {
        socketRef.current.emit('join-friend-arena', roomCode);
      }
    });

    socketRef.current.on('friend-arena-leaderboard-update', (updatedLeaderboard) => {
      setLeaderboard(updatedLeaderboard);
      // Add celebration particles for top positions
      if (updatedLeaderboard[0]?.userId._id === user?._id) {
        createSuccessParticles();
      }
    });

    socketRef.current.on('friend-arena-data', (data) => {
      if (data.arena) {
        setArena(data.arena);
        setLeaderboard(data.arena.leaderboard || []);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-friend-arena', roomCode);
        socketRef.current.disconnect();
      }
    };
  }, [roomCode, user]);

  useEffect(() => {
    if (arena?.status === 'active' && arena.participants) {
      const participant = arena.participants.find(
        p => p.userId._id === user?._id || p.userId === user?._id
      );

      if (participant && participant.endTime) {
        userEndTimeRef.current = new Date(participant.endTime);
        startTimer();
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [arena, user]);

  const startTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    timerIntervalRef.current = setInterval(() => {
      if (userEndTimeRef.current) {
        const now = new Date();
        const remaining = Math.max(0, userEndTimeRef.current - now);
        setTimeRemaining(remaining);

        if (remaining <= 0) {
          clearInterval(timerIntervalRef.current);
        }
      }
    }, 1000);
  };

  const fetchArena = async () => {
    try {
      const response = await axiosClient.get(`/friend-arena/${roomCode}`);
      setArena(response.data.arena);
      setLeaderboard(response.data.arena.leaderboard || []);
      
      if (response.data.arena.problems && response.data.arena.problems.length > 0) {
        setSelectedProblem(response.data.arena.problems[0]);
        const initialCode = response.data.arena.problems[0].startCode?.find(
          sc => sc.language === langMap[selectedLanguage]
        )?.initialCode || '';
        setCode(initialCode);
      }

      const participant = response.data.arena.participants?.find(
        p => (p.userId._id || p.userId) === user?._id
      );
      
      if (participant) {
        setTabSwitches(participant.tabSwitches || 0);
        setIsDisqualified(participant.isDisqualified || false);
      }
    } catch (error) {
      console.error('Error fetching arena:', error);
    }
  };

  const requestFullscreen = async () => {
    try {
      const element = document.documentElement;
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen();
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen();
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen();
      }
      setShowFullscreenWarning(false);
      createSuccessParticles();
    } catch (err) {
      console.error('Error requesting fullscreen:', err);
    }
  };

  const handleStartContest = async () => {
    if (!isFullscreen) {
      alert('Please enable fullscreen mode first');
      return;
    }

    try {
      await axiosClient.post('/friend-arena/start', { roomCode });
      fetchArena();
      createSuccessParticles();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to start contest');
    }
  };

  const handleEndContest = async () => {
    if (window.confirm('Are you sure you want to end the contest? This will end it for all participants.')) {
      try {
        const response = await axiosClient.post('/friend-arena/end', { roomCode });
        setArena(response.data.arena);
        setLeaderboard(response.data.leaderboard);
        fetchArena();
      } catch (error) {
        alert(error.response?.data?.message || 'Failed to end contest');
      }
    }
  };

  const handleRun = async () => {
    if (!selectedProblem) return;
    
    setRunning(true);
    setRunResult(null);
    
    try {
      const response = await axiosClient.post('/friend-arena/run', {
        roomCode,
        problemId: selectedProblem._id,
        code,
        language: selectedLanguage
      });

      setRunResult(response.data);
      setActiveRightTab('testcase');
      if (response.data.success) {
        createSuccessParticles();
      }
    } catch (error) {
      console.error('Error running code:', error);
      setRunResult({
        success: false,
        error: 'Internal server error'
      });
      setActiveRightTab('testcase');
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedProblem) return;
    
    setSubmitting(true);
    setSubmitResult(null);
    
    try {
      const response = await axiosClient.post('/friend-arena/submit', {
        roomCode,
        problemId: selectedProblem._id,
        code,
        language: selectedLanguage
      });

      setSubmitResult(response.data);
      setLeaderboard(response.data.leaderboard || []);
      setActiveRightTab('result');
      
      if (response.data.accepted) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
        createSuccessParticles();
      }
      
      fetchArena();
    } catch (error) {
      console.error('Error submitting code:', error);
      setSubmitResult(null);
      setActiveRightTab('result');
    } finally {
      setSubmitting(false);
    }
  };

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
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

  if (!arena) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-950 via-gray-900 to-slate-950">
        <div className="relative">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-500/30 rounded-full animate-spin"></div>
            <div className="absolute inset-0 border-4 border-transparent border-t-purple-500 rounded-full animate-spin" style={{ animationDuration: '1.5s' }}></div>
          </div>
          <div className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-sm font-semibold text-purple-400">
            <span className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 animate-pulse" />
              Entering Arena...
            </span>
          </div>
        </div>
      </div>
    );
  }

  const isCreator = arena.createdBy._id === user?._id || arena.createdBy === user?._id;

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
            backgroundColor: particle.color,
            opacity: 0.3,
            animation: `float ${particle.duration}ms ease-in-out forwards`,
            filter: 'blur(1px)'
          }}
          onAnimationEnd={() => {
            setParticles(prev => prev.filter(p => p.id !== particle.id));
          }}
        />
      ))}

      {/* Fullscreen Warning */}
      {showFullscreenWarning && arena.status === 'waiting' && (
        <div className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center animate-in fade-in duration-500">
          <div className="relative bg-gradient-to-br from-slate-900 to-gray-900 rounded-2xl p-8 max-w-md mx-4 border border-slate-800 shadow-2xl shadow-purple-500/10">
            <div className="text-center space-y-6">
              <div className="relative">
                <ShieldAlert className="w-16 h-16 text-orange-500 mx-auto" />
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-500/10 to-transparent -translate-x-full animate-shimmer" />
              </div>
              <h2 className="text-2xl font-bold text-white">Fullscreen Required ⚔️</h2>
              <p className="text-slate-400">
                You must enable fullscreen mode to participate in Friend Arena. Tab switching is strictly monitored!
              </p>
              <button
                onClick={requestFullscreen}
                className="group relative w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-3 px-6 rounded-xl transition-all overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center justify-center gap-2">
                  <Maximize2 className="w-5 h-5" />
                  Enable Fullscreen
                </span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Animation */}
      {showSuccess && (
        <div className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none">
          <div className="animate-in zoom-in duration-500">
            <div className="bg-gradient-to-r from-emerald-500 to-green-500 text-white px-8 py-4 rounded-2xl shadow-2xl shadow-emerald-500/30">
              <div className="flex items-center gap-3">
                <Trophy className="w-8 h-8 animate-bounce" />
                <span className="text-xl font-bold">Problem Solved! 🎉</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`sticky top-0 z-30 border-b backdrop-blur-xl transition-all duration-500 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-800 shadow-xl shadow-blue-900/5' 
          : 'bg-white/80 border-slate-200 shadow-lg shadow-blue-100/30'
      }`}>
        <div className="px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/friend-arena')}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
              }`}
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3">
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
                  Friend Arena
                </h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className={`text-xs px-2 py-1 rounded-full ${darkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>
                    Room: <span className="font-mono font-bold">{arena.roomCode}</span>
                  </div>
                  <div className={`text-xs px-2 py-1 rounded-full capitalize ${darkMode ? 'bg-slate-800 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>
                    {arena.topic}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {arena.status === 'active' && (
              <>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-slate-800 to-gray-900 border border-slate-700' 
                    : 'bg-gradient-to-r from-slate-100 to-white border border-slate-300'
                }`}>
                  <Timer className="w-4 h-4 text-blue-500" />
                  <span className={`font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    {formatTime(timeRemaining)}
                  </span>
                </div>
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-300 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-slate-800 to-gray-900 border border-slate-700' 
                    : 'bg-gradient-to-r from-slate-100 to-white border border-slate-300'
                }`}>
                  <Users className="w-4 h-4 text-green-500" />
                  <span className={darkMode ? 'text-white' : 'text-slate-900'}>
                    {arena.participants?.length || 0}
                  </span>
                </div>
                {isDisqualified && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-rose-500/20 text-rose-400 border-rose-500/30' 
                      : 'bg-rose-100 text-rose-700 border-rose-200'
                  }`}>
                    <ShieldAlert className="w-4 h-4" />
                    <span className="font-semibold">Disqualified</span>
                  </div>
                )}
                {tabSwitches > 0 && !isDisqualified && (
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-all duration-300 ${
                    darkMode 
                      ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                      : 'bg-amber-100 text-amber-700 border-amber-200'
                  }`}>
                    <AlertTriangle className="w-4 h-4" />
                    <span>Tab Switches: {tabSwitches}/1</span>
                  </div>
                )}
              </>
            )}
            {arena.status === 'waiting' && arena.participants?.length >= 2 && (
              <button
                onClick={handleStartContest}
                disabled={!isFullscreen}
                className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all duration-300 overflow-hidden ${
                  isFullscreen
                    ? darkMode
                      ? 'bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white'
                      : 'bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white'
                    : 'bg-gray-500 text-gray-300 cursor-not-allowed'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  <Play className="w-4 h-4" />
                  Start Contest
                </span>
              </button>
            )}
            {arena.status === 'active' && isCreator && (
              <button
                onClick={handleEndContest}
                className={`group relative flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-all duration-300 overflow-hidden ${
                  darkMode
                    ? 'bg-gradient-to-r from-rose-600 to-pink-600 hover:from-rose-500 hover:to-pink-500'
                    : 'bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600'
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                <span className="relative z-10 flex items-center gap-2">
                  <Flag className="w-4 h-4" />
                  End Contest
                </span>
              </button>
            )}
            <button
              onClick={() => fetchArena()}
              className={`p-2.5 rounded-xl transition-all duration-300 hover:scale-110 ${
                darkMode 
                  ? 'bg-slate-800 hover:bg-slate-700 text-blue-400' 
                  : 'bg-slate-100 hover:bg-slate-200 text-blue-600'
              }`}
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {arena.status === 'waiting' && (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-gray-900 rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-blue-900/10">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">
              <span className="bg-gradient-to-r from-orange-400 to-red-400 bg-clip-text text-transparent">
                Battle Lobby ⚔️
              </span>
            </h2>
            
            <div className="grid grid-cols-2 gap-6 mb-8">
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-100 border border-slate-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Hash className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <h3 className="text-sm text-slate-400">Room Code</h3>
                    <p className="text-3xl font-bold text-white tracking-widest">{arena.roomCode}</p>
                  </div>
                </div>
              </div>
              
              <div className={`p-6 rounded-xl transition-all duration-300 hover:scale-[1.02] ${
                darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-100 border border-slate-300'
              }`}>
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2 rounded-lg ${darkMode ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                    <Target className="w-5 h-5 text-purple-500" />
                  </div>
                  <div>
                    <h3 className="text-sm text-slate-400">Topic</h3>
                    <p className="text-2xl font-bold text-white capitalize">{arena.topic}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className={`rounded-xl p-6 mb-6 transition-all duration-300 ${
              darkMode ? 'bg-slate-800/50 border border-slate-700' : 'bg-slate-100 border border-slate-300'
            }`}>
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-green-500" />
                Participants ({arena.participants?.length || 0})
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {arena.participants?.map((p, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4 rounded-lg transition-all duration-300 hover:scale-[1.02] ${
                      darkMode 
                        ? 'bg-slate-900 border border-slate-700 hover:border-slate-600' 
                        : 'bg-white border border-slate-200 hover:border-slate-300'
                    } ${isCreator && (p.userId._id === user?._id || p.userId === user?._id) ? 'ring-2 ring-orange-500' : ''}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                        idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500' :
                        idx === 1 ? 'bg-gradient-to-r from-slate-600 to-gray-600' :
                        'bg-gradient-to-r from-slate-700 to-gray-700'
                      }`}>
                        <span className="text-white">{idx + 1}</span>
                      </div>
                      <div>
                        <div className="text-white font-semibold">
                          {p.userId?.firstName || 'User'} {p.userId?.lastName || ''}
                          {isCreator && (p.userId._id === user?._id || p.userId === user?._id) && (
                            <span className="text-xs text-orange-500 ml-2">(Creator)</span>
                          )}
                        </div>
                        <div className="text-sm text-slate-400">
                          {p.userId?.email || ''}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {isCreator && (
              <div className={`p-4 rounded-xl border animate-pulse ${
                darkMode 
                  ? 'bg-gradient-to-r from-amber-500/10 to-orange-500/10 border-amber-500/30' 
                  : 'bg-gradient-to-r from-amber-100 to-orange-100 border-amber-200'
              }`}>
                <p className={`text-sm ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>
                  ⚡ You are the room creator. Start the contest when everyone is ready (minimum 2 participants required).
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {arena.status === 'active' && !isDisqualified && (
        <div className="flex h-[calc(100vh-73px)]">
          {/* Left Panel */}
          <div className={`w-1/2 flex flex-col border-r transition-colors duration-500 ${
            darkMode ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {/* Problem Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-slate-800 bg-gradient-to-r from-slate-900 to-gray-900' : 'border-slate-200 bg-white'}`}>
              {arena.problems?.map((problem, idx) => (
                <button
                  key={problem._id}
                  onClick={() => {
                    setSelectedProblem(problem);
                    const initialCode = problem.startCode?.find(
                      sc => sc.language === langMap[selectedLanguage]
                    )?.initialCode || '';
                    setCode(initialCode);
                  }}
                  className={`relative flex-1 px-4 py-3 text-sm font-medium transition-all duration-300 border-b-2 group ${
                    selectedProblem?._id === problem._id
                      ? darkMode
                        ? 'text-orange-400 border-orange-400 bg-slate-800/50'
                        : 'text-orange-600 border-orange-600 bg-orange-50'
                      : darkMode
                        ? 'text-slate-400 border-transparent hover:text-slate-300 hover:bg-slate-800/30'
                        : 'text-slate-600 border-transparent hover:text-slate-900 hover:bg-slate-50'
                  }`}
                >
                  <span className="relative z-10">
                    Problem {idx + 1}
                  </span>
                  {selectedProblem?._id === problem._id && (
                    <div className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1/2 h-0.5 rounded-full ${
                      darkMode ? 'bg-orange-400' : 'bg-orange-600'
                    }`} />
                  )}
                </button>
              ))}
            </div>

            {/* Left Content */}
            <div className={`flex-1 overflow-y-auto transition-colors duration-500 ${
              darkMode ? 'bg-gradient-to-b from-slate-900 to-gray-900' : 'bg-white'
            }`}>
              <div className="p-6">
                {selectedProblem && (
                  <div className="space-y-8 animate-in fade-in slide-in-from-left-5 duration-500">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-3">
                          <h1 className={`text-3xl font-bold tracking-tight ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {selectedProblem.title}
                          </h1>
                          <div className="flex items-center gap-3">
                            <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border-2 transition-all duration-300 hover:scale-105 ${getDifficultyColor(selectedProblem.difficulty)}`}>
                              {selectedProblem.difficulty?.charAt(0).toUpperCase() + selectedProblem.difficulty?.slice(1)}
                            </span>
                            <div className="flex gap-2">
                              {selectedProblem.tags?.split(',').map((tag, index) => (
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

                    <div className="space-y-6">
                      <h2 className={`text-xl font-semibold flex items-center gap-2 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                        <FileText className="w-5 h-5" />
                        Description
                      </h2>
                      <pre className={`whitespace-pre-wrap font-sans leading-relaxed text-lg ${darkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                        {selectedProblem.description}
                      </pre>
                    </div>

                    <div className="space-y-6">
                      <h3 className={`text-xl font-semibold flex items-center gap-2 ${darkMode ? 'text-amber-400' : 'text-amber-600'}`}>
                        <Zap className="w-5 h-5" />
                        Examples
                      </h3>
                      <div className="space-y-4">
                        {selectedProblem.visibleTestCases?.map((example, idx) => (
                          <div
                            key={idx}
                            className={`rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] hover:shadow-xl ${
                              darkMode
                                ? 'bg-slate-800/50 border-slate-700 hover:border-blue-500/50'
                                : 'bg-gradient-to-br from-white to-slate-50 border-slate-200 hover:border-blue-300'
                            }`}
                          >
                            <h4 className={`font-bold mb-4 flex items-center gap-2 text-lg ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                              <div className={`p-1.5 rounded-lg ${darkMode ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                                <span className="font-mono">{idx + 1}</span>
                              </div>
                              Example {idx + 1}
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
            {/* Right Tabs */}
            <div className={`flex border-b ${darkMode ? 'border-slate-800 bg-gradient-to-r from-slate-900 to-gray-900' : 'border-slate-200 bg-white'}`}>
              {[
                { id: 'code', label: 'Code', icon: Code2 },
                { id: 'testcase', label: 'Test Cases', icon: Play },
                { id: 'result', label: 'Result', icon: Trophy },
                { id: 'leaderboard', label: 'Leaderboard', icon: BarChart3 }
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
            <div className={`flex items-center justify-between px-6 py-4 border-b transition-colors duration-500 ${
              darkMode ? 'border-slate-800' : 'border-slate-200'
            }`}>
              <div className="flex gap-2">
                {['javascript', 'java', 'cpp'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => {
                      setSelectedLanguage(lang);
                      if (selectedProblem) {
                        const initialCode = selectedProblem.startCode?.find(
                          sc => sc.language === langMap[lang]
                        )?.initialCode || '';
                        setCode(initialCode);
                      }
                    }}
                    className={`group relative px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 overflow-hidden ${
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
              <div className="flex gap-3">
                <button
                  onClick={handleRun}
                  disabled={running}
                  className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all duration-300 overflow-hidden ${
                    darkMode
                      ? 'bg-gradient-to-r from-slate-800 to-gray-900 text-white hover:from-slate-700 hover:to-gray-800 border border-slate-700'
                      : 'bg-gradient-to-r from-white to-slate-50 text-slate-900 hover:from-slate-50 hover:to-slate-100 border border-slate-300'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Play className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">
                    {running ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Running...
                      </span>
                    ) : 'Run'}
                  </span>
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || isDisqualified}
                  className={`group relative flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-300 overflow-hidden shadow-lg ${
                    darkMode
                      ? 'bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700 hover:from-emerald-500 hover:via-green-500 hover:to-emerald-600 shadow-emerald-500/30'
                      : 'bg-gradient-to-r from-emerald-500 via-green-500 to-emerald-600 hover:from-emerald-600 hover:via-green-600 hover:to-emerald-700 shadow-emerald-500/30'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                  <Send className="w-4 h-4 relative z-10" />
                  <span className="relative z-10">
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Submitting...
                      </span>
                    ) : 'Submit'}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Content */}
            <div className="flex-1 overflow-y-auto">
              {activeRightTab === 'code' && (
                <div className="h-full animate-in fade-in slide-in-from-right-5 duration-500">
                  <Editor
                    height="100%"
                    language={getLanguageForMonaco(selectedLanguage)}
                    value={code}
                    onChange={(value) => setCode(value || '')}
                    theme={darkMode ? "vs-dark" : "light"}
                    options={{
                      fontSize: 14,
                      minimap: { enabled: false },
                      scrollBeyondLastLine: false,
                      automaticLayout: true,
                      tabSize: 2,
                      wordWrap: 'on',
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
              )}

              {activeRightTab === 'testcase' && (
                <div className="p-6 animate-in fade-in duration-500">
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
                              <CheckCircle className="w-6 h-6 text-emerald-500" />
                            </div>
                            <div>
                              <h4 className={`text-2xl font-bold ${darkMode ? 'text-emerald-400' : 'text-emerald-700'}`}>
                                All Tests Passed! ✅
                              </h4>
                              <p className={`mt-1 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                Your code is ready for submission
                              </p>
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-6">
                            {runResult.testCases?.map((tc, idx) => (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-xl border transition-all duration-300 hover:scale-[1.01] ${
                                  darkMode 
                                    ? 'bg-slate-800/50 border-slate-700 hover:border-emerald-500/50' 
                                    : 'bg-white border-slate-200 hover:border-emerald-300'
                                }`}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white">Test {idx + 1}</span>
                                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                                      darkMode 
                                        ? 'bg-emerald-500/20 text-emerald-400' 
                                        : 'bg-emerald-100 text-emerald-700'
                                    }`}>
                                      ✓ Passed
                                    </div>
                                  </div>
                                  <div className="text-sm text-slate-300 space-y-2">
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">Input</div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                        {tc.stdin}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">Output</div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                        {tc.stdout}
                                      </div>
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
                              <XCircle className="w-6 h-6 text-rose-500" />
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
                            {runResult.testCases?.map((tc, idx) => (
                              <div 
                                key={idx} 
                                className={`p-4 rounded-xl border transition-all duration-300 ${
                                  darkMode 
                                    ? 'bg-slate-800/50 border-slate-700' 
                                    : 'bg-white border-slate-200'
                                } ${tc.status_id !== 3 ? 'ring-2 ring-rose-500/20' : ''}`}
                              >
                                <div className="space-y-3">
                                  <div className="flex items-center justify-between">
                                    <span className="font-semibold text-white">Test {idx + 1}</span>
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
                                  <div className="text-sm text-slate-300 space-y-2">
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">Input</div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                        {tc.stdin}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">Expected</div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                        {tc.expected_output}
                                      </div>
                                    </div>
                                    <div>
                                      <div className="text-xs text-slate-400 mb-1">Your Output</div>
                                      <div className={`p-2 rounded-lg ${darkMode ? 'bg-slate-900' : 'bg-slate-100'}`}>
                                        {tc.stdout}
                                      </div>
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
                      <p className="text-lg">Click "Run" to test your code</p>
                      <p className="text-sm mt-2 opacity-75">Test before submitting!</p>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'result' && (
                <div className="p-6 animate-in fade-in duration-500">
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
                            <CheckCircle className={`relative w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          </div>
                          <div>
                            <h4 className={`text-3xl font-bold mb-3 bg-gradient-to-r ${darkMode ? 'from-emerald-400 to-green-400' : 'from-emerald-600 to-green-600'} bg-clip-text text-transparent`}>
                              🎉 Problem Solved!
                            </h4>
                            <p className={`text-lg ${darkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                              Excellent work! Your solution has been accepted.
                            </p>
                          </div>
                          <div className={`grid grid-cols-2 gap-4 pt-8 border-t ${darkMode ? 'border-emerald-700/30' : 'border-emerald-200'}`}>
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
                              <div className={`text-sm mb-2 ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>Score</div>
                              <div className={`text-3xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                +{submitResult.passedTestCases * 10}
                              </div>
                              <div className={`text-xs mt-1 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`}>
                                Points Earned
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-8 text-center">
                          <div className="relative">
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-rose-500/10 to-transparent -translate-x-full animate-shimmer" />
                            <XCircle className={`relative w-20 h-20 mx-auto mb-6 ${darkMode ? 'text-rose-400' : 'text-rose-600'}`} />
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
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className={`text-center py-16 ${darkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                      <div className="relative inline-block mb-4">
                        <Trophy className="w-16 h-16 mx-auto opacity-50" />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full animate-shimmer" />
                      </div>
                      <p className="text-lg">Submit your solution to see results</p>
                      <p className="text-sm mt-2 opacity-75">Compete for the top spot on the leaderboard!</p>
                    </div>
                  )}
                </div>
              )}

              {activeRightTab === 'leaderboard' && (
                <div className="p-6 animate-in fade-in duration-500">
                  <h3 className={`text-2xl font-bold mb-8 text-center ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                    <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                      Live Leaderboard 🏆
                    </span>
                  </h3>
                  <div className="space-y-4">
                    {leaderboard.map((entry, idx) => {
                      const isCurrentUser = (entry.userId._id || entry.userId) === user?._id;
                      return (
                        <div
                          key={entry.userId._id || entry.userId}
                          className={`relative rounded-xl p-6 transition-all duration-300 hover:scale-[1.01] ${
                            isCurrentUser
                              ? darkMode
                                ? 'bg-gradient-to-r from-orange-900/30 to-orange-800/30 border-2 border-orange-500'
                                : 'bg-gradient-to-r from-orange-100 to-orange-50 border-2 border-orange-500'
                              : darkMode
                                ? 'bg-slate-800/50 border border-slate-700 hover:border-slate-600'
                                : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`relative w-12 h-12 rounded-xl flex items-center justify-center font-bold text-lg shadow-lg ${
                                idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                                idx === 1 ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white' :
                                idx === 2 ? 'bg-gradient-to-r from-orange-800 to-amber-800 text-white' :
                                darkMode 
                                  ? 'bg-gradient-to-r from-slate-700 to-gray-700 text-slate-300' 
                                  : 'bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700'
                              }`}>
                                {idx === 0 ? <Crown className="w-6 h-6" /> : idx + 1}
                                {isCurrentUser && (
                                  <div className="absolute -top-2 -right-2">
                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                      darkMode ? 'bg-blue-500' : 'bg-blue-600'
                                    }`}>
                                      <UserCheck className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                )}
                              </div>
                              <div>
                                <div className={`text-lg font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                  {entry.userId?.firstName || 'User'} {entry.userId?.lastName || ''}
                                </div>
                                <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                  {entry.problemsSolved} problem{entry.problemsSolved !== 1 ? 's' : ''} solved
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                                {entry.totalTestCasesPassed}
                              </div>
                              <div className={`text-sm ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                                test cases
                              </div>
                            </div>
                          </div>
                          {idx === 0 && leaderboard.length > 1 && (
                            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                              <div className={`px-3 py-1 rounded-full text-xs font-bold ${
                                darkMode 
                                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                                  : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                              }`}>
                                🏆 LEADER
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {arena.status === 'ended' && (
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto bg-gradient-to-br from-slate-900 to-gray-900 rounded-2xl p-8 border border-slate-800 shadow-2xl shadow-blue-900/10">
            <h2 className="text-4xl font-bold text-center mb-8">
              <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">
                🏆 Tournament Results
              </span>
            </h2>
            
            <div className="space-y-6 mb-8">
              {leaderboard.map((entry, idx) => {
                const isCurrentUser = (entry.userId._id || entry.userId) === user?._id;
                return (
                  <div
                    key={entry.userId._id || entry.userId}
                    className={`relative rounded-2xl p-8 transition-all duration-300 hover:scale-[1.01] ${
                      idx === 0
                        ? 'bg-gradient-to-r from-amber-500/20 to-orange-500/20 border-2 border-amber-500/30'
                        : darkMode
                          ? 'bg-slate-800/50 border border-slate-700'
                          : 'bg-gradient-to-br from-white to-slate-50 border border-slate-200'
                    } ${isCurrentUser ? 'ring-2 ring-blue-500' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6">
                        <div className={`relative w-16 h-16 rounded-2xl flex items-center justify-center font-bold text-2xl shadow-2xl ${
                          idx === 0 ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' :
                          idx === 1 ? 'bg-gradient-to-r from-slate-600 to-gray-600 text-white' :
                          idx === 2 ? 'bg-gradient-to-r from-orange-800 to-amber-800 text-white' :
                          darkMode 
                            ? 'bg-gradient-to-r from-slate-700 to-gray-700 text-slate-300' 
                            : 'bg-gradient-to-r from-slate-200 to-gray-200 text-slate-700'
                        }`}>
                          {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                        </div>
                        <div>
                          <div className={`text-2xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                            {entry.userId?.firstName || 'User'} {entry.userId?.lastName || ''}
                            {isCurrentUser && (
                              <span className="text-sm text-blue-500 ml-2">(You)</span>
                            )}
                          </div>
                          <div className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                            {entry.problemsSolved} problem{entry.problemsSolved !== 1 ? 's' : ''} solved
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-4xl font-bold ${darkMode ? 'text-white' : 'text-slate-900'}`}>
                          {entry.totalTestCasesPassed}
                        </div>
                        <div className={`text-lg ${darkMode ? 'text-slate-400' : 'text-slate-600'}`}>
                          test cases
                        </div>
                      </div>
                    </div>
                    {idx === 0 && (
                      <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                        <div className={`px-4 py-2 rounded-full text-sm font-bold ${
                          darkMode 
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white' 
                            : 'bg-gradient-to-r from-amber-400 to-orange-400 text-white'
                        }`}>
                          🏆 CHAMPION
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            
            <button
              onClick={() => navigate('/friend-arena')}
              className={`group relative w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold py-4 px-6 rounded-2xl transition-all overflow-hidden text-lg`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              <span className="relative z-10 flex items-center justify-center gap-3">
                <ArrowLeft className="w-5 h-5" />
                Return to Arena Lobby
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Custom CSS for Animations */}
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

        @keyframes zoom-in {
          from {
            opacity: 0;
            transform: scale(0.5);
          }
          to {
            opacity: 1;
            transform: scale(1);
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

        .zoom-in {
          animation: zoom-in 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .animate-shimmer {
          animation: shimmer 2s infinite;
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
}

export default FriendArenaPage;