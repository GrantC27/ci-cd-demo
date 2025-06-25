
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { GEMINI_MODEL_NAME } from '../constants';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set. The application cannot contact the AI service.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const transformCvWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const prompt = `
You are an expert CV writer and career coach specializing in optimizing resumes to pass Applicant Tracking Systems (ATS) and impress recruiters.
Your task is to transform the provided CV to better align with the given job description.

Follow these instructions carefully:
1.  Analyze the JOB DESCRIPTION to identify key skills, experiences, qualifications, and keywords. Pay close attention to action verbs and specific requirements.
2.  Analyze the ORIGINAL CV to understand the candidate's existing skills, experiences, achievements, and career trajectory.
3.  Rewrite and rephrase sections of the ORIGINAL CV to prominently feature the candidate's qualifications that are most relevant to the JOB DESCRIPTION. Use strong action verbs.
4.  Integrate keywords and key phrases from the JOB DESCRIPTION naturally and contextually into the CV. Avoid keyword stuffing.
5.  Quantify achievements wherever possible (e.g., "Increased sales by 15%" instead of "Responsible for sales"). If the original CV lacks quantification, suggest placeholders or rephrase to emphasize impact.
6.  Ensure the transformed CV uses clear, concise language and a professional, confident tone. Eliminate jargon not relevant to the target role.
7.  Maintain the factual accuracy of the original CV. Do not invent experiences, skills, or qualifications.
8.  The output should be the FULL TEXT of the transformed CV, ready to be copied and pasted. Do not include any introductory or concluding remarks, meta-comments, or explanations about your process. ONLY output the CV text.
9.  Structure the transformed CV logically (e.g., Professional Summary, Work Experience, Education, Skills). If the original CV has a clear structure, adapt it or improve it for ATS compatibility and readability. A common effective order is: Contact Info (assume provided separately), Summary/Objective, Skills, Experience, Education, Projects (if applicable).
10. For the 'Skills' section, categorize skills if appropriate (e.g., Technical Skills, Soft Skills) and ensure they align with the job description's requirements.
11. Tailor the Professional Summary to be a compelling pitch directly addressing the needs outlined in the job description, using keywords from it.

ORIGINAL CV:
---
${cv}
---

JOB DESCRIPTION:
---
${jobDesc}
---

TRANSFORMED CV:
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: GEMINI_MODEL_NAME,
      contents: prompt,
    });
    
    const transformedText = response.text;
    
    if (!transformedText || transformedText.trim() === "") {
        throw new Error("The AI returned an empty response for CV transformation. Please try refining your input or try again later.");
    }
    
    return transformedText.trim();

  } catch (error: unknown) {
    console.error("Gemini API call failed (transformCvWithGemini):", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid API Key for CV transformation. Please ensure your API_KEY environment variable is correctly configured.");
        }
        throw new Error(`Failed to transform CV: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service for CV transformation.");
  }
};


export const simulateAtsScreeningWithGemini = async (cv: string, jobDesc: string): Promise<string> => {
  const prompt = `
You are an advanced Applicant Tracking System (ATS) simulator. Your task is to evaluate the provided CV against the given Job Description and provide a detailed analysis of its suitability.

JOB DESCRIPTION:
---
${jobDesc}
---

CV TO EVALUATE:
---
${cv}
---

Provide your analysis in the following format. Use Markdown-style headings for each section (e.g. ### Overall Suitability):

### Overall Suitability
(Provide a qualitative rating AND a percentage score. Format: "Qualitative Rating (e.g., High Fit) - Score: XX/100". Example: "Good Fit - Score: 82/100".)

### Key Strengths
(List 3-5 specific aspects of the CV that strongly align with the job description. Use bullet points. Be specific and mention keywords or skills if applicable.)

### Areas for Improvement / Gaps
(List 3-5 specific areas where the CV falls short or could be better aligned. Use bullet points. Suggest what's missing or how it could be improved from an ATS perspective.)

### Keyword Alignment
(Briefly comment on how well keywords from the job description are present and contextually used in the CV. Be specific if possible.)

Do not add any conversational fluff or introductory/concluding remarks outside of this structured analysis. Output only the analysis.
`;

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
        model: GEMINI_MODEL_NAME,
        contents: prompt,
        // No thinkingConfig, default to enabled for higher quality.
      });
  
      const atsReportText = response.text;
  
      if (!atsReportText || atsReportText.trim() === "") {
          throw new Error("The AI returned an empty ATS report. Please try again later.");
      }
      
      return atsReportText.trim();

  } catch (error: unknown) {
    console.error("Gemini API call failed (simulateAtsScreeningWithGemini):", error);
    if (error instanceof Error) {
        if (error.message.includes("API key not valid")) {
             throw new Error("Invalid API Key for ATS simulation. Please ensure your API_KEY environment variable is correctly configured.");
        }
        throw new Error(`Failed to simulate ATS screening: ${error.message}`);
    }
    throw new Error("An unknown error occurred while communicating with the AI service for ATS simulation.");
  }
};
