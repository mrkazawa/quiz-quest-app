import React from 'react';
import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  showLogout?: boolean;
  showBack?: boolean;
  backTo?: string;
  roomId?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children,
  title,
  subtitle,
  showLogout = false,
  showBack = false,
  backTo,
  roomId
}) => {
  return (
    <div className="app-with-layout">
      <Header 
        title={title}
        subtitle={subtitle}
        showLogout={showLogout}
        showBack={showBack}
        backTo={backTo}
        roomId={roomId}
      />
      <div className="app-content">
        <main className="main-content">
          {children}
        </main>
      </div>
      <Footer />
    </div>
  );
};

export default Layout;
