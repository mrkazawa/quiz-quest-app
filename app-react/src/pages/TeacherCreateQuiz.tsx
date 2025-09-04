import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.js";

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
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  
  const [quizJson, setQuizJson] = useState("");
  const [loading, setLoading] = useState(false);
  const [validationMessage, setValidationMessage] = useState<{
    message: string;
    type: "success" | "danger" | "info";
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

  const showValidationMessage = (message: string, type: "success" | "danger" | "info") => {
    setValidationMessage({ message, type });
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
      showValidationMessage("Failed to copy to clipboard", "danger");
    }
  };

  const handleSaveQuiz = async () => {
    const jsonText = quizJson.trim();

    if (!jsonText) {
      showValidationMessage("Please paste your quiz JSON.", "danger");
      return;
    }

    try {
      // Parse and validate JSON
      const quizData: QuizData = JSON.parse(jsonText);
      const validation = validateQuizJson(quizData);

      if (!validation.valid) {
        showValidationMessage(validation.error || "Invalid quiz format", "danger");
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
        showValidationMessage(`Quiz "${quizData.setName}" created successfully!`, "success");

        // Navigate back to dashboard after short delay
        setTimeout(() => {
          navigate("/teacher/dashboard");
        }, 1500);
      } else {
        showValidationMessage(result.error || "Failed to create quiz", "danger");
      }
    } catch (error) {
      if (error instanceof SyntaxError) {
        showValidationMessage("Invalid JSON format. Please check your JSON syntax.", "danger");
      } else {
        showValidationMessage("Error creating quiz: " + (error as Error).message, "danger");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate("/");
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
    <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "1rem 1.5rem" }}>
      {/* Header */}
      <div className="mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="mb-1">Create New Quiz</h1>
            <p className="text-muted mb-0">
              Create a new quiz by pasting JSON format or use ChatGPT to generate one
            </p>
          </div>
          <div>
            <button
              className="btn btn-outline-danger btn-sm"
              onClick={handleLogout}
            >
              <i className="bi bi-box-arrow-right"></i>
              <span className="d-none d-md-inline ms-2">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content - Removed padding from card body */}
      <div className="card shadow-sm">
        <div className="card-body p-0">
          {/* Help Section - Compact alert with 100% width */}
          <div className="alert alert-info table-alert d-flex align-items-center" 
               style={{ 
                 background: "linear-gradient(135deg, #d1ecf1 0%, #bee5eb 100%)",
                 borderLeft: "4px solid #0dcaf0",
                 color: "#055160"
               }}>
            <i className="bi bi-lightbulb-fill me-3" style={{ fontSize: "1.2rem", color: "#0dcaf0" }}></i>
            <div className="flex-grow-1">
              <span className="fw-bold me-2">Need help creating a quiz?</span>
              <span style={{ color: "#0c5460" }}>Use ChatGPT to generate quiz content.</span>
            </div>
            <button
              className="btn btn-info btn-sm ms-3"
              onClick={() => setShowHelpModal(true)}
              style={{ fontWeight: "500" }}
            >
              <i className="bi bi-chat-square-text-fill me-2"></i>
              Get Instructions
            </button>
          </div>

          {/* Quiz JSON Input - Added padding top for spacing */}
          <div className="mb-4 pt-4">
            <div className="mb-0">
              <label className="form-label fw-bold fs-5">Quiz in JSON Format:</label>
            </div>
            <textarea
              className="form-control font-monospace"
              rows={15}
              placeholder="Paste your quiz JSON here..."
              value={quizJson}
              onChange={(e) => setQuizJson(e.target.value)}
              disabled={loading}
              style={{ 
                fontSize: "0.85rem",
                lineHeight: "1.4",
                border: "2px solid #e9ecef",
                borderRadius: "8px"
              }}
            />
          </div>

          {/* Validation Message */}
          {validationMessage && (
            <div className={`alert alert-${validationMessage.type} mx-4 mb-4`} 
                 style={{ borderRadius: "8px", border: "none" }} 
                 role="alert">
              <i className={`bi ${
                validationMessage.type === 'success' ? 'bi-check-circle-fill' : 
                validationMessage.type === 'danger' ? 'bi-exclamation-triangle-fill' : 
                'bi-info-circle-fill'
              } me-2`}></i>
              {validationMessage.message}
            </div>
          )}

          {/* Action Buttons - Back on leftmost, Save on rightmost */}
          <div className="d-flex justify-content-between align-items-center">
            <button
              className="btn btn-secondary btn-lg"
              onClick={() => navigate("/teacher/dashboard")}
              style={{ minWidth: "120px" }}
            >
              <i className="bi bi-arrow-left me-2"></i>
              Back
            </button>
            <button
              className="btn btn-success btn-lg"
              onClick={handleSaveQuiz}
              disabled={loading}
              style={{ minWidth: "140px" }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Creating...
                </>
              ) : (
                <>
                  <i className="bi bi-check-lg me-2"></i>
                  Save Quiz
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Help Modal - Added Download Template button */}
      {showHelpModal && (
        <div 
          className="modal show d-block" 
          tabIndex={-1} 
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          onClick={() => setShowHelpModal(false)}
        >
          <div 
            className="modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-content">
              <div className="modal-header bg-primary text-white mb-0">
                <h5 className="modal-title mb-0">
                  <i className="bi bi-chat-square-text-fill me-2"></i>
                  How to Create Your Quiz with ChatGPT
                </h5>
                <button
                  type="button"
                  className="btn-close btn-close-white"
                  onClick={() => setShowHelpModal(false)}
                ></button>
              </div>
              <div className="modal-body">
                <div className="mb-0">
                  <div className="alert alert-info border-0" style={{ backgroundColor: "#e7f3ff" }}>
                    <i className="bi bi-info-circle-fill me-2"></i>
                    <strong>Instructions:</strong> Copy this prompt to ChatGPT along with your teaching materials. 
                    Make sure to replace <code>[YOUR TOPIC/MATERIALS]</code> with your actual content.
                  </div>
                  <textarea
                    className="form-control font-monospace bg-light"
                    rows={15}
                    readOnly
                    value={chatgptPrompt}
                    style={{ 
                      resize: "none",
                      fontSize: "0.85rem",
                      lineHeight: "1.4",
                      border: "2px solid #dee2e6"
                    }}
                  />
                </div>
              </div>
              <div className="modal-footer bg-light">
                <div className="d-flex justify-content-between w-100">
                  <a
                    href="/api/quiz-template"
                    className="btn btn-outline-success"
                    title="Download a sample quiz template"
                  >
                    <i className="bi bi-file-earmark-text me-1"></i>
                    JSON Template
                  </a>
                  <button
                    className={`btn ${copyButtonText === "Copied!" ? "btn-success" : "btn-primary"}`}
                    onClick={handleCopyPrompt}
                    style={{ 
                      opacity: copyButtonText === "Copied!" ? 0.6 : 1,
                      transition: "all 0.3s ease"
                    }}
                  >
                    <i className={`bi ${copyButtonText === "Copied!" ? "bi-check" : "bi-clipboard"} me-1`}></i>
                    {copyButtonText}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TeacherCreateQuiz;
