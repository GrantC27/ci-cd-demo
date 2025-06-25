import { serveStatic } from "@cloudflare/kv-asset-handler";

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (url.pathname === "/api/gemini/transform" && request.method === "POST") {
      // Proxy for CV transformation
      const { cv, jobDesc, model } = await request.json();
      const prompt = `\nYou are an expert CV writer and career coach specializing in optimizing resumes to pass Applicant Tracking Systems (ATS) and impress recruiters.\nYour task is to transform the provided CV to better align with the given job description.\n\nFollow these instructions carefully:\n1.  Analyze the JOB DESCRIPTION to identify key skills, experiences, qualifications, and keywords. Pay close attention to action verbs and specific requirements.\n2.  Analyze the ORIGINAL CV to understand the candidate's existing skills, experiences, achievements, and career trajectory.\n3.  Rewrite and rephrase sections of the ORIGINAL CV to prominently feature the candidate's qualifications that are most relevant to the JOB DESCRIPTION. Use strong action verbs.\n4.  Integrate keywords and key phrases from the JOB DESCRIPTION naturally and contextually into the CV. Avoid keyword stuffing.\n5.  Quantify achievements wherever possible (e.g., "Increased sales by 15%" instead of "Responsible for sales"). If the original CV lacks quantification, suggest placeholders or rephrase to emphasize impact.\n6.  Ensure the transformed CV uses clear, concise language and a professional, confident tone. Eliminate jargon not relevant to the target role.\n7.  Maintain the factual accuracy of the original CV. Do not invent experiences, skills, or qualifications.\n8.  The output should be the FULL TEXT of the transformed CV, ready to be copied and pasted. Do not include any introductory or concluding remarks, meta-comments, or explanations about your process. ONLY output the CV text.\n9.  Structure the transformed CV logically (e.g., Professional Summary, Work Experience, Education, Skills). If the original CV has a clear structure, adapt it or improve it for ATS compatibility and readability. A common effective order is: Contact Info (assume provided separately), Summary/Objective, Skills, Experience, Education, Projects (if applicable).\n10. For the 'Skills' section, categorize skills if appropriate (e.g., Technical Skills, Soft Skills) and ensure they align with the job description's requirements.\n11. Tailor the Professional Summary to be a compelling pitch directly addressing the needs outlined in the job description, using keywords from it.\n\nORIGINAL CV:\n---\n${cv}\n---\n\nJOB DESCRIPTION:\n---\n${jobDesc}\n---\nTRANSFORMED CV:`;
      const geminiRes = await fetch(`${GEMINI_API_URL}${model || env.GEMINI_MODEL_NAME}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await geminiRes.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    }

    if (url.pathname === "/api/gemini/ats" && request.method === "POST") {
      // Proxy for ATS simulation
      const { cv, jobDesc, model } = await request.json();
      const prompt = `\nYou are an advanced Applicant Tracking System (ATS) simulator. Your task is to evaluate the provided CV against the given Job Description and provide a detailed analysis of its suitability.\n\nJOB DESCRIPTION:\n---\n${jobDesc}\n---\n\nCV TO EVALUATE:\n---\n${cv}\n---\n\nProvide your analysis in the following format. Use Markdown-style headings for each section (e.g. ### Overall Suitability):\n\n### Overall Suitability\n(Provide a qualitative rating AND a percentage score. Format: "Qualitative Rating (e.g., High Fit) - Score: XX/100". Example: "Good Fit - Score: 82/100".)\n\n### Key Strengths\n(List 3-5 specific aspects of the CV that strongly align with the job description. Use bullet points. Be specific and mention keywords or skills if applicable.)\n\n### Areas for Improvement / Gaps\n(List 3-5 specific areas where the CV falls short or could be better aligned. Use bullet points. Suggest what's missing or how it could be improved from an ATS perspective.)\n\n### Keyword Alignment\n(Briefly comment on how well keywords from the job description are present and contextually used in the CV. Be specific if possible.)\n\nDo not add any conversational fluff or introductory/concluding remarks outside of this structured analysis. Output only the analysis.`;
      const geminiRes = await fetch(`${GEMINI_API_URL}${model || env.GEMINI_MODEL_NAME}:generateContent?key=${env.GEMINI_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
          })
        }
      );
      const data = await geminiRes.json();
      return new Response(JSON.stringify(data), { headers: { "Content-Type": "application/json" } });
    }

    return serveStatic(request, env.ASSETS, { mapRequestToAsset: req => req });
  },
};
