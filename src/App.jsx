import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ErrorBoundary from '@/components/ErrorBoundary';
import Layout from './components/Layout';
import PageTransition from './components/PageTransition';
import Home from './pages/Home';
import Games from './pages/Games';
import Settings from './pages/Settings';
import Daily from './pages/Daily';
import MemoryGame from './pages/games/MemoryGame';

import Yahtzee from './pages/games/Yahtzee';
import WordSearch from './pages/games/WordSearch';
import Sudoku from './pages/games/Sudoku';
import Checkers from './pages/games/Checkers';
import Mahjong from './pages/games/Mahjong';
import Solitaire from './pages/games/Solitaire';
import AIArtStudio from './pages/games/AIArtStudio';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';
import Memories from './pages/Memories';
import BuzzWord from './pages/games/WordWhomp';
import SlotMachine from './pages/games/SlotMachine';
import Contacts from './pages/Contacts';
import Rankings from './pages/Rankings';
import Scripture from './pages/Scripture';
import DailyChallenge from './pages/DailyChallenge';
import Achievements from './pages/Achievements';
import DartPopBlitz from './pages/games/DartPopBlitz';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Gallery from './pages/Gallery';
import Shop from './pages/Shop';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();
  const loc = useLocation();

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
    <AnimatePresence mode="wait">
      <Routes location={loc} key={loc.pathname}>
        <Route element={<Layout />}>
          <Route path="/" element={<PageTransition><Home /></PageTransition>} />
          <Route path="/games" element={<PageTransition><Games /></PageTransition>} />
          <Route path="/settings" element={<PageTransition><Settings /></PageTransition>} />
          <Route path="/daily" element={<PageTransition><Daily /></PageTransition>} />
          <Route path="/games/memory" element={<MemoryGame />} />

          <Route path="/games/yahtzee" element={<Yahtzee />} />
          <Route path="/games/wordsearch" element={<WordSearch />} />
          <Route path="/games/sudoku" element={<Sudoku />} />
          <Route path="/games/checkers" element={<Checkers />} />
          <Route path="/games/mahjong" element={<Mahjong />} />
          <Route path="/games/solitaire" element={<Solitaire />} />
          <Route path="/games/artstudio" element={<AIArtStudio />} />
          <Route path="/progress" element={<PageTransition><Progress /></PageTransition>} />
          <Route path="/onboarding" element={<Onboarding />} />
          <Route path="/memories" element={<PageTransition><Memories /></PageTransition>} />
          <Route path="/games/buzzword" element={<BuzzWord />} />
          <Route path="/games/slots" element={<SlotMachine />} />
          <Route path="/contacts" element={<Contacts />} />
          <Route path="/rankings" element={<Rankings />} />
          <Route path="/scripture" element={<Scripture />} />
          <Route path="/daily-challenge" element={<DailyChallenge />} />
          <Route path="/achievements" element={<Achievements />} />
          <Route path="/games/dartpop" element={<DartPopBlitz />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsOfService />} />
          <Route path="/gallery" element={<Gallery />} />
          <Route path="/shop" element={<PageTransition><Shop /></PageTransition>} />
          <Route path="*" element={<PageNotFound />} />
        </Route>
      </Routes>
    </AnimatePresence>
  );
};


function App() {

  return (
    <ErrorBoundary>
      <AuthProvider>
        <QueryClientProvider client={queryClientInstance}>
          <Router>
            <AuthenticatedApp />
          </Router>
          <Toaster />
        </QueryClientProvider>
      </AuthProvider>
    </ErrorBoundary>
  )
}

export default App