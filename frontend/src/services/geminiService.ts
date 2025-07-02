// Request Gemini to convert the optimized CV to an ATS-friendly DOCX and return a Blob
export const convertCvToDocxWithGemini = async (cv: string, jobDesc: string): Promise<Blob> => {
  const response = await fetch("/api/gemini/convert-docx", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv, jobDesc })
  });
  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(errorText || "Failed to generate DOCX file. Please try again later.");
  }
  // Expecting a DOCX file as a Blob
  return await response.blob();
};
export const transformCvWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const response = await fetch("/api/gemini/transform", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv, jobDesc })
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text.trim()) {
    throw new Error("The AI returned an empty response for CV transformation. Please try refining your input or try again later.");
  }
  return text.trim();
};

export const simulateAtsScreeningWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const response = await fetch("/api/gemini/ats", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv, jobDesc })
  });
  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  if (!text.trim()) {
    throw new Error("The AI returned an empty ATS report. Please try again later.");
  }
  return text.trim();
};
