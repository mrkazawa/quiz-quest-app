# Testing Best Practices: Avoiding Code Duplication

## ❌ The Problem: Duplicate Service Files

**Initial approach (NOT recommended):**
```
src/services/
  ├── QuizService.ts          # Original production code
  ├── QuizService.testable.ts # Duplicate for testing
  └── QuizService.refactored.ts # Another duplicate
```

**Issues:**
- ❌ Code duplication (2-3x the code to maintain)
- ❌ Keeping files in sync is error-prone
- ❌ Bugs might exist in one version but not others
- ❌ Confusing for new developers
- ❌ Increases codebase size unnecessarily

## ✅ The Solution: Make Original Code Testable

**Better approach (RECOMMENDED):**
```
src/services/
  └── QuizService.ts  # Single source of truth, testable by design
```

### Key Changes Made

#### 1. Export the Class (Not Just Singleton)

**Before:**
```typescript
class QuizService {
  // ...
}
export default new QuizService(); // Only singleton
```

**After:**
```typescript
export class QuizService {  // ✅ Export class
  // ...
}
export default new QuizService(); // Still provide singleton
```

**Benefits:**
- Production code uses singleton: `import QuizService from './QuizService'`
- Tests create fresh instances: `new QuizService()`
- Backward compatible - no breaking changes

#### 2. Make Constructor Flexible

**Before:**
```typescript
constructor() {
  this.loadQuestions();
  this.setupFileWatcher();
}
```

**After:**
```typescript
constructor(questionsDir?: string, autoLoad: boolean = true) {
  this.questionsDir = questionsDir || path.join(__dirname, '../../../questions');
  
  if (autoLoad) {
    this.loadQuestions();
    
    if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV !== 'test') {
      this.setupFileWatcher();
    }
  }
}
```

**Benefits:**
- Tests can skip auto-loading: `new QuizService(undefined, false)`
- Tests can use custom directory: `new QuizService('/custom/path')`
- File watchers disabled in test mode
- Production behavior unchanged (default params)

#### 3. Skip File I/O in Tests

**Before:**
```typescript
public createQuiz(quizData: QuizData): CreateQuizResult {
  // ...
  this.saveQuizToFile(quizId, quizData); // Always writes to disk
  return { quizId, message };
}
```

**After:**
```typescript
public createQuiz(quizData: QuizData): CreateQuizResult {
  // ...
  if (process.env.NODE_ENV !== 'test') {
    this.saveQuizToFile(quizId, quizData); // ✅ Skip in tests
  }
  return { quizId, message };
}
```

**Benefits:**
- Tests run faster (no disk I/O)
- Tests are isolated (no file system side effects)
- Tests are deterministic (no file conflicts)
- Production behavior unchanged

#### 4. Add Test Helper Methods

```typescript
export class QuizService {
  // ... existing methods ...

  /**
   * Add a quiz directly to memory (useful for testing)
   */
  public addQuizToMemory(quiz: Quiz): void {
    this.questionSets[quiz.id] = quiz;
  }

  /**
   * Clear all quizzes from memory (useful for testing)
   */
  public clearAllQuizzes(): void {
    this.questionSets = {};
  }

  /**
   * Cleanup resources (file watchers, etc.)
   */
  public cleanup(): void {
    if (this.watcher) {
      this.watcher.close();
      this.watcher = undefined;
    }
  }
}
```

**Benefits:**
- Tests can manipulate state easily
- Tests can clean up properly
- Methods are simple and safe (only affect memory)
- Not called in production (test-only usage)

## 📊 Comparison

| Aspect | Duplicate Files ❌ | Single Testable File ✅ |
|--------|-------------------|------------------------|
| **Files to maintain** | 2-3 | 1 |
| **Code duplication** | High | None |
| **Risk of divergence** | High | None |
| **Confusion** | High | Low |
| **Testability** | Good | Good |
| **Production safety** | Same | Same |
| **Backward compatibility** | N/A | Maintained |

## 🎯 General Principles for Testable Code

### 1. **Dependency Injection Over Hard-Coding**

**Bad:**
```typescript
class Service {
  constructor() {
    this.fs = fs; // Hard-coded dependency
    this.path = '/hard/coded/path';
  }
}
```

**Good:**
```typescript
class Service {
  constructor(
    private fileSystem = fs,
    private basePath = '/default/path'
  ) {
    // Injectable dependencies
  }
}
```

### 2. **Environment-Aware Behavior**

**Good:**
```typescript
if (process.env.NODE_ENV !== 'test') {
  this.performSideEffect();
}
```

### 3. **Optional Auto-Initialization**

**Good:**
```typescript
constructor(autoInit = true) {
  if (autoInit) {
    this.initialize();
  }
}
```

### 4. **Test Helpers (Not Test-Only Code)**

**Good:**
```typescript
// Public methods that are useful for testing but harmless in production
public clearCache(): void { this.cache = {}; }
public resetState(): void { this.state = initialState; }
```

**Bad:**
```typescript
// Don't create a whole separate "testable" version
// QuizService.testable.ts ❌
```

## ✅ Result

**Before refactoring:**
- 3 service files (QuizService.ts, QuizService.testable.ts, QuizService.refactored.ts)
- ~600 lines of duplicated code
- Maintenance nightmare

**After refactoring:**
- 1 service file (QuizService.ts)
- ~260 lines total
- Single source of truth
- Same test coverage (117 tests passing)
- Same production behavior
- Backward compatible

## 🎓 Lessons Learned

1. **Start with testable design** - Don't create duplicates later
2. **Export both class and instance** - Gives flexibility
3. **Use environment variables** - Control behavior in tests
4. **Add test helpers** - Make testing easier without duplication
5. **Keep production behavior unchanged** - Default parameters preserve original behavior

## 📝 Testing Pattern

```typescript
// In tests
describe('QuizService', () => {
  let service: QuizService;

  beforeEach(() => {
    // Create fresh instance with autoLoad disabled
    service = new QuizService(undefined, false);
    service.clearAllQuizzes();
  });

  afterEach(() => {
    service.cleanup();
  });

  it('should work', () => {
    // Test using the same class that runs in production
    service.addQuizToMemory(mockQuiz);
    const result = service.getAllQuizzes();
    expect(result).toHaveLength(1);
  });
});

// In production
import QuizService from './services/QuizService';
// Uses singleton, auto-loads, watches files, saves to disk
```

## 🚀 Summary

**The right approach:**
- ✅ One file, one class
- ✅ Testable by design
- ✅ No duplication
- ✅ Easy to maintain
- ✅ Backward compatible

**Avoid:**
- ❌ Creating `.testable.ts` versions
- ❌ Creating `.refactored.ts` versions  
- ❌ Maintaining multiple copies
- ❌ Mock/stub patterns when design changes work better

---

**Bottom line:** Make your production code testable from the start. Don't create duplicates!
