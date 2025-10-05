# API Tests

Comprehensive test suite for Quiz Quest API with 117+ passing tests.

## Quick Start

```bash
# Run all tests
npm test

# Run with coverage report
npm run test:coverage

# Run in watch mode (for development)
npm run test:watch

# Run only unit tests
npm run test:unit
```

## Test Structure

```
tests/
├── setup.ts                    # Global test configuration
├── helpers/
│   └── mockData.ts            # Reusable mock data and factories
└── unit/
    └── services/
        ├── QuizService.test.ts      # 35 tests
        ├── RoomService.test.ts      # 65 tests
        └── HistoryService.test.ts   # 17 tests
```

## Coverage Summary

| Service | Coverage | Tests |
|---------|----------|-------|
| HistoryService | 100% | 17 |
| RoomService | 91.5% | 65 |
| QuizService | 69.5% | 35 |
| **Total Services** | **63.9%** | **117** |

## What's Tested

### ✅ QuizService (35 tests)
- Quiz CRUD operations (create, read, delete)
- Quiz listing and retrieval
- Data validation (comprehensive)
- ID generation and uniqueness
- In-memory operations

### ✅ RoomService (65 tests)
- Room creation and management
- Player join/leave/rejoin logic
- Quiz start/stop lifecycle
- Question navigation
- Answer submission and scoring
- Streak calculation
- Timer management
- Teacher session tracking

### ✅ HistoryService (17 tests)
- Save quiz results
- Generate rankings
- Detailed player results
- Score/streak calculation
- History retrieval and deletion

## Key Features

- **Fast:** Tests run in ~2 seconds
- **Isolated:** No file I/O, pure in-memory testing
- **Comprehensive:** Covers happy paths, error cases, and edge cases
- **Maintainable:** Well-organized with reusable mock data
- **CI-Ready:** Deterministic results, no external dependencies

## Writing New Tests

### Example Test Structure

```typescript
import { QuizService } from '../../../src/services/QuizService.testable';
import { mockQuizData, createMockQuestion } from '../../helpers/mockData';

describe('QuizService', () => {
  let quizService: QuizService;

  beforeEach(() => {
    quizService = new QuizService(undefined, undefined as any, false);
    quizService.clearAllQuizzes();
  });

  afterEach(() => {
    quizService.cleanup();
  });

  describe('methodName', () => {
    it('should do something expected', () => {
      // Arrange
      const input = mockQuizData;

      // Act
      const result = quizService.someMethod(input);

      // Assert
      expect(result).toBeDefined();
      expect(result.something).toBe('expected');
    });
  });
});
```

### Using Mock Data

```typescript
import {
  mockQuestion1,
  mockQuizData,
  mockPlayer1,
  createMockQuestions,
  createMockQuizData,
} from '../../helpers/mockData';

// Use predefined mocks
const question = mockQuestion1;

// Or create custom mocks
const customQuiz = createMockQuizData(5); // Quiz with 5 questions
const questions = createMockQuestions(10); // 10 questions
```

## Next Steps

See [TEST_IMPLEMENTATION_SUMMARY.md](./TEST_IMPLEMENTATION_SUMMARY.md) for:
- Detailed coverage reports
- Testing strategy and phases
- Upcoming test plans (Controllers, Integration, Sockets)
- Best practices and patterns

## CI/CD Integration

Tests are designed to run in CI pipelines:
- No external dependencies
- Fast execution
- Coverage reports generated
- Exit code 0 on success, 1 on failure
