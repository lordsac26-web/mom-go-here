import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import Layout from './components/Layout';
import Home from './pages/Home';
import Games from './pages/Games';
import Settings from './pages/Settings';
import Daily from './pages/Daily';
import MemoryGame from './pages/games/MemoryGame';
import TicTacToe from './pages/games/TicTacToe';
import Yahtzee from './pages/games/Yahtzee';
import WordSearch from './pages/games/WordSearch';
import Sudoku from './pages/games/Sudoku';
import Checkers from './pages/games/Checkers';
import Mahjong from './pages/games/Mahjong';
import Solitaire from './pages/games/Solitaire';
import SpotDiff from './pages/games/SpotDiff';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/games" element={<Games />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/daily" element={<Daily />} />
        <Route path="/games/memory" element={<MemoryGame />} />
        <Route path="/games/tictactoe" element={<TicTacToe />} />
        <Route path="/games/yahtzee" element={<Yahtzee />} />
        <Route path="/games/wordsearch" element={<WordSearch />} />
        <Route path="/games/sudoku" element={<Sudoku />} />
        <Route path="/games/checkers" element={<Checkers />} />
        <Route path="/games/mahjong" element={<Mahjong />} />
        <Route path="/games/solitaire" element={<Solitaire />} />
        <Route path="/games/spotdiff" element={<SpotDiff />} />
        <Route path="/progress" element={<Progress />} />
        <Route path="/onboarding" element={<Onboarding />} />
        <Route path="*" element={<PageNotFound />} />
      </Route>
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App