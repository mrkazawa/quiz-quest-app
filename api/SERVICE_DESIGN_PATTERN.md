# Service Layer Design Pattern - Quiz Quest API

## 📐 Standard Service Pattern

All services in the Quiz Quest API follow a **consistent, testable singleton pattern**. This document defines the standard structure.

---

## ✅ Standard Structure

```typescript
import { /* types */ } from '../types/...';

/**
 * ServiceName - Brief description of what this service does
 * Supports both production use and in-memory testing
 */
export class ServiceName {
  private someData: Record<string, Type> = {};
  private otherState: any;

  constructor(/* optional parameters for flexibility */) {
    // Minimal initialization
    // Use optional parameters for testability
  }

  // ============================================
  // PUBLIC API METHODS
  // ============================================

  public createSomething(data: Type): Result {
    // Business logic here
  }

  public getSomething(id: string): Type | undefined {
    return this.someData[id];
  }

  public updateSomething(id: string, data: Partial<Type>): boolean {
    // Update logic
  }

  public deleteSomething(id: string): boolean {
    // Deletion logic with cleanup
  }

  // ============================================
  // TEST HELPER METHODS
  // (Useful for testing, harmless in production)
  // ============================================

  /**
   * Get count of items (useful for testing and monitoring)
   */
  public getItemCount(): number {
    return Object.keys(this.someData).length;
  }

  /**
   * Clear all data from memory (useful for testing)
   */
  public clearAll(): void {
    // Clean up any resources (timers, watchers, etc.)
    this.someData = {};
  }

  /**
   * Cleanup resources (useful for testing)
   */
  public cleanup(): void {
    this.clearAll();
    // Additional cleanup if needed
  }
}

// Export singleton instance
export default new ServiceName();
```

---

## 🎯 Design Principles

### 1. **Export Both Class and Instance**

✅ **DO:**
```typescript
export class QuizService { /* ... */ }
export default new QuizService();
```

❌ **DON'T:**
```typescript
class QuizService { /* ... */ }  // Not exported
export default new QuizService();
```

**Why:** Tests can create fresh instances, production uses singleton.

---

### 2. **Add JSDoc Comments**

✅ **DO:**
```typescript
/**
 * QuizService - Manages quiz data and operations
 * Supports both file-based persistence and in-memory testing
 */
export class QuizService {
```

**Why:** Provides clear documentation and IDE intellisense.

---

### 3. **Flexible Constructor**

✅ **DO:**
```typescript
constructor(questionsDir?: string, autoLoad: boolean = true) {
  this.questionsDir = questionsDir || defaultPath;
  
  if (autoLoad) {
    this.initialize();
  }
}
```

❌ **DON'T:**
```typescript
constructor() {
  this.initialize();  // Always runs, no flexibility
}
```

**Why:** Tests can skip auto-initialization or provide custom paths.

---

### 4. **Environment-Aware Side Effects**

✅ **DO:**
```typescript
if (process.env.NODE_ENV !== 'test') {
  this.saveToFile(data);  // Skip in tests
}
```

**Why:** Tests run faster and without side effects.

---

### 5. **Test Helper Methods**

✅ **DO:**
```typescript
/**
 * Clear all data from memory (useful for testing)
 */
public clearAll(): void {
  this.data = {};
}

/**
 * Cleanup resources (useful for testing)
 */
public cleanup(): void {
  this.clearAll();
}
```

**Why:** Makes tests cleaner and more reliable. These methods are:
- Public (accessible to tests)
- Safe (only affect memory)
- Documented (marked as test helpers)
- Harmless (rarely/never called in production)

---

### 6. **Proper Resource Cleanup**

✅ **DO:**
```typescript
public cleanup(): void {
  // Clear timers
  if (this.timer) {
    clearTimeout(this.timer);
    this.timer = null;
  }
  
  // Close watchers
  if (this.watcher) {
    this.watcher.close();
    this.watcher = undefined;
  }
  
  // Clear data
  this.clearAll();
}
```

**Why:** Prevents memory leaks and ensures clean test teardown.

---

## 📊 Current Services Compliance

| Service | Class Exported | Test Helpers | Cleanup | JSDoc | Status |
|---------|----------------|--------------|---------|-------|--------|
| **QuizService** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Compliant** |
| **RoomService** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Compliant** |
| **HistoryService** | ✅ Yes | ✅ Yes | ✅ Yes | ✅ Yes | ✅ **Compliant** |

---

## 🧪 Testing Pattern

