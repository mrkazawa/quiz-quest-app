# Components

Reusable React components that can be used across multiple pages. Components should be **modular, reusable, and focused** on a single responsibility.

---

## 🎯 Purpose

Components are responsible for:
- ✅ Reusable UI elements
- ✅ Self-contained functionality
- ✅ Props-based configuration
- ✅ Consistent styling with Tailwind
- ❌ **NOT** page-level routing (that belongs in pages/)
- ❌ **NOT** global state management (use context/hooks)

---

## 📁 File Structure

```
components/
├── Layout.tsx              # Page layout wrapper
├── Header.tsx              # App header with navigation
├── Footer.tsx              # App footer
├── ProtectedRoute.tsx      # Authentication guard
└── TeacherLoginModal.tsx   # Teacher password modal
```

---

## 🧩 Component Categories

### Layout Components

Components that provide structure and consistent appearance.

#### `Layout.tsx` - Page Wrapper

**Purpose:** Provides consistent page structure with header and footer

**Props:**
```typescript
interface LayoutProps {
  children: React.ReactNode;   // Page content
  title: string;                // Page title
  subtitle?: string;            // Optional subtitle
  showLogout?: boolean;         // Show logout button
  showBack?: boolean;           // Show back button
  backTo?: string;              // Back button destination
  onBackClick?: () => void;     // Custom back handler
}
```

**Usage:**
```typescript
import Layout from '../components/Layout';

const MyPage = () => {
  return (
    <Layout 
      title="My Page" 
      subtitle="Page description"
      showLogout={true}
      showBack={true}
      backTo="/dashboard"
    >
      <div className="container mx-auto">
        {/* Page content */}
      </div>
    </Layout>
  );
};
```

**Features:**
- Consistent header/footer
- Flexible content area
- Optional back navigation
- Optional logout button
- Responsive design

---

#### `Header.tsx` - Navigation Bar

**Purpose:** Top navigation bar with title, back button, and logout

**Props:**
```typescript
interface HeaderProps {
  title: string;
  subtitle?: string;
  showLogout?: boolean;
  showBack?: boolean;
  backTo?: string;
  onBackClick?: () => void;
}
```

**Usage:**
```typescript
<Header 
  title="Quiz Dashboard"
  subtitle="Manage your quizzes"
  showLogout={true}
  showBack={false}
/>
```

**Features:**
- Sticky header (stays at top on scroll)
- Back button with custom navigation
- Logout button (teacher only)
- Gradient background
- Responsive text sizing

**Styling:**
```typescript
className="bg-gradient-to-r from-slate-800 to-slate-700 text-white sticky top-0 z-50"
```

---

#### `Footer.tsx` - Page Footer

**Purpose:** Bottom footer with app info and links

**Props:** None (static component)

**Usage:**
```typescript
<Footer />
```

**Features:**
- App version/copyright
- Links (GitHub, documentation)
- Consistent branding
- Sticky footer (always at bottom)

---

### Authentication Components

Components related to authentication and authorization.

#### `ProtectedRoute.tsx` - Route Guard

**Purpose:** Restrict access to teacher-only routes

**Props:**
```typescript
interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;       // Default: true
}
```

**Usage:**
```typescript
// In App.tsx
<Route path="/teacher/dashboard" element={
  <ProtectedRoute>
    <TeacherDashboard />
  </ProtectedRoute>
} />

// With optional auth
<Route path="/optional" element={
  <ProtectedRoute requireAuth={false}>
    <OptionalContent />
  </ProtectedRoute>
} />
```

**Behavior:**
```typescript
// If not authenticated
if (requireAuth && !isAuthenticated) {
  return <Navigate to="/" replace />;
}

// If authenticated
return <>{children}</>;
```

**Why Use This:**
- Prevents unauthorized access
- Automatic redirect to home
- Clean, declarative routing
- Consistent auth checking

---

#### `TeacherLoginModal.tsx` - Login Dialog

**Purpose:** Modal dialog for teacher password authentication

**Props:**
```typescript
interface TeacherLoginModalProps {
  show: boolean;              // Modal visibility
  onHide: () => void;         // Close callback
}
```

**Usage:**
```typescript
const [showModal, setShowModal] = useState(false);

<TeacherLoginModal 
  show={showModal}
  onHide={() => setShowModal(false)}
/>
```

