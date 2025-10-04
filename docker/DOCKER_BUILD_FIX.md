# Docker Build Fix - Questions Folder

## Problem
The Docker build was failing with the error:
```
ERROR: failed to calculate checksum: "/questions": not found
```

This happened because the `questions/` folder is created dynamically by the application when teachers create new quizzes, so it doesn't exist in the repository.

## Solution

### 1. Updated Dockerfile
Changed the `COPY` command for the questions folder to:
- Create the directory first using `RUN mkdir -p ./questions`
- Removed the `COPY questions/` line since it's not needed at build time

**Before:**
```dockerfile
COPY --chown=quizquest:nodejs questions/ ./questions/
COPY --chown=quizquest:nodejs scripts/ ./scripts/
```

**After:**
```dockerfile
RUN mkdir -p ./questions
COPY --chown=quizquest:nodejs scripts/ ./scripts/
```

### 2. Created Questions Folder Locally
Created an empty `questions/` folder with a `.gitkeep` file to ensure it exists in the repository:
```bash
mkdir -p questions
echo "# This folder stores quiz JSON files created through the app" > questions/.gitkeep
```

### 3. Added .dockerignore
Created a `.dockerignore` file to optimize Docker builds by excluding unnecessary files like:
- `node_modules/`
- Build outputs
- Documentation
- Development files

## Why This Works

The application's `QuizService` already handles the questions folder creation:

```typescript
private saveQuizToFile(quizId: string, quizData: QuizData): void {
  const questionsDir = path.join(__dirname, '../../../questions');
  
  // Creates the directory if it doesn't exist
  if (!fs.existsSync(questionsDir)) {
    fs.mkdirSync(questionsDir, { recursive: true });
  }
  
  // ... save quiz file
}
```

So at runtime, when a teacher creates a quiz, the folder will be created automatically.

## Docker Volume Mounting (Optional)

For production deployments, you can mount a volume to persist quiz files:

```yaml
volumes:
  - ./questions:/app/questions  # Persist quiz files
```

This is already configured in the docker-compose files.

## How to Build

```bash
cd docker
bash build.sh
```

Or with sudo if needed:
```bash
cd docker
sudo bash build.sh
```

## Testing the Image

```bash
docker run -p 3000:3000 yoktian/quiz-quest-app:latest
```

The application will create the questions folder when the first quiz is created through the UI.
