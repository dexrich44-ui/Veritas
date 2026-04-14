import React, { createContext, useContext, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useParams, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, signInWithPopup, signOut, User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot, collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { auth, db, googleProvider } from './lib/firebase';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageCircle, 
  User, 
  Heart, 
  Zap, 
  Send, 
  Inbox, 
  BarChart3, 
  LogOut, 
  Share2, 
  Lock,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Gamepad2,
  AlertTriangle,
  Trophy,
  Dice5,
  MessageSquare,
  Search,
  Video,
  Image as ImageIcon,
  Trash2,
  Ban,
  Users
} from 'lucide-react';
import { cn } from './lib/utils';

// --- Types ---
interface UserProfile {
  uid: string;
  name: string;
  username: string;
  photoUrl: string;
  bio: string;
  points: number;
  personality?: any;
  lastSeen?: any;
  isSuspended?: boolean;
  suspendedUntil?: any;
}

interface Message {
  id: string;
  toUserId: string;
  fromUserId?: string;
  replyTo?: string;
  title?: string;
  content: string;
  type: 'truth' | 'dare' | 'crush' | 'friend';
  createdAt: any;
  hints?: string[];
  unlockedHints?: number;
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

interface Question {
  id: string;
  text: string;
  type: 'truth' | 'dare' | 'likely';
  category?: 'spicy' | 'funny' | 'heavy' | 'normal';
  createdBy?: string;
  createdAt: any;
}

interface Answer {
  id: string;
  questionId: string;
  userId: string;
  content: string;
  anonymous: boolean;
  createdAt: any;
}

interface Vote {
  id: string;
  questionId: string;
  votedUserId: string;
  voterId: string;
  createdAt: any;
}

interface Interest {
  id: string;
  fromUserId: string;
  toUserId: string;
  createdAt: any;
}

interface Match {
  id: string;
  users: string[];
  status: 'pending' | 'matched';
  createdAt: any;
}

// --- Context ---
const AuthContext = createContext<{
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
} | null>(null);

const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};

// --- Components ---

const Navbar = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t border-gray-200 px-6 py-3 z-50 md:top-0 md:bottom-auto md:border-t-0 md:border-b">
      <div className="max-w-md mx-auto flex justify-between items-center md:max-w-4xl">
        <button onClick={() => navigate('/')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black transition-colors">
          <Inbox size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Inbox</span>
        </button>
        <button onClick={() => navigate('/games')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black transition-colors">
          <Gamepad2 size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Jogos</span>
        </button>
        <button onClick={() => navigate('/personality')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black transition-colors">
          <BarChart3 size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Análise</span>
        </button>
        <button onClick={() => navigate('/profile')} className="flex flex-col items-center gap-1 text-gray-500 hover:text-black transition-colors">
          <User size={24} />
          <span className="text-[10px] font-medium uppercase tracking-wider">Perfil</span>
        </button>
      </div>
    </nav>
  );
};

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      toast.success('Bem-vindo ao Veritas!');
    } catch (error) {
      toast.error('Erro ao fazer login');
    }
  };

  if (user) return <Navigate to="/" />;

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 overflow-hidden">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-8 max-w-lg"
      >
        <div className="space-y-2">
          <motion.h1 
            className="text-[20vw] md:text-[120px] font-black leading-[0.8] tracking-tighter uppercase italic"
            initial={{ scale: 1.2, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            Veritas
          </motion.h1>
          <p className="text-gray-400 text-lg font-medium tracking-tight">
            Verdades anônimas. Conexões reais.
          </p>
        </div>

        <div className="grid gap-4 text-left">
          <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-2 bg-orange-500 rounded-lg"><Zap size={20} /></div>
            <div>
              <h3 className="font-bold">Curiosidade Progressiva</h3>
              <p className="text-sm text-gray-400">Receba dicas sobre quem te enviou a mensagem.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-2 bg-blue-500 rounded-lg"><BarChart3 size={20} /></div>
            <div>
              <h3 className="font-bold">Análise de Personalidade</h3>
              <p className="text-sm text-gray-400">Descubra como as pessoas te vêem de verdade.</p>
            </div>
          </div>
          <div className="flex gap-4 items-start p-4 bg-white/5 rounded-2xl border border-white/10">
            <div className="p-2 bg-pink-500 rounded-lg"><Heart size={20} /></div>
            <div>
              <h3 className="font-bold">Match Invisível</h3>
              <p className="text-sm text-gray-400">Se o interesse for mútuo, nós revelamos.</p>
            </div>
          </div>
        </div>

        <button 
          onClick={handleLogin}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all active:scale-95"
        >
          Começar Agora
        </button>

        <a 
          href="https://chat.whatsapp.com/Ca795G7Pvez81DDyHaA3yx?mode=gi_t"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-500 hover:text-green-400 transition-colors"
        >
          <MessageSquare size={14} /> Entrar na Comunidade WhatsApp
        </a>
      </motion.div>
    </div>
  );
};