**Features:**
- Password input with show/hide toggle
- Form validation
- Loading state during API call
- Error message display
- ESC key to close
- Click outside to close
- Auto-focus on input

**State:**
```typescript
const [password, setPassword] = useState('');
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

**Form Handling:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate
  if (!password.trim()) {
    setError('Please enter password');
    return;
  }
  
  setIsLoading(true);
  setError('');
  
  try {
    // Call login API
    const success = await login(password);
    
    if (success) {
      onHide();
      navigate('/teacher/dashboard');
    } else {
      setError('Incorrect password');
    }
  } catch (err) {
    setError('Login failed');
  } finally {
    setIsLoading(false);
  }
};
```

**Keyboard Shortcuts:**
```typescript
// ESC to close
useEffect(() => {
  const handleEscKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && show) {
      onHide();
    }
  };
  
  if (show) {
    document.addEventListener('keydown', handleEscKey);
    return () => document.removeEventListener('keydown', handleEscKey);
  }
}, [show, onHide]);

// Enter to submit
<input onKeyDown={(e) => {
  if (e.key === 'Enter') handleSubmit();
}} />
```

---

## 🏗️ Standard Component Pattern

### Functional Component with TypeScript

```typescript
import { useState, useEffect } from 'react';

interface ComponentProps {
  title: string;
  onAction?: () => void;
  children?: React.ReactNode;
}

const MyComponent = ({ title, onAction, children }: ComponentProps) => {
  // 1. Local state
  const [isActive, setIsActive] = useState(false);

  // 2. Effects
  useEffect(() => {
    // Side effects here
    return () => {
      // Cleanup
    };
  }, [dependencies]);

  // 3. Event handlers
  const handleClick = () => {
    setIsActive(!isActive);
    onAction?.(); // Call optional callback
  };

  // 4. Render
  return (
    <div className="component-wrapper">
      <h2 className="text-2xl font-bold">{title}</h2>
      <button 
        onClick={handleClick}
        className="btn btn-primary"
      >
        Toggle
      </button>
      {children}
    </div>
  );
};

export default MyComponent;
```

---

## 🎨 Styling with Tailwind CSS

### Common Patterns

#### Buttons

```typescript
// Primary button
<button className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
  Click Me
</button>

// Secondary button
<button className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-6 py-3 rounded-lg font-semibold">
  Cancel
</button>

// Danger button
<button className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold">
  Delete
</button>

// Disabled button
<button 
  disabled 
  className="bg-gray-400 text-gray-600 px-6 py-3 rounded-lg font-semibold cursor-not-allowed opacity-50"
>
  Disabled
</button>
```

#### Cards

```typescript
<div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow duration-200">
  <h3 className="text-xl font-bold mb-2">Card Title</h3>
  <p className="text-gray-600">Card content</p>
</div>
```

#### Inputs

```typescript
<input
  type="text"
  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
  placeholder="Enter text"
/>
```

#### Modals

```typescript
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
  <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
    <div className="p-6">
      {/* Modal content */}
    </div>
  </div>
</div>
```

---

## 🔄 Common Patterns

### Conditional Rendering

```typescript
// Show/hide based on state
{isLoading && <LoadingSpinner />}
{error && <ErrorMessage message={error} />}
{data && <DataDisplay data={data} />}

// Ternary operator
{isLoggedIn ? <Dashboard /> : <Login />}

// Multiple conditions
{isLoading ? (
  <LoadingSpinner />
) : error ? (
  <ErrorMessage message={error} />
) : (
  <DataDisplay data={data} />
)}
```

### Event Handlers

```typescript
// Simple handler
const handleClick = () => {
  console.log('Clicked!');
};

// Handler with parameter
const handleDelete = (id: string) => {
  deleteItem(id);
};

// Handler with event
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setValue(e.target.value);
};

// Prevent default
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  submitForm();
};
```

### Props Destructuring

```typescript
// Basic destructuring
const MyComponent = ({ title, subtitle }: Props) => { ... };

// With default values
const MyComponent = ({ 
  title = 'Default Title', 
  showIcon = true 
}: Props) => { ... };

// With rest props
const MyComponent = ({ title, ...rest }: Props) => {
  return <div {...rest}>{title}</div>;
};
```

### Optional Callbacks

```typescript
// Call callback if provided
onClick?.();

// Call with parameter
onDelete?.(itemId);

// With fallback
onComplete?.() ?? console.log('No callback provided');
```

