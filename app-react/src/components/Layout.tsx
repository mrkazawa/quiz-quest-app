import Header from './Header';
import Footer from './Footer';

interface LayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showBack?: boolean;
  backTo?: string;
}

const Layout = ({ 
  children, 
  title, 
  subtitle, 
  showLogout = false, 
  showBack = false, 
  backTo = '/' 
}: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header 
        title={title}
        subtitle={subtitle}
        showLogout={showLogout}
        showBack={showBack}
        backTo={backTo}
      />
      
      <main className="flex-1 py-6">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};

export default Layout;
