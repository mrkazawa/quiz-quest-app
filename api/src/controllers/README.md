# Controllers

Controllers handle HTTP request/response cycle for API routes. They are the **thin layer** between routes and services.

---

## 🎯 Purpose

Controllers are responsible for:
- ✅ Extracting and validating request data (params, body, query)
- ✅ Checking authentication/authorization
- ✅ Calling service layer methods
- ✅ Formatting and sending responses
- ❌ **NOT** business logic (that belongs in services)
- ❌ **NOT** direct data manipulation

---

## 📁 File Structure

```
controllers/
├── AuthController.ts      # Authentication (login, logout, session)
├── QuizController.ts      # Quiz CRUD operations
├── RoomController.ts      # Room management
└── HistoryController.ts   # Quiz history and results
```

---

## 🏗️ Standard Pattern

### Basic Structure

```typescript
import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../types/express';
import SomeService from '../services/SomeService';

class SomeController {
  /**
   * Method name should describe the action clearly
   * Use static methods for stateless operations
   */
  static async methodName(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      // 1. Extract data from request
      const { param } = req.params;
      const { field } = req.body;
      
      // 2. Validate and check authorization (if needed)
      if (!req.session || !req.session.isTeacher) {
        res.status(403).json({ error: "Unauthorized" });
        return;
      }
      
      // 3. Call service layer
      const result = SomeService.doSomething(param, field);
      
      // 4. Send success response
      res.json({ 
        success: true, 
        data: result 
      });
      
    } catch (error) {
      // 5. Handle errors
      console.error('Error in methodName:', error);
      res.status(500).json({ 
        success: false, 
        error: (error as Error).message 
      });
    }
  }
}

export default SomeController;
```

---

## 🔐 Authentication Pattern

### Checking Teacher Authentication

