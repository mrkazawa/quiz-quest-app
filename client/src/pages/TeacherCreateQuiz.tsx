import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";
import Layout from "../components/Layout";

interface QuizData {
  setName: string;
  setDescription: string;
  questions: Array<{
    id: number;
    question: string;
    options: string[];
    correctAnswer: number;
    timeLimit: number;
    points: number;
  }>;
}

const TeacherCreateQuiz = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Additional authentication check - redirect if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [isAuthenticated, navigate]);
  
  const [quizJson, setQuizJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
    show: boolean;
  } | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [copyButtonText, setCopyButtonText] = useState("Copy Prompt");

  const chatgptPrompt = `I need to create a quiz in JSON format. Please generate a json format text based on [YOUR TOPIC/MATERIALS]. Follow this exact structure:

{
  "setName": "Quiz Title",
  "setDescription": "Quiz description",
  "questions": [
    {
      "id": 1,
      "question": "Question text?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctAnswer": 0,
      "timeLimit": 20,
      "points": 1000
    }
  ]
}

Make sure:
- Each question has a unique id starting from 1
- correctAnswer is the index (0-3) of the correct option
- timeLimit is in seconds (10-30 recommended)
- points can vary (500-1000 typical)
- Include 10-15 questions total`;

  const validateQuizJson = (quizData: unknown): { valid: boolean; error?: string } => {
    // Type guard to check if quizData is an object
    if (!quizData || typeof quizData !== 'object') {
      return { valid: false, error: "Invalid quiz data format" };
    }

    const quiz = quizData as Record<string, unknown>;

    // Check required top-level fields
    if (!quiz.setName || typeof quiz.setName !== 'string') {
      return { valid: false, error: "Missing or invalid 'setName' field" };
    }

    if (!quiz.setDescription || typeof quiz.setDescription !== 'string') {
      return { valid: false, error: "Missing or invalid 'setDescription' field" };
    }

    if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
      return { valid: false, error: "Missing or empty 'questions' array" };
    }

    // Validate each question
    for (let i = 0; i < quiz.questions.length; i++) {
      const q = quiz.questions[i] as Record<string, unknown>;
      const qNum = i + 1;

      if (!Number.isInteger(q.id)) {
        return { valid: false, error: `Question ${qNum}: Missing or invalid 'id' field` };
      }

      if (!q.question || typeof q.question !== 'string') {
        return { valid: false, error: `Question ${qNum}: Missing or invalid 'question' field` };
      }

      if (!Array.isArray(q.options) || q.options.length !== 4) {
        return { valid: false, error: `Question ${qNum}: 'options' must be an array of exactly 4 strings` };
      }

      if (!q.options.every((opt: unknown) => typeof opt === 'string')) {
        return { valid: false, error: `Question ${qNum}: All options must be strings` };
      }

      if (!Number.isInteger(q.correctAnswer) || (q.correctAnswer as number) < 0 || (q.correctAnswer as number) > 3) {
        return { valid: false, error: `Question ${qNum}: 'correctAnswer' must be an integer between 0 and 3` };
      }

      if (!Number.isInteger(q.timeLimit) || (q.timeLimit as number) <= 0) {
        return { valid: false, error: `Question ${qNum}: 'timeLimit' must be a positive integer` };
      }

      if (!Number.isInteger(q.points) || (q.points as number) <= 0) {
        return { valid: false, error: `Question ${qNum}: 'points' must be a positive integer` };
      }
    }

    return { valid: true };
  };

  const showNotification = (message: string, type: "success" | "error" | "info") => {
    setNotification({ message, type, show: true });
    
    // Auto-hide notification after 4 seconds
    setTimeout(() => {
      setNotification(prev => prev ? { ...prev, show: false } : null);
    }, 4000);
    
    // Remove notification after animation
    setTimeout(() => {
      setNotification(null);
    }, 4500);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      const result = document.execCommand("copy");
      document.body.removeChild(textArea);
      return result;
    }
  };

  const handleCopyPrompt = async () => {
    const success = await copyToClipboard(chatgptPrompt);
    if (success) {
      setCopyButtonText("Copied!");
      // Reset button text after 2 seconds
      setTimeout(() => {
        setCopyButtonText("Copy Prompt");
      }, 2000);
    } else {
      showNotification("Failed to copy to clipboard", "error");
    }
  };

  const handleSaveQuiz = async () => {
    const jsonText = quizJson.trim();

    if (!jsonText) {
      showNotification("Please paste your quiz JSON.", "error");
      return;
    }

    try {
      // Parse and validate JSON
      const quizData: QuizData = JSON.parse(jsonText);
      const validation = validateQuizJson(quizData);

      if (!validation.valid) {
        showNotification(validation.error || "Invalid quiz format", "error");
        return;
      }

      setLoading(true);

      // Send to server
      const response = await fetch('/api/create-quiz', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(quizData)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        showNotification(`Quiz "${quizData.setName}" created successfully!`, "success");

        // Navigate back to dashboard after short delay
        setTimeout(() => {
          navigate("/teacher/dashboard");
        }, 1500);
      } else {
        showNotification(result.error || "Failed to create quiz", "error");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        showNotification("Invalid JSON format. Please check your JSON syntax.", "error");
      } else {
        showNotification("Error creating quiz: " + (error as Error).message, "error");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Redirecting...</span>
          </div>
          <p className="mt-2">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  return (
    <Layout 
      title="Create New Quiz"
      subtitle="Paste your quiz JSON or use our AI prompt to generate one"
      showLogout={true} 
      showBack={true} 
      backTo="/teacher/dashboard"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Main Content Card */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* Help Section */}
          <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-l-4 border-cyan-400 p-4 flex items-center justify-between">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="w-6 h-6 text-cyan-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7.5 3.5a.5.5 0 01-1 0V9a.5.5 0 011 0v4.5zm.5-6.5a.75.75 0 100-1.5.75.75 0 000 1.5z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-cyan-800">
                  <span className="font-semibold">Need help creating a quiz?</span>
                  <span className="ml-2">Use ChatGPT to generate quiz content.</span>
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowHelpModal(true)}
              className="bg-cyan-500 hover:bg-cyan-600 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
              </svg>
              <span>Get Instructions</span>
            </button>
          </div>

          {/* Form Content */}
          <div className="p-6">
            {/* Quiz JSON Input */}
            <div className="space-y-4">
              <div>
                <label className="block text-lg font-semibold text-gray-900 mb-3">
                  Quiz in JSON Format:
                </label>
                <textarea
                  className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm resize-none transition-colors duration-200"
                  rows={15}
                  placeholder="Paste your quiz JSON here..."
                  value={quizJson}
                  onChange={(e) => setQuizJson(e.target.value)}
                  disabled={loading}
                />
              </div>

              {/* Save Button - Only one button now */}
              <div className="flex justify-end">
                <button
                  onClick={handleSaveQuiz}
                  disabled={loading}
                  className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white px-8 py-3 rounded-lg font-semibold transition-colors duration-200 flex items-center space-x-2 min-w-[140px]"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Creating...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Quiz</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Help Modal */}
        {showHelpModal && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
            onClick={() => setShowHelpModal(false)}
          >
            <div 
              className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="bg-blue-600 text-white px-6 py-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold flex items-center min-w-0 flex-1 mr-4">
                  <svg className="w-5 h-5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <span className="truncate whitespace-nowrap overflow-hidden text-ellipsis">How to Create Your Quiz with ChatGPT</span>
                </h3>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="text-white hover:text-gray-200 transition-colors flex-shrink-0"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Modal Body */}
              <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
                <div className="mb-0">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start">
                      <svg className="w-5 h-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-blue-800">
                        <p className="font-semibold">
                          <span>Instructions: </span>
                          <span className="font-normal">Copy this prompt to ChatGPT along with your teaching materials. Make sure to replace <code className="bg-blue-100 px-1 py-0.5 rounded text-blue-900 font-mono text-sm">[YOUR TOPIC/MATERIALS]</code> with your actual content.</span>
                        </p>
                      </div>
                    </div>
                  </div>
                  <textarea
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-300 rounded-lg font-mono text-sm resize-none"
                    rows={8}
                    readOnly
                    value={chatgptPrompt}
                  />
                </div>
              </div>

              {/* Modal Footer */}
              <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                <a
                  href="/api/quiz-template"
                  className="bg-white hover:bg-gray-50 text-green-700 border border-green-300 px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
                  title="Download a sample quiz template"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="hidden sm:inline">JSON Template</span>
                  <span className="sm:hidden">Download</span>
                </a>
                <button
                  onClick={handleCopyPrompt}
                  className={`px-6 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2 ${
                    copyButtonText === "Copied!" 
                      ? "bg-green-600 text-white" 
                      : "bg-blue-600 hover:bg-blue-700 text-white"
                  }`}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={
                      copyButtonText === "Copied!" 
                        ? "M5 13l4 4L19 7"
                        : "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    } />
                  </svg>
                  <span className="hidden sm:inline">{copyButtonText}</span>
                  <span className="sm:hidden">{copyButtonText === "Copied!" ? "Copied!" : "Copy"}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {notification && (
          <div 
            className={`fixed top-4 right-4 z-50 max-w-sm w-full transition-transform duration-300 ease-in-out ${
              notification.show ? 'translate-x-0' : 'translate-x-full'
            }`}
          >
            <div className={`rounded-lg p-4 border border-gray-200 flex items-center space-x-3 ${
              notification.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 
              notification.type === 'error' ? 'bg-red-50 text-red-800 border-red-200' : 
              'bg-blue-50 text-blue-800 border-blue-200'
            }`}>
              <div className="flex-shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d={
                    notification.type === 'success' 
                      ? "M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      : notification.type === 'error'
                      ? "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                      : "M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                  } clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 text-sm font-medium">
                {notification.message}
              </div>
              <button
                onClick={() => setNotification(prev => prev ? { ...prev, show: false } : null)}
                className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default TeacherCreateQuiz;
