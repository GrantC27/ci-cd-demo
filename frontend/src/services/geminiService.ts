import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot contact the AI service.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const transformCvWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const response = await fetch("/api/transform-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv, jobDesc, mode: "transform" }),
  });
  if (!response.ok) throw new Error("Failed to transform CV");
  const data = await response.json();
  return data.result;
};

export const simulateAtsScreeningWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const response = await fetch("/api/transform-cv", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cv, jobDesc, mode: "ats" }),
  });
  if (!response.ok) throw new Error("Failed to simulate ATS screening");
  const data = await response.json();
  return data.result;
};