```typescript
static async protectedAction(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Check if user is authenticated teacher
    if (!req.session || !req.session.isTeacher) {
      res.status(403).json({ error: "Unauthorized" });
      return; // Important: early return
    }

    // Proceed with authenticated logic
    const result = SomeService.doSomething();
    res.json({ success: true, data: result });
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### Public Endpoints (No Auth Required)

```typescript
static async publicAction(req: Request, res: Response): Promise<void> {
  try {
    // No authentication check needed
    const result = SomeService.getPublicData();
    res.json(result);
    
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

---

## 📤 Response Patterns

### Success Response

```typescript
// Simple success
res.json({ success: true });

// Success with data
res.json({ 
  success: true, 
  data: result 
});

// Success with multiple fields
res.json({
  success: true,
  quizId: 'abc123',
  message: 'Quiz created successfully'
});
```

### Error Response

```typescript
// 400 - Bad Request (validation error)
res.status(400).json({ 
  success: false, 
  error: 'Invalid input data' 
});

// 401 - Unauthorized (authentication failed)
res.status(401).json({ 
  success: false, 
  error: 'Unauthorized' 
});

// 403 - Forbidden (not allowed)
res.status(403).json({ 
  error: 'Forbidden' 
});

// 404 - Not Found
res.status(404).json({ 
  success: false, 
  error: 'Resource not found' 
});

// 500 - Internal Server Error
res.status(500).json({ 
  success: false, 
  error: 'Internal server error' 
});
```

---

## 🎨 Naming Conventions

### Method Names

- **GET** endpoints: `getResource`, `getAllResources`, `getResourceById`
- **POST** endpoints: `createResource`, `verifyResource`, `submitResource`
- **PUT/PATCH** endpoints: `updateResource`, `modifyResource`
- **DELETE** endpoints: `deleteResource`, `removeResource`

### Examples from Codebase

```typescript
// QuizController
static async getAllQuizzes()      // GET /api/quiz
static async createQuiz()         // POST /api/quiz
static async deleteQuiz()         // DELETE /api/quiz/:quizId
static async downloadTemplate()   // GET /api/quiz/template

// AuthController
static async verifyTeacher()      // POST /api/auth/verify
static async logout()             // POST /api/auth/logout
static async setLanguage()        // POST /api/auth/language
static async getLanguage()        // GET /api/auth/language

// RoomController
static async getActiveRooms()     // GET /api/rooms/active

// HistoryController
static async getAllHistory()      // GET /api/history
static async getRoomHistory()     // GET /api/history/:roomId
```

---

## ⚠️ Error Handling Best Practices

### 1. Always Use Try-Catch

```typescript
static async someAction(req: Request, res: Response): Promise<void> {
  try {
    // Your logic here
  } catch (error) {
    console.error('Error in someAction:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 2. Type Cast Errors Properly

```typescript
catch (error) {
  console.error('Error:', error);
  res.status(400).json({ 
    error: (error as Error).message  // Type cast for error message
  });
}
```

### 3. Handle Specific Error Cases

```typescript
catch (error) {
  console.error('Error:', error);
  
  // Handle specific error types
  if ((error as Error).message === 'Quiz not found') {
    res.status(404).json({ error: 'Quiz not found' });
  } else if ((error as Error).message.includes('validation')) {
    res.status(400).json({ error: (error as Error).message });
  } else {
    res.status(500).json({ error: 'Internal server error' });
  }
}
```

### 4. Always Log Errors

```typescript
catch (error) {
  // ALWAYS log for debugging
  console.error('Error in methodName:', error);
  
  // Then send user-friendly message
  res.status(500).json({ error: 'Something went wrong' });
}
```

---

## 🔗 Controller-Service Relationship

### ✅ DO: Thin Controllers

```typescript
// Controller (QuizController.ts)
static async getAllQuizzes(req: Request, res: Response): Promise<void> {
  try {
    const quizzes = QuizService.getAllQuizzes();  // Delegate to service
    res.json(quizzes);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Failed to retrieve quizzes' });
  }
}
```

### ❌ DON'T: Business Logic in Controllers

```typescript
// BAD: Business logic in controller
static async getAllQuizzes(req: Request, res: Response): Promise<void> {
  try {
    // ❌ Reading files, processing data - this belongs in service
    const files = fs.readdirSync('./questions');
    const quizzes = files.map(file => {
      const data = JSON.parse(fs.readFileSync(file, 'utf-8'));
      return { id: file, ...data };
    });
    res.json(quizzes);
  } catch (error) {
    res.status(500).json({ error: 'Failed' });
  }
}
```

---

## 📋 Checklist for New Controllers

When creating a new controller, ensure:

- [ ] File named: `XxxController.ts` (PascalCase)
- [ ] Class name matches file name: `class XxxController`
- [ ] All methods are `static async`
- [ ] All methods have `Promise<void>` return type
- [ ] Use `AuthenticatedRequest` when checking sessions
- [ ] Use `Request` for public endpoints
- [ ] Always include try-catch blocks
- [ ] Log errors with `console.error`
- [ ] Call service layer methods (no business logic)
- [ ] Return consistent response format
- [ ] Handle auth checks early with early return
- [ ] Export default: `export default XxxController;`

---

## 📚 Reference Examples

### Simple CRUD Controller
**See:** `QuizController.ts`
- GET all resources
- CREATE new resource (with auth)
- DELETE resource (with auth)
- File download endpoint

### Authentication Controller
**See:** `AuthController.ts`
- Login/logout pattern
- Session management
- Setting session data

### Enhanced Data Controller
**See:** `RoomController.ts`
- Fetching related data from multiple services
- Data enrichment before response
- Authorization checks

### History Controller
**See:** `HistoryController.ts`
- Query parameter handling
- Data filtering and sorting
- Large dataset responses

---

## 🔄 Request Flow

```
Route Definition (routes/*.ts)
    ↓
Controller Method (controllers/*.ts)
    ↓
    ├─→ Extract request data (params, body, query)
    ├─→ Validate & authorize (if needed)
    ├─→ Call Service Layer (services/*.ts) ← Business logic here!
    ├─→ Format response
    └─→ Send response (res.json)
```

---

## 🚀 Quick Start: Adding a New Controller

```bash
# 1. Create controller file
touch api/src/controllers/NewController.ts

# 2. Follow the standard pattern (see above)

# 3. Create corresponding route file
touch api/src/routes/new.ts

# 4. Register route in app.ts
# import newRoutes from './routes/new';
# app.use('/api/new', newRoutes);

# 5. Create service (if needed)
touch api/src/services/NewService.ts

# 6. Write tests
touch api/tests/unit/controllers/NewController.test.ts
```

---

## 📖 Related Documentation

- **Service Pattern:** [../services/SERVICE_DESIGN_PATTERN.md](../services/SERVICE_DESIGN_PATTERN.md)
- **Route Definitions:** [../routes/](../routes/)
- **Middleware:** [../middleware/README.md](../middleware/README.md)
- **Type Definitions:** [../types/express.ts](../types/express.ts)
- **Testing:** [../../tests/README.md](../../tests/README.md)

---

**Last Updated:** October 5, 2025  
**Controllers:** 4 (Auth, Quiz, Room, History)