---

## ✅ Best Practices

### ✅ DO:

```typescript
// Define clear prop interfaces
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

// Use TypeScript for type safety
const Button = ({ label, onClick, variant = 'primary' }: ButtonProps) => { ... };

// Extract repeated styles
const buttonStyles = `
  px-6 py-3 rounded-lg font-semibold 
  transition-colors duration-200
  ${variant === 'primary' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-200'}
`;

// Clean up effects
useEffect(() => {
  const timer = setTimeout(() => { ... }, 1000);
  return () => clearTimeout(timer);
}, []);

// Use meaningful names
const handleLoginSubmit = () => { ... };
const [isModalOpen, setIsModalOpen] = useState(false);
```

### ❌ DON'T:

```typescript
// Don't use any
const MyComponent = (props: any) => { ... }; // ❌

// Don't forget cleanup
useEffect(() => {
  const timer = setTimeout(...);
  // ❌ Missing return cleanup
}, []);

// Don't put complex logic in JSX
return (
  <div>
    {/* ❌ Complex logic in render */}
    {data.filter(x => x.active).map(x => x.value).join(', ')}
  </div>
);

// Instead, compute before render
const activeValues = data
  .filter(x => x.active)
  .map(x => x.value)
  .join(', ');

return <div>{activeValues}</div>;
```

---

## 📋 Checklist for New Component

- [ ] Create `.tsx` file in `components/` folder
- [ ] Define TypeScript interface for props
- [ ] Use functional component syntax
- [ ] Add JSDoc comment if complex
- [ ] Use Tailwind classes for styling
- [ ] Handle loading/error states if needed
- [ ] Clean up effects (return cleanup function)
- [ ] Add prop validation with TypeScript
- [ ] Make component reusable (avoid hardcoding)
- [ ] Export as default
- [ ] Test component in isolation
- [ ] Update this README

---

## 🧪 Testing Components

### Basic Component Test

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import MyComponent from '../MyComponent';

describe('MyComponent', () => {
  it('should render title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  it('should call onClick when button is clicked', () => {
    const handleClick = jest.fn();
    render(<MyComponent onClick={handleClick} />);
    
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalled();
  });

  it('should show loading state', () => {
    render(<MyComponent isLoading={true} />);
    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });
});
```

---

## 🎯 Component Design Principles

### Single Responsibility

Each component should do one thing well.

```typescript
// ❌ Bad: Component does too much
const UserProfileCard = () => {
  // Fetches data, handles auth, shows profile, manages settings
};

// ✅ Good: Focused components
const UserProfile = () => { ... };
const UserSettings = () => { ... };
const AuthGuard = () => { ... };
```

### Reusability

Design components to be reused.

```typescript
// ❌ Bad: Hardcoded values
const QuizCard = () => {
  return <div>Quiz Name: Math Quiz</div>;
};

// ✅ Good: Props-based
interface QuizCardProps {
  quizName: string;
  questionCount: number;
  onStart: () => void;
}

const QuizCard = ({ quizName, questionCount, onStart }: QuizCardProps) => {
  return (
    <div>
      <h3>{quizName}</h3>
      <p>{questionCount} questions</p>
      <button onClick={onStart}>Start</button>
    </div>
  );
};
```

### Composition

Build complex UIs from simple components.

```typescript
// Simple components
const Card = ({ children }) => <div className="card">{children}</div>;
const CardHeader = ({ title }) => <div className="card-header">{title}</div>;
const CardBody = ({ children }) => <div className="card-body">{children}</div>;

// Composed component
const QuizCard = ({ quiz }) => (
  <Card>
    <CardHeader title={quiz.name} />
    <CardBody>
      <p>{quiz.description}</p>
      <button>Start Quiz</button>
    </CardBody>
  </Card>
);
```

---

## 📚 Related Documentation

- **Pages:** [../pages/README.md](../pages/README.md)
- **Hooks:** [../hooks/README.md](../hooks/README.md)
- **Context:** [../context/](../context/)
- **Tailwind CSS:** [https://tailwindcss.com/docs](https://tailwindcss.com/docs)
- **React TypeScript:** [https://react-typescript-cheatsheet.netlify.app/](https://react-typescript-cheatsheet.netlify.app/)

---

**Last Updated:** October 5, 2025  
**Total Components:** 5 (Layout, Header, Footer, ProtectedRoute, TeacherLoginModal)