const Dashboard = () => {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserProfile[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const prevOnlineUsers = React.useRef<string[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch online users (active in last 5 mins)
    const fiveMinsAgo = new Date(Date.now() - 300000);
    const q = query(
      collection(db, 'users'),
      where('lastSeen', '>=', fiveMinsAgo),
      limit(10)
    );
    return onSnapshot(q, (snap) => {
      const currentOnline = snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)).filter(u => u.uid !== user?.uid);
      
      // Notify if someone new came online
      currentOnline.forEach(u => {
        if (!prevOnlineUsers.current.includes(u.uid)) {
          toast.success(`${u.name} está online agora! 🟢`, {
            duration: 3000,
            icon: <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          });
        }
      });
      
      prevOnlineUsers.current = currentOnline.map(u => u.uid);
      setOnlineUsers(currentOnline);
    });
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'messages'), 
      where('toUserId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    return onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
  }, [user]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const q = query(
        collection(db, 'users'),
        where('username', '>=', searchQuery.toLowerCase()),
        where('username', '<=', searchQuery.toLowerCase() + '\uf8ff'),
        limit(5)
      );
      const snap = await getDocs(q);
      setSearchResults(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    } catch (error) {
      toast.error('Erro ao buscar usuários');
    } finally {
      setIsSearching(false);
    }
  };

  const copyLink = () => {
    const link = `${window.location.origin}/u/${profile?.username}`;
    navigator.clipboard.writeText(link);
    toast.success('Link copiado!');
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        {/* Top Header */}
        <div className="flex justify-between items-center px-2">
          <h1 className="text-2xl font-black italic uppercase tracking-tighter">Veritas</h1>
          <div className="flex gap-2">
            <a 
              href="https://chat.whatsapp.com/Ca795G7Pvez81DDyHaA3yx?mode=gi_t"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-green-100 text-green-600 px-3 py-1.5 rounded-full"
            >
              <MessageSquare size={14} /> WhatsApp
            </a>
            <button 
              onClick={() => navigate('/games')}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-orange-100 text-orange-600 px-3 py-1.5 rounded-full"
            >
              <Gamepad2 size={14} /> Jogos
            </button>
          </div>
        </div>

        {/* Profile Card */}
        <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative">
              <img 
                src={profile?.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} 
                className="w-16 h-16 rounded-2xl bg-gray-100"
                alt="Profile"
              />
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold">Olá, {profile?.name}</h2>
              <div className="flex items-center gap-2">
                <p className="text-gray-500 text-sm">@{profile?.username}</p>
                <div className="flex items-center gap-1 bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full text-[10px] font-bold">
                  <Zap size={10} fill="currentColor" /> {profile?.points || 0} pts
                </div>
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button 
              onClick={copyLink}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-black text-white rounded-2xl font-bold text-sm"
            >
              <Share2 size={18} /> Compartilhar Link
            </button>
            <button 
              onClick={() => navigate('/games')}
              className="flex-1 flex items-center justify-center gap-2 py-3 bg-orange-500 text-white rounded-2xl font-bold text-sm"
            >
              <Gamepad2 size={18} /> Jogos
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Mensagens</p>
            <p className="text-2xl font-black">{messages.length}</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-gray-100">
            <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">Pontos</p>
            <p className="text-2xl font-black">{profile?.points || 0}</p>
          </div>
        </div>

        {/* User Search */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Buscar usuários por @username..."
              className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-4 text-sm shadow-sm focus:outline-none focus:border-black transition-all pl-12"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black text-white px-4 py-1.5 rounded-xl text-xs font-bold"
            >
              {isSearching ? '...' : 'Buscar'}
            </button>
          </form>

          <AnimatePresence>
            {searchResults.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden"
              >
                {searchResults.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => navigate(`/u/${u.username}`)}
                    className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0"
                  >
                    <div className="relative">
                      <img src={u.photoUrl} className="w-10 h-10 rounded-xl" alt={u.name} />
                      {u.lastSeen && (Date.now() - u.lastSeen.toDate().getTime() < 300000) && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-bold text-sm">{u.name}</p>
                      <p className="text-xs text-gray-500">@{u.username}</p>
                    </div>
                    <ChevronRight className="ml-auto text-gray-300" size={16} />
                  </button>
                ))}
                <button 
                  onClick={() => setSearchResults([])}
                  className="w-full py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                >
                  Fechar Resultados
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Online Now */}
        {onlineUsers.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 px-2 flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
              Online Agora
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-2">
              {onlineUsers.map((u) => (
                <motion.button
                  key={u.uid}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => navigate(`/u/${u.username}`)}
                  className="flex flex-col items-center gap-1 min-w-[64px]"
                >
                  <div className="relative">
                    <img src={u.photoUrl} className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-gray-100" alt={u.name} />
                    <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                  </div>
                  <span className="text-[10px] font-bold text-gray-600 truncate w-16 text-center">{u.name.split(' ')[0]}</span>
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Invite Friends */}
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-6 rounded-[32px] text-white space-y-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-3xl" />
          <div className="relative z-10 space-y-4">
            <div className="space-y-1">
              <h3 className="text-xl font-black italic uppercase tracking-tighter">Convide Amigos</h3>
              <p className="text-xs opacity-70">Traga sua galera para o Veritas e ganhe pontos!</p>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => {
                  const text = `Ei! Entra no Veritas pra gente conversar anonimamente 🕵️‍♂️✨ Meu link: ${window.location.origin}/u/${profile?.username}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                }}
                className="flex-1 py-3 bg-green-500 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <MessageSquare size={16} /> WhatsApp
              </button>
              <button 
                onClick={() => {
                  const url = `${window.location.origin}/u/${profile?.username}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                }}
                className="flex-1 py-3 bg-blue-600 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 size={16} /> Facebook
              </button>
            </div>
          </div>
        </div>

        {/* Inbox */}
        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-2">Inbox</h3>
          {messages.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto text-gray-300">
                <Inbox size={32} />
              </div>
              <p className="text-gray-400 font-medium">Nenhuma mensagem ainda.<br/>Compartilhe seu link!</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {messages.map((msg) => (
                <motion.div 
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:border-black transition-all cursor-pointer group"
                  onClick={() => navigate(`/message/${msg.id}`)}
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className={cn(
                      "text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md",
                      msg.type === 'crush' ? "bg-pink-100 text-pink-600" :
                      msg.type === 'truth' ? "bg-blue-100 text-blue-600" :
                      "bg-gray-100 text-gray-600"
                    )}>
                      {msg.type}
                    </span>
                    <span className="text-[10px] text-gray-400 font-medium">
                      {new Date(msg.createdAt?.toDate()).toLocaleDateString()}
                    </span>
                  </div>
                  {msg.title && (
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{msg.title}</p>
                  )}
                  <p className="text-gray-800 font-medium line-clamp-2">{msg.content}</p>
                  <div className="mt-3 flex items-center gap-1 text-orange-500 text-[10px] font-bold uppercase tracking-wider opacity-0 group-hover:opacity-100 transition-opacity">
                    Ver detalhes <ChevronRight size={12} />
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const PublicProfile = () => {
  const { username } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<UserProfile | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [type, setType] = useState<'truth' | 'dare' | 'crush' | 'friend'>('truth');
  const [mediaUrl, setMediaUrl] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [showMediaInput, setShowMediaInput] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastSentId, setLastSentId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const q = query(collection(db, 'users'), where('username', '==', username));
      const snap = await getDocs(q);
      if (!snap.empty) {
        setTargetUser({ uid: snap.docs[0].id, ...snap.docs[0].data() } as UserProfile);
      }
      setLoading(false);
    };
    fetchUser();
  }, [username]);

  const handleSend = async () => {
    if (!content.trim() || !targetUser) return;
    
    // Simple spam protection
    const lastSent = localStorage.getItem('last_sent_timestamp');
    if (lastSent && Date.now() - parseInt(lastSent) < 30000) {
      toast.error('Aguarde 30 segundos entre mensagens para evitar spam.');
      return;
    }

    setSending(true);
    try {
      const msgRef = doc(collection(db, 'messages'));
      await setDoc(msgRef, {
        toUserId: targetUser.uid,
        title: title.trim(),
        content,
        type,
        mediaUrl: showMediaInput ? mediaUrl : null,
        mediaType: showMediaInput ? mediaType : null,
        createdAt: new Date(),
        hints: [
          "Enviado por alguém que você conhece",
          "Esta pessoa já falou com você antes",
          "Esta pessoa está nos seus contatos"
        ],
        unlockedHints: 0
      });
      setLastSentId(msgRef.id);
      localStorage.setItem('last_sent_timestamp', Date.now().toString());
      toast.success('Mensagem enviada anonimamente!');
      setContent('');
      setTitle('');
      setMediaUrl('');
      setShowMediaInput(false);
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const handleReport = async () => {
    if (!targetUser) return;
    const reason = window.prompt('Por que você está denunciando este perfil?');
    if (!reason) return;

    try {
      await setDoc(doc(collection(db, 'reports')), {
        targetUserId: targetUser.uid,
        reason,
        createdAt: new Date()
      });
      toast.success('Denúncia enviada. Analisaremos em breve.');
    } catch (error) {
      toast.error('Erro ao enviar denúncia');
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!targetUser) return <div className="min-h-screen flex items-center justify-center">Usuário não encontrado</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md space-y-8"
      >
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <img 
              src={targetUser.photoUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.username}`} 
              className="w-full h-full rounded-[32px] bg-white/10 p-1 border-2 border-white/20"
              alt="Profile"
            />
            {targetUser.lastSeen && (Date.now() - targetUser.lastSeen.toDate().getTime() < 300000) && (
              <div className="absolute -top-1 -right-1 bg-green-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full border-2 border-black uppercase tracking-widest animate-pulse">
                Online
              </div>
            )}
          </div>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tight">Mande uma verdade para {targetUser.name}</h2>
            <p className="text-gray-400 text-sm">Ele(a) nunca saberá quem enviou... a menos que você queira.</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {(['truth', 'crush', 'dare', 'friend'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setType(t)}
                className={cn(
                  "px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  type === t ? "bg-white text-black border-white" : "bg-transparent text-gray-500 border-white/10"
                )}
              >
                {t === 'truth' ? 'Verdade' : t === 'crush' ? 'Crush' : t === 'dare' ? 'Desafio' : 'Amizade'}
              </button>
            ))}
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título ou tema (ex: Uma verdade...)"
              className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-white/30 transition-all"
            />
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Escreva algo anônimo..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-[32px] p-6 text-lg focus:outline-none focus:border-white/30 transition-all resize-none"
            />
          </div>

          <div className="space-y-2">
            <button 
              onClick={() => setShowMediaInput(!showMediaInput)}
              className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
              {showMediaInput ? <Trash2 size={14} /> : <ImageIcon size={14} />} 
              {showMediaInput ? 'Remover Mídia' : 'Anexar Foto/Vídeo'}
            </button>
            
            {showMediaInput && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/10"
              >
                <div className="flex gap-2">
                  <button 
                    onClick={() => setMediaType('image')}
                    className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold uppercase", mediaType === 'image' ? "bg-white text-black" : "bg-white/5")}
                  >
                    Imagem
                  </button>
                  <button 
                    onClick={() => setMediaType('video')}
                    className={cn("flex-1 py-2 rounded-xl text-[10px] font-bold uppercase", mediaType === 'video' ? "bg-white text-black" : "bg-white/5")}
                  >
                    Vídeo
                  </button>
                </div>
                <input
                  type="text"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="URL da imagem ou vídeo..."
                  className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-white/30"
                />
                <p className="text-[8px] text-gray-500 uppercase font-bold">Dica: Use links do Imgur, Giphy ou YouTube</p>
              </motion.div>
            )}
          </div>

          <div className="space-y-3">
            <button
              onClick={handleSend}
              disabled={sending || !content.trim()}
              className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {sending ? 'Enviando...' : <><Send size={18} /> Enviar Anônimo</>}
            </button>

            {lastSentId && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                onClick={() => navigate(`/reply/${lastSentId}`)}
                className="w-full py-4 bg-white/10 text-white border border-white/20 font-black uppercase tracking-widest rounded-full hover:bg-white/20 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                <MessageCircle size={18} /> Responder
              </motion.button>
            )}

            <button
              onClick={handleReport}
              className="w-full py-2 text-gray-500 hover:text-red-500 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 transition-colors"
            >
              <AlertTriangle size={14} /> Denunciar Abuso
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
          <ShieldCheck size={14} /> 100% Seguro & Anônimo
        </div>
      </motion.div>
    </div>
  );
};

const ProfileSetup = () => {
  const { user } = useAuth();
  const [username, setUsername] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !username) return;
    setLoading(true);
    try {
      // Check if username exists
      const q = query(collection(db, 'users'), where('username', '==', username.toLowerCase()));
      const snap = await getDocs(q);
      if (!snap.empty) {
        toast.error('Username já em uso');
        return;
      }

      await setDoc(doc(db, 'users', user.uid), {
        name: user.displayName,
        username: username.toLowerCase(),
        photoUrl: user.photoURL,
        points: 0,
        bio: '',
        createdAt: new Date()
      });
      toast.success('Perfil criado!');
      window.location.reload();
    } catch (error) {
      toast.error('Erro ao criar perfil');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="space-y-2">
          <h2 className="text-4xl font-black italic uppercase tracking-tighter">Escolha seu Username</h2>
          <p className="text-gray-400">Este será o seu link para receber mensagens.</p>
        </div>

        <div className="relative">
          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 font-bold text-xl">veritas.app/u/</span>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, ''))}
            className="w-full py-6 pl-44 pr-6 bg-white/5 border border-white/10 rounded-[32px] text-xl focus:outline-none focus:border-white/30 transition-all"
            placeholder="seu_nome"
          />
        </div>

        <button
          onClick={handleSave}
          disabled={loading || username.length < 3}
          className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
        >
          {loading ? 'Salvando...' : 'Criar Perfil'}
        </button>
      </div>
    </div>
  );
};

const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    return onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u) {
        const userRef = doc(db, 'users', u.uid);
        const docSnap = await getDoc(userRef);
        if (docSnap.exists()) {
          const data = docSnap.data() as UserProfile;
          setProfile({ uid: docSnap.id, ...data } as UserProfile);
          
          // Update lastSeen
          await setDoc(userRef, { lastSeen: new Date() }, { merge: true });
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(async () => {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { lastSeen: new Date() }, { merge: true });
    }, 120000); // 2 minutes
    return () => clearInterval(interval);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, profile, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, profile } = useAuth();
  if (!user) return <Navigate to="/landing" />;
  if (!profile) return <ProfileSetup />;
  
  if (profile.isSuspended && profile.suspendedUntil) {
    const until = profile.suspendedUntil.toDate();
    if (until > new Date()) {
      return (
        <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center">
          <Ban size={64} className="text-red-500 mb-6" />
          <h2 className="text-3xl font-black uppercase italic mb-2">Conta Suspensa</h2>
          <p className="text-gray-400 mb-4">Sua conta foi suspensa por violação das regras.</p>
          <div className="bg-white/10 p-4 rounded-2xl">
            <p className="text-sm font-bold">Expira em:</p>
            <p className="text-xl font-black text-red-400">{until.toLocaleString()}</p>
          </div>
          <button onClick={() => signOut(auth)} className="mt-8 text-gray-500 underline">Sair</button>
        </div>
      );
    }
  }
  
  return <>{children}</>;
};

const AdminDashboard = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.email !== 'wdex30807@gmail.com') {
      navigate('/');
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      setUsers(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)));
    });

    const unsubMessages = onSnapshot(collection(db, 'messages'), (snap) => {
      setMessages(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });

    const unsubReports = onSnapshot(collection(db, 'reports'), (snap) => {
      setReports(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    setLoading(false);
    return () => {
      unsubUsers();
      unsubMessages();
      unsubReports();
    };
  }, [user, navigate]);

  const suspendUser = async (userId: string) => {
    const hours = 1;
    const until = new Date();
    until.setHours(until.getHours() + hours);
    
    try {
      await setDoc(doc(db, 'users', userId), {
        isSuspended: true,
        suspendedUntil: until
      }, { merge: true });
      toast.success(`Usuário suspenso por ${hours} hora`);
    } catch (error) {
      toast.error('Erro ao suspender usuário');
    }
  };

  if (loading) return <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">Carregando Painel Admin...</div>;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6 pb-24">
      <div className="max-w-6xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-black italic uppercase tracking-tighter flex items-center gap-2">
            <Lock className="text-red-500" /> Painel Império Veritas
          </h1>
          <div className="flex gap-4">
            <div className="bg-white/10 px-4 py-2 rounded-xl">
              <p className="text-[10px] font-bold uppercase opacity-50">Usuários</p>
              <p className="text-xl font-black">{users.length}</p>
            </div>
            <div className="bg-white/10 px-4 py-2 rounded-xl">
              <p className="text-[10px] font-bold uppercase opacity-50">Mensagens</p>
              <p className="text-xl font-black">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Users List */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Users size={20} /> Usuários</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {users.map(u => (
                <div key={u.uid} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <img src={u.photoUrl} className="w-10 h-10 rounded-xl" />
                    <div>
                      <p className="font-bold text-sm">{u.name}</p>
                      <p className="text-xs text-gray-400">@{u.username}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    {u.isSuspended ? (
                       <span className="text-[10px] bg-red-500/20 text-red-400 px-2 py-1 rounded-full font-bold">SUSPENSO</span>
                    ) : (
                      <button onClick={() => suspendUser(u.uid)} className="p-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all">
                        <Ban size={16} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Reports List */}
          <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><AlertTriangle size={20} className="text-orange-500" /> Denúncias</h2>
            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {reports.map(r => (
                <div key={r.id} className="bg-white/5 p-3 rounded-2xl space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase text-gray-400">
                    <span>ID Alvo: {r.targetUserId}</span>
                    <span>{new Date(r.createdAt?.toDate()).toLocaleString()}</span>
                  </div>
                  <p className="text-sm italic">"{r.reason}"</p>
                  <button onClick={() => suspendUser(r.targetUserId)} className="w-full py-2 bg-red-500 text-white rounded-xl text-xs font-bold">
                    Suspender Alvo
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Messages (No Privacy) */}
        <div className="bg-white/5 rounded-3xl p-6 border border-white/10 space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2"><MessageCircle size={20} /> Todas as Mensagens (Verredura)</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {messages.map(m => (
              <div key={m.id} className="bg-white/5 p-4 rounded-2xl space-y-2 border border-white/5">
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold bg-white/10 px-2 py-1 rounded-md uppercase">{m.type}</span>
                  <span className="text-[10px] text-gray-500">{new Date(m.createdAt?.toDate()).toLocaleString()}</span>
                </div>
                <p className="text-xs text-gray-400">Para: {m.toUserId}</p>
                <p className="text-sm font-medium">"{m.content}"</p>
                {m.mediaUrl && (
                  <div className="mt-2 rounded-xl overflow-hidden border border-white/10">
                    {m.mediaType === 'image' ? (
                      <img src={m.mediaUrl} className="w-full h-32 object-cover" />
                    ) : (
                      <video src={m.mediaUrl} className="w-full h-32 object-cover" controls />
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

const MessageDetails = () => {
  const { id } = useParams();
  const { user, profile } = useAuth();
  const [message, setMessage] = useState<Message | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!id) return;
    return onSnapshot(doc(db, 'messages', id), (doc) => {
      if (doc.exists()) {
        setMessage({ id: doc.id, ...doc.data() } as Message);
      }
    });
  }, [id]);

  const unlockHint = async () => {
    if (!message || !id || !user || !profile) return;
    const currentUnlocked = message.unlockedHints || 0;
    if (currentUnlocked >= (message.hints?.length || 0)) {
      toast.info('Todas as dicas já foram desbloqueadas!');
      return;
    }

    const cost = 50;
    if ((profile.points || 0) < cost) {
      toast.error(`Você precisa de ${cost} pontos para desbloquear uma dica. Jogue para ganhar!`);
      return;
    }

    try {
      // Deduct points
      await setDoc(doc(db, 'users', user.uid), {
        points: profile.points - cost
      }, { merge: true });

      // Unlock hint
      await setDoc(doc(db, 'messages', id), {
        unlockedHints: currentUnlocked + 1
      }, { merge: true });
      
      toast.success('Dica desbloqueada! -50 pontos');
    } catch (error) {
      toast.error('Erro ao desbloquear dica');
    }
  };

  if (!message) return null;

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center space-y-6"
        >
          <div className="space-y-2">
            <div className="inline-block px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-500">
              {message.type}
            </div>
            {message.title && (
              <h4 className="text-[10px] font-black uppercase tracking-widest text-orange-500">{message.title}</h4>
            )}
          </div>
          <p className="text-2xl font-bold leading-tight text-gray-900">"{message.content}"</p>
          
          {message.mediaUrl && (
            <div className="mt-4 rounded-3xl overflow-hidden border border-gray-100 shadow-sm">
              {message.mediaType === 'image' ? (
                <img src={message.mediaUrl} className="w-full h-auto max-h-[400px] object-cover" referrerPolicy="no-referrer" />
              ) : (
                <video src={message.mediaUrl} className="w-full h-auto max-h-[400px]" controls />
              )}
            </div>
          )}
          
          <p className="text-xs text-gray-400 font-medium">Recebida em {new Date(message.createdAt?.toDate()).toLocaleString()}</p>
        </motion.div>

        <div className="space-y-4">
          <h3 className="text-sm font-black uppercase tracking-widest text-gray-400 px-2 flex items-center gap-2">
            <Lock size={14} /> Sistema de Curiosidade
          </h3>
          
          <div className="space-y-3">
            {message.hints?.map((hint, index) => {
              const isUnlocked = (message.unlockedHints || 0) > index;
              return (
                <div 
                  key={index}
                  className={cn(
                    "p-4 rounded-2xl border transition-all flex items-center justify-between",
                    isUnlocked ? "bg-white border-gray-100" : "bg-gray-100/50 border-dashed border-gray-200 opacity-60"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold",
                      isUnlocked ? "bg-orange-100 text-orange-600" : "bg-gray-200 text-gray-400"
                    )}>
                      {index + 1}
                    </div>
                    <p className={cn("text-sm font-medium", !isUnlocked && "blur-sm select-none")}>
                      {isUnlocked ? hint : "Dica bloqueada"}
                    </p>
                  </div>
                  {!isUnlocked && index === (message.unlockedHints || 0) && (
                    <button 
                      onClick={unlockHint}
                      className="px-3 py-1 bg-black text-white text-[10px] font-black uppercase tracking-widest rounded-lg"
                    >
                      Desbloquear
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

const PersonalityAnalysis = () => {
  const { user, profile } = useAuth();
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);

  const runAnalysis = async () => {
    if (!user) return;
    setAnalyzing(true);
    try {
      // Fetch recent messages
      const q = query(collection(db, 'messages'), where('toUserId', '==', user.uid), limit(20));
      const snap = await getDocs(q);
      const messages = snap.docs.map(d => d.data().content);

      if (messages.length < 3) {
        toast.info('Receba pelo menos 3 mensagens para uma análise precisa!');
        setAnalyzing(false);
        return;
      }

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Analise as seguintes mensagens anônimas recebidas por um usuário e crie um perfil de personalidade baseado em como os outros o vêem. 
        Retorne um JSON com:
        - "vibe": uma frase curta descrevendo a energia do usuário.
        - "traits": array de 3 adjetivos.
        - "stats": array de objetos { label: string, value: number (0-100) } para "Confiabilidade", "Atratividade", "Mistério".
        - "insight": um conselho curto.
        
        Mensagens: ${messages.join(' | ')}`,
        config: { responseMimeType: "application/json" }
      });

      const data = JSON.parse(response.text);
      setAnalysis(data);
      
      // Save to profile
      await setDoc(doc(db, 'users', user.uid), { personality: data }, { merge: true });
      toast.success('Análise concluída!');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao processar análise');
    } finally {
      setAnalyzing(false);
    }
  };

  useEffect(() => {
    if (profile?.personality) {
      setAnalysis(profile.personality);
    }
  }, [profile]);

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Análise de Dados</h2>
          <p className="text-gray-500 text-sm">O que o mundo realmente pensa de você?</p>
        </div>

        {!analysis && !analyzing ? (
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-gray-100 text-center space-y-6">
            <div className="w-20 h-20 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center mx-auto">
              <Sparkles size={40} />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-bold">Pronto para a verdade?</h3>
              <p className="text-gray-500 text-sm">Nossa IA analisa suas mensagens para revelar sua identidade social.</p>
            </div>
            <button 
              onClick={runAnalysis}
              className="w-full py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-full hover:bg-blue-700 transition-all"
            >
              Gerar Análise
            </button>
          </div>
        ) : analyzing ? (
          <div className="bg-white p-12 rounded-[40px] shadow-sm border border-gray-100 text-center space-y-6">
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full mx-auto"
            />
            <p className="text-gray-500 font-bold animate-pulse">PROCESSANDO VERDADES...</p>
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-8 rounded-[40px] text-white space-y-4 shadow-xl">
              <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Sua Vibe Social</p>
              <h3 className="text-3xl font-bold leading-tight">"{analysis.vibe}"</h3>
              <div className="flex gap-2">
                {analysis.traits.map((t: string) => (
                  <span key={t} className="px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold uppercase tracking-widest">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 space-y-6">
              {analysis.stats.map((stat: any) => (
                <div key={stat.label} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-gray-400">
                    <span>{stat.label}</span>
                    <span>{stat.value}%</span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: 0 }}
                      animate={{ width: `${stat.value}%` }}
                      className="h-full bg-blue-600"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex gap-4 items-start">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg"><Zap size={20} /></div>
              <div>
                <h4 className="font-bold text-sm">Insight da IA</h4>
                <p className="text-sm text-gray-500">{analysis.insight}</p>
              </div>
            </div>

            <div className="space-y-3">
              <button 
                onClick={() => {
                  const text = `Minha vibe no Veritas: "${analysis.vibe}" 🕵️‍♂️✨ Descubra a sua em veritas.app/u/${profile?.username}`;
                  navigator.clipboard.writeText(text);
                  toast.success('Texto de compartilhamento copiado!');
                }}
                className="w-full py-4 bg-black text-white font-black uppercase tracking-widest rounded-full flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
              >
                <Share2 size={18} /> Compartilhar no Insta
              </button>
              
              <button 
                onClick={runAnalysis}
                className="w-full py-4 bg-gray-100 text-gray-600 font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all text-sm"
              >
                Atualizar Análise
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const Games = () => {
  const navigate = useNavigate();
  const games = [
    { id: 'truth-or-dare', title: 'Verdade ou Desafio', icon: <Dice5 />, color: 'bg-blue-500', desc: 'O clássico, agora anônimo.' },
    { id: 'most-likely-to', title: 'Quem é mais provável?', icon: <Trophy />, color: 'bg-orange-500', desc: 'Vote nos seus amigos.' },
    { id: 'secret-match', title: 'Match Secreto', icon: <Heart />, color: 'bg-pink-500', desc: 'Descubra interesses mútuos.' }
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-24 pt-6 px-4">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Arena de Jogos</h2>
          <p className="text-gray-500 text-sm">Transforme anonimato em diversão real.</p>
        </div>

        <div className="grid gap-4">
          {games.map((game) => (
            <motion.div 
              key={game.id}
              whileHover={{ scale: 1.02 }}
              onClick={() => navigate(`/games/${game.id}`)}
              className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 flex items-center gap-6 cursor-pointer"
            >
              <div className={cn("w-16 h-16 rounded-2xl flex items-center justify-center text-white", game.color)}>
                {React.cloneElement(game.icon as React.ReactElement, { size: 32 })}
              </div>
              <div>
                <h3 className="text-lg font-bold">{game.title}</h3>
                <p className="text-sm text-gray-500">{game.desc}</p>
              </div>
              <ChevronRight className="ml-auto text-gray-300" />
            </motion.div>
          ))}
        </div>

        <div className="bg-blue-600 p-8 rounded-[40px] text-white text-center space-y-4 shadow-xl">
          <Sparkles className="mx-auto" size={32} />
          <h3 className="text-xl font-bold">Novos jogos toda semana</h3>
          <p className="text-blue-100 text-sm">Estamos criando novas formas de você interagir com sua base.</p>
        </div>
      </div>
    </div>
  );
};

const TruthOrDare = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [category, setCategory] = useState<'normal' | 'funny' | 'spicy' | 'heavy'>('normal');
  const [question, setQuestion] = useState<Question | null>(null);
  const [answer, setAnswer] = useState('');
  const [anonymous, setAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('veritas_seen_questions');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchQuestion = async (cat: string) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, 'questions'), 
        where('type', 'in', ['truth', 'dare']),
        where('category', '==', cat),
        limit(50)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        const availableQuestions = snap.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as Question))
          .filter(q => !seenIds.includes(q.id));

        if (availableQuestions.length > 0) {
          const randomQ = availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
          setQuestion(randomQ);
        } else {
          // Reset seen for this category if all seen
          setSeenIds([]);
          localStorage.removeItem('veritas_seen_questions');
          const randomQ = snap.docs[Math.floor(Math.random() * snap.docs.length)];
          setQuestion({ id: randomQ.id, ...randomQ.data() } as Question);
        }
      } else {
        // Seed some questions if empty
        const seedQuestions = [
          { text: "Qual seu maior segredo?", type: "truth", category: "normal" },
          { text: "Dê um trote em alguém agora.", type: "dare", category: "funny" },
          { text: "Quem você pegaria desta sala?", type: "truth", category: "spicy" }
        ];
        const seed = seedQuestions.filter(q => q.category === cat)[0] || seedQuestions[0];
        setQuestion({ id: 'seed', ...seed, createdAt: new Date() } as Question);
      }
    } catch (error) {
      toast.error("Erro ao buscar pergunta");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuestion(category);
  }, [category]);

  const handleAnswer = async () => {
    if (!answer.trim() || !user || !question) return;
    setLoading(true);
    try {
      await setDoc(doc(collection(db, 'answers')), {
        questionId: question.id,
        userId: user.uid,
        content: answer,
        anonymous,
        createdAt: new Date()
      });
      
      // Mark as seen
      const newSeen = [...seenIds, question.id];
      setSeenIds(newSeen);
      localStorage.setItem('veritas_seen_questions', JSON.stringify(newSeen));

      // Award points
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { points: (profile?.points || 0) + 10 }, { merge: true });
      
      toast.success("Resposta enviada! +10 pontos");
      setAnswer('');
      fetchQuestion(category);
    } catch (error) {
      toast.error("Erro ao enviar resposta");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Verdade ou Desafio</h2>
          <div className="flex gap-2 justify-center overflow-x-auto py-2 no-scrollbar">
            {(['normal', 'funny', 'spicy', 'heavy'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={cn(
                  "px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap",
                  category === cat ? "bg-white text-black border-white" : "bg-transparent text-gray-500 border-white/10"
                )}
              >
                {cat === 'normal' ? 'Normal' : cat === 'funny' ? 'Engraçado' : cat === 'spicy' ? 'Picante' : 'Pesado'}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/5 p-8 rounded-[40px] border border-white/10 text-center space-y-6 min-h-[200px] flex flex-col justify-center">
          {loading ? (
            <div className="animate-pulse text-gray-500 font-black uppercase tracking-widest">Buscando...</div>
          ) : question ? (
            <>
              <span className="text-[10px] font-black uppercase tracking-widest text-blue-500">{question.type}</span>
              <p className="text-2xl font-bold leading-tight">"{question.text}"</p>
            </>
          ) : (
            <p className="text-gray-500">Nenhuma pergunta encontrada.</p>
          )}
        </div>

        <div className="space-y-4">
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Sua resposta..."
            className="w-full h-32 bg-white/5 border border-white/10 rounded-[32px] p-6 text-lg focus:outline-none focus:border-white/30 transition-all resize-none"
          />

          <div className="flex items-center justify-between px-4">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Enviar anonimamente?</span>
            <button 
              onClick={() => setAnonymous(!anonymous)}
              className={cn(
                "w-12 h-6 rounded-full transition-all relative",
                anonymous ? "bg-green-500" : "bg-gray-700"
              )}
            >
              <div className={cn(
                "absolute top-1 w-4 h-4 bg-white rounded-full transition-all",
                anonymous ? "right-1" : "left-1"
              )} />
            </button>
          </div>

          <button
            onClick={handleAnswer}
            disabled={loading || !answer.trim()}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Responder'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

const MostLikelyTo = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [question, setQuestion] = useState<Question | null>(null);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [seenIds, setSeenIds] = useState<string[]>(() => {
    const saved = localStorage.getItem('veritas_seen_likely');
    return saved ? JSON.parse(saved) : [];
  });

  const fetchNextQuestion = async () => {
    const qSnap = await getDocs(query(collection(db, 'questions'), where('type', '==', 'likely'), limit(50)));
    if (!qSnap.empty) {
      const available = qSnap.docs
        .map(doc => ({ id: doc.id, ...doc.data() } as Question))
        .filter(q => !seenIds.includes(q.id));

      if (available.length > 0) {
        setQuestion(available[Math.floor(Math.random() * available.length)]);
      } else {
        setSeenIds([]);
        localStorage.removeItem('veritas_seen_likely');
        const randomQ = qSnap.docs[Math.floor(Math.random() * qSnap.docs.length)];
        setQuestion({ id: randomQ.id, ...randomQ.data() } as Question);
      }
    } else {
      setQuestion({ id: 'seed', text: "Quem é mais provável de ficar rico?", type: 'likely', createdAt: new Date() } as Question);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      await fetchNextQuestion();
      // Fetch some users to vote for
      const uSnap = await getDocs(query(collection(db, 'users'), limit(10)));
      setUsers(uSnap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)).filter(u => u.uid !== user?.uid));
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleVote = async (targetUserId: string) => {
    if (!user || !question) return;
    try {
      await setDoc(doc(collection(db, 'votes')), {
        questionId: question.id,
        votedUserId: targetUserId,
        voterId: user.uid,
        createdAt: new Date()
      });

      // Mark as seen
      const newSeen = [...seenIds, question.id];
      setSeenIds(newSeen);
      localStorage.setItem('veritas_seen_likely', JSON.stringify(newSeen));

      // Award points
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, { points: (profile?.points || 0) + 5 }, { merge: true });

      toast.success("Voto computado! +5 pontos");
      fetchNextQuestion();
    } catch (error) {
      toast.error("Erro ao votar");
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-black text-white">Carregando...</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8 pt-12">
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <div className="text-center space-y-4">
          <span className="text-[10px] font-black uppercase tracking-widest text-orange-500">Quem é mais provável?</span>
          <h2 className="text-3xl font-bold leading-tight">"{question?.text}"</h2>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {users.map((u) => (
            <motion.button
              key={u.uid}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleVote(u.uid)}
              className="bg-white/5 border border-white/10 p-4 rounded-[32px] flex flex-col items-center gap-3 hover:bg-white/10 transition-all"
            >
              <img src={u.photoUrl} className="w-16 h-16 rounded-2xl" alt={u.name} />
              <div className="text-center">
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-[10px] text-gray-500">@{u.username}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
};

const SecretMatch = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [interests, setInterests] = useState<string[]>([]);
  const [hint, setHint] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'interests'), where('fromUserId', '==', user.uid));
    return onSnapshot(q, (snap) => {
      setInterests(snap.docs.map(doc => doc.data().toUserId));
    });
  }, [user]);

  const handleSearch = async () => {
    if (!search.trim()) return;
    const q = query(
      collection(db, 'users'), 
      where('username', '>=', search.toLowerCase()),
      where('username', '<=', search.toLowerCase() + '\uf8ff'),
      limit(5)
    );
    const snap = await getDocs(q);
    setResults(snap.docs.map(doc => ({ uid: doc.id, ...doc.data() } as UserProfile)).filter(u => u.uid !== user?.uid));
  };

  const toggleInterest = async (targetUserId: string) => {
    if (!user) return;
    try {
      if (interests.includes(targetUserId)) {
        // Remove interest (not implemented for simplicity, but could be)
        toast.info("Você já demonstrou interesse!");
      } else {
        await setDoc(doc(collection(db, 'interests')), {
          fromUserId: user.uid,
          toUserId: targetUserId,
          createdAt: new Date()
        });
        
        // Check for mutual interest
        const q = query(
          collection(db, 'interests'), 
          where('fromUserId', '==', targetUserId),
          where('toUserId', '==', user.uid)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          // Create Match
          await setDoc(doc(collection(db, 'matches')), {
            users: [user.uid, targetUserId],
            status: 'matched',
            createdAt: new Date()
          });
          toast.success("💘 É UM MATCH! Ambos têm interesse mútuo.");
        } else {
          toast.success("Interesse enviado em segredo! 😉");
        }
      }
    } catch (error) {
      toast.error("Erro ao processar interesse");
    }
  };

  const handleGetHint = async () => {
    if (!user) return;
    setLoadingHint(true);
    try {
      // Find who liked me
      const q = query(collection(db, 'interests'), where('toUserId', '==', user.uid));
      const snap = await getDocs(q);
      
      if (snap.empty) {
        toast.info("Ainda ninguém demonstrou interesse em você. Compartilhe seu link!");
        setLoadingHint(false);
        return;
      }

      // Pick one randomly
      const randomInterest = snap.docs[Math.floor(Math.random() * snap.docs.length)].data();
      const likerSnap = await getDoc(doc(db, 'users', randomInterest.fromUserId));
      
      if (!likerSnap.exists()) {
        toast.error("Erro ao buscar dados do admirador");
        setLoadingHint(false);
        return;
      }

      const liker = likerSnap.data() as UserProfile;

      const { GoogleGenAI } = await import('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: `Gere uma dica enigmática e divertida sobre uma pessoa que tem interesse no usuário. 
        A dica deve ser curta (máximo 15 palavras) e não revelar o nome completo.
        Dados da pessoa:
        - Nome: ${liker.name}
        - Username: ${liker.username}
        - Bio: ${liker.bio}
        
        Exemplo de dica: "Alguém cujo nome começa com ${liker.name[0]} e adora ${liker.bio.split(' ')[0]}."`,
      });

      setHint(response.text);
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar dica");
    } finally {
      setLoadingHint(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center">
      <div className="w-full max-w-md space-y-8 pt-12">
        <button onClick={() => navigate('/games')} className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <div className="text-center space-y-2">
          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-pink-500">Match Secreto</h2>
          <p className="text-gray-400 text-sm">Escolha quem você curte. Se for mútuo, revelamos.</p>
        </div>

        <div className="flex gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por @username..."
            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-6 py-3 text-sm focus:outline-none focus:border-white/30 transition-all"
          />
          <button onClick={handleSearch} className="bg-white text-black px-6 rounded-2xl font-bold text-sm">Buscar</button>
        </div>

        <div className="space-y-3">
          {results.map((u) => (
            <div key={u.uid} className="bg-white/5 border border-white/10 p-4 rounded-[32px] flex items-center gap-4">
              <img src={u.photoUrl} className="w-12 h-12 rounded-xl" alt={u.name} />
              <div className="flex-1">
                <p className="font-bold text-sm">{u.name}</p>
                <p className="text-[10px] text-gray-500">@{u.username}</p>
              </div>
              <button
                onClick={() => toggleInterest(u.uid)}
                className={cn(
                  "p-3 rounded-full transition-all",
                  interests.includes(u.uid) ? "bg-pink-500 text-white" : "bg-white/10 text-gray-400 hover:text-pink-500"
                )}
              >
                <Heart size={20} fill={interests.includes(u.uid) ? "currentColor" : "none"} />
              </button>
            </div>
          ))}
        </div>

        <div className="bg-pink-500/10 border border-pink-500/20 p-6 rounded-[32px] text-center space-y-4">
          <div className="space-y-2">
            <p className="text-xs font-bold text-pink-500 uppercase tracking-widest">Dica de Match 👀</p>
            {hint ? (
              <motion.p 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-sm text-white font-medium italic"
              >
                "{hint}"
              </motion.p>
            ) : (
              <p className="text-sm text-gray-400">Alguém que você conhece te curtiu recentemente!</p>
            )}
          </div>
          
          <button
            onClick={handleGetHint}
            disabled={loadingHint}
            className="w-full py-3 bg-pink-500 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-pink-600 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2 text-xs"
          >
            {loadingHint ? 'Gerando...' : <><Sparkles size={14} /> Revelar Dica com IA</>}
          </button>
        </div>
      </div>
    </div>
  );
};

const ReplyPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [parentMessage, setParentMessage] = useState<Message | null>(null);
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    const fetchParent = async () => {
      const docSnap = await getDoc(doc(db, 'messages', id));
      if (docSnap.exists()) {
        setParentMessage({ id: docSnap.id, ...docSnap.data() } as Message);
      }
      setLoading(false);
    };
    fetchParent();
  }, [id]);

  const handleReply = async () => {
    if (!content.trim() || !parentMessage) return;
    setSending(true);
    try {
      await setDoc(doc(collection(db, 'messages')), {
        toUserId: parentMessage.toUserId,
        replyTo: parentMessage.id,
        content,
        type: parentMessage.type,
        createdAt: new Date(),
        hints: parentMessage.hints,
        unlockedHints: 0
      });
      toast.success('Resposta enviada!');
      navigate(-1);
    } catch (error) {
      toast.error('Erro ao enviar resposta');
    } finally {
      setSending(false);
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;
  if (!parentMessage) return <div className="min-h-screen flex items-center justify-center">Mensagem não encontrada</div>;

  return (
    <div className="min-h-screen bg-black text-white p-6 flex flex-col items-center justify-center">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-8"
      >
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-500 font-bold text-sm uppercase tracking-widest">
          <ChevronRight className="rotate-180" size={16} /> Voltar
        </button>

        <div className="bg-white/5 p-6 rounded-[32px] border border-white/10 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Respondendo a:</p>
          <p className="text-lg font-medium italic">"{parentMessage.content}"</p>
        </div>

        <div className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Escreva sua resposta anônima..."
            className="w-full h-40 bg-white/5 border border-white/10 rounded-[32px] p-6 text-lg focus:outline-none focus:border-white/30 transition-all resize-none"
          />

          <button
            onClick={handleReply}
            disabled={sending || !content.trim()}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-full hover:bg-gray-200 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {sending ? 'Enviando...' : <><Send size={18} /> Enviar Resposta</>}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// --- App ---

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50 font-sans selection:bg-black selection:text-white">
          <Routes>
            <Route path="/landing" element={<Landing />} />
            <Route path="/u/:username" element={<PublicProfile />} />
            <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/profile" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
            <Route path="/message/:id" element={<PrivateRoute><MessageDetails /></PrivateRoute>} />
            <Route path="/personality" element={<PrivateRoute><PersonalityAnalysis /></PrivateRoute>} />
            <Route path="/games" element={<PrivateRoute><Games /></PrivateRoute>} />
            <Route path="/games/truth-or-dare" element={<PrivateRoute><TruthOrDare /></PrivateRoute>} />
            <Route path="/games/most-likely-to" element={<PrivateRoute><MostLikelyTo /></PrivateRoute>} />
            <Route path="/games/secret-match" element={<PrivateRoute><SecretMatch /></PrivateRoute>} />
            <Route path="/reply/:id" element={<ReplyPage />} />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
          <Navbar />
          <Toaster position="top-center" richColors />
        </div>
      </Router>
    </AuthProvider>
  );
}