### Test Setup
```typescript
import { ServiceName } from '../../../src/services/ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    // Option 1: Use singleton and clear state
    ServiceName.clearAll();
    
    // Option 2: Create fresh instance (if constructor supports it)
    service = new ServiceName(customParams, false);
    service.clearAll();
  });

  afterEach(() => {
    // Always cleanup
    ServiceName.cleanup();
    // or
    service.cleanup();
  });

  it('should do something', () => {
    // Test using clean state
    service.doSomething();
    expect(service.getItemCount()).toBe(1);
  });
});
```

### Production Usage
```typescript
import QuizService from './services/QuizService';
import RoomService from './services/RoomService';
import HistoryService from './services/HistoryService';

// Use singletons - auto-initialized, full functionality
const quiz = QuizService.getQuizById('123');
const room = RoomService.createRoom('quiz-1', 'teacher-1', questions);
const history = HistoryService.getAllHistory();
```

---

## 🔄 Migration Checklist

When creating a new service or refactoring an existing one:

- [ ] Export the class: `export class ServiceName`
- [ ] Export singleton: `export default new ServiceName()`
- [ ] Add JSDoc comment with description
- [ ] Make constructor flexible (optional params)
- [ ] Guard side effects with `NODE_ENV` checks
- [ ] Add `getItemCount()` method
- [ ] Add `clearAll()` method
- [ ] Add `cleanup()` method
- [ ] Update tests to use new helpers
- [ ] Verify all tests pass
- [ ] Update documentation

---

## 📝 Method Naming Conventions

### Business Logic Methods
- `create*()` - Create new entity
- `get*()` - Retrieve entity/data
- `getAll*()` - Retrieve all entities
- `update*()` - Modify entity
- `delete*()` - Remove entity
- `validate*()` - Validate data

### Test Helper Methods
- `get*Count()` - Get count for monitoring/testing
- `clearAll*()` - Clear all data (test cleanup)
- `cleanup()` - Full cleanup (test teardown)
- `add*ToMemory()` - Direct memory manipulation (tests)

---

## 🎨 Code Style

### Visibility
```typescript
public  methodName()  // API methods, test helpers
private methodName()  // Internal implementation
```

### Organization
```typescript
export class ServiceName {
  // 1. Private properties
  private data: Type;
  
  // 2. Constructor
  constructor() { }
  
  // 3. Public API methods (alphabetically)
  public create() { }
  public delete() { }
  public get() { }
  
  // 4. Private helper methods
  private validateData() { }
  private processData() { }
  
  // 5. Test helper methods (clearly marked)
  /**
   * Clear all data (useful for testing)
   */
  public clearAll() { }
  
  public cleanup() { }
}
```

---

## ✅ Benefits of This Pattern

1. **Consistency** - All services follow same structure
2. **Testability** - Easy to test without side effects
3. **Maintainability** - Clear organization and documentation
4. **Flexibility** - Constructor params allow customization
5. **Clean Tests** - Helper methods make tests concise
6. **Production Safe** - Singletons work as before
7. **No Breaking Changes** - Backward compatible

---

## 🚀 Example: Creating a New Service

```typescript
import { User } from '../types/user';

/**
 * UserService - Manages user accounts and authentication
 * Supports both production use and in-memory testing
 */
export class UserService {
  private users: Record<string, User> = {};
  
  constructor() {
    // Minimal initialization
  }
  
  public createUser(userData: UserData): User {
    const user = { id: generateId(), ...userData };
    this.users[user.id] = user;
    return user;
  }
  
  public getUserById(id: string): User | undefined {
    return this.users[id];
  }
  
  public getAllUsers(): User[] {
    return Object.values(this.users);
  }
  
  public deleteUser(id: string): boolean {
    if (!this.users[id]) return false;
    delete this.users[id];
    return true;
  }
  
  /**
   * Get count of users (useful for testing and monitoring)
   */
  public getUserCount(): number {
    return Object.keys(this.users).length;
  }
  
  /**
   * Clear all users from memory (useful for testing)
   */
  public clearAllUsers(): void {
    this.users = {};
  }
  
  /**
   * Cleanup resources (useful for testing)
   */
  public cleanup(): void {
    this.clearAllUsers();
  }
}

// Export singleton instance
export default new UserService();
```

---

## 📚 Related Documentation

- [`TESTABILITY_REFACTORING.md`](./TESTABILITY_REFACTORING.md) - Why we don't use duplicate files
- [`TEST_IMPLEMENTATION_SUMMARY.md`](./TEST_IMPLEMENTATION_SUMMARY.md) - Testing overview
- [`tests/README.md`](./tests/README.md) - How to run tests

---

**Last Updated:** October 5, 2025  
**Pattern Version:** 1.0  
**All Services Compliant:** ✅ Yes
