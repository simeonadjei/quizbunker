export interface ParsedQuestion {
  year: string;
  subject: string;
  week: number;
  weekTopic: string;
  questionNumber: number;
  questionText: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  dok?: string;
  learningIndicator?: string;
  feedback?: string;
}

function isComplete(q: Partial<ParsedQuestion>): q is ParsedQuestion {
  return !!(
    q.year &&
    q.subject &&
    q.week &&
    q.weekTopic !== undefined &&
    q.questionText &&
    q.optionA &&
    q.optionB &&
    q.optionC &&
    q.optionD &&
    q.correctAnswer
  );
}

export function parseQuestionText(
  rawText: string,
  overrideYear?: string,
  overrideSubject?: string,
): { questions: ParsedQuestion[]; errors: string[] } {
  // Normalize: split on newlines, trim each line, filter empty
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0);

  let year = overrideYear || "";
  let subject = overrideSubject || "";
  let week = 0;
  let weekTopic = "";

  const questions: ParsedQuestion[] = [];
  const errors: string[] = [];
  let current: Partial<ParsedQuestion> = {};
  let inAnswerKey = false;

  const saveCurrentQuestion = () => {
    if (Object.keys(current).length === 0) return;
    if (isComplete(current)) {
      questions.push({ ...current } as ParsedQuestion);
    } else if (current.questionNumber) {
      const missing = (
        ["questionText", "optionA", "optionB", "optionC", "optionD", "correctAnswer"] as const
      )
        .filter((k) => !current[k])
        .join(", ");
      errors.push(`Q${current.questionNumber}: incomplete (missing: ${missing})`);
    }
    current = {};
  };

  for (const line of lines) {
    // Stop parsing at answer key section
    if (/^ANSWER\s+KEY/i.test(line)) {
      saveCurrentQuestion();
      inAnswerKey = true;
      continue;
    }

    if (inAnswerKey) continue;

    // Parse header line: "Year 1 General Science"
    if (!year || !subject) {
      const headerMatch = line.match(/^Year\s+(\S+)\s+(.+)$/i);
      if (headerMatch) {
        year = `Year ${headerMatch[1]}`;
        subject = headerMatch[2].trim();
        continue;
      }
    }

    // Parse week header: "WEEK 14: DESIGNING AND INSTALLING..."
    const weekMatch = line.match(/^WEEK\s+(\d+)\s*:\s*(.+)$/i);
    if (weekMatch) {
      saveCurrentQuestion();
      week = parseInt(weekMatch[1], 10);
      weekTopic = weekMatch[2].trim();
      continue;
    }

    // Parse question start: "1. Question text here" OR "Question 1: text"
    const questionMatch =
      line.match(/^(\d+)\.\s+(.+)$/) ||
      line.match(/^Question\s+(\d+)\s*[:.]\s+(.+)$/i);
    if (questionMatch) {
      saveCurrentQuestion();
      current = {
        year: overrideYear || year,
        subject: overrideSubject || subject,
        week,
        weekTopic,
        questionNumber: parseInt(questionMatch[1], 10),
        questionText: questionMatch[2],
        optionA: "",
        optionB: "",
        optionC: "",
        optionD: "",
        correctAnswer: "",
      };
      continue;
    }

    if (!current.questionNumber) continue;

    // Parse option: "A. Option text"
    const optionMatch = line.match(/^([ABCD])\.\s+(.+)$/);
    if (optionMatch) {
      const [, letter, text] = optionMatch;
      if (letter === "A") current.optionA = text;
      else if (letter === "B") current.optionB = text;
      else if (letter === "C") current.optionC = text;
      else if (letter === "D") current.optionD = text;
      continue;
    }

    // Parse answer: "Answer: B"
    const answerMatch = line.match(/^Answer\s*:\s*([ABCD])/i);
    if (answerMatch) {
      current.correctAnswer = answerMatch[1].toUpperCase();
      continue;
    }

    // Parse feedback: "Feedback: explanation text"
    const feedbackMatch = line.match(/^Feedback\s*:\s*(.+)$/i);
    if (feedbackMatch) {
      current.feedback = feedbackMatch[1].trim();
      continue;
    }
  }

  // Save the last question
  saveCurrentQuestion();

  return { questions, errors };
}
