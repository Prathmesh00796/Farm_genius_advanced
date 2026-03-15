import React from 'react';
import Header from './Header';
import Footer from './Footer';
import ChatBot from '@/components/chat/ChatBot';
import VoiceNavigator from '@/components/voice/VoiceNavigator';
import { useAuth } from '@/contexts/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showFooter?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showFooter = true }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {showFooter && <Footer />}
      {user && <ChatBot />}
      {user && <VoiceNavigator />}
    </div>
  );
};

export default Layout;
