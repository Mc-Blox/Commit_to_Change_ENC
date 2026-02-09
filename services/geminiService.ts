
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const getAIClient = () => {
  return new GoogleGenAI({ apiKey: process.env.API_KEY });
};

const SOL_PRICE = 100; // Mock price for USD conversion

export const generateLeads = async (niche: string, location: string, goal: string): Promise<any> => {
  const ai = getAIClient();
  const prompt = `Find 5 potential business leads (people) in the ${niche} industry specifically located in ${location}. 
  The primary goal of this outreach is: ${goal}.
  Search across LinkedIn, X (Twitter), and Facebook. 
  Focus on founders, directors, or decision makers who would be interested in the goal mentioned. 
  Use Google Search to find real social profiles and recent posts. 
  Provide a list including their name, role, company, and their social profile URL or handle. 
  Identify which platform the profile belongs to and specific recent interests or news about them that aligns with the goal: ${goal}.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
    },
  });

  return {
    text: response.text,
    sources: response.candidates?.[0]?.groundingMetadata?.groundingChunks || [],
  };
};

export const refineLeadDetails = async (rawLeadText: string): Promise<any[]> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Parse this lead information into a structured JSON array. Each object should have 'name', 'title', 'company', 'email' (if found, else null), 'contactInfo' (the URL or handle), 'platform' (must be 'LinkedIn', 'X', or 'Facebook'), and a 'summary' of why they are a good lead. 
    Input: ${rawLeadText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            title: { type: Type.STRING },
            company: { type: Type.STRING },
            email: { type: Type.STRING, nullable: true },
            contactInfo: { type: Type.STRING },
            platform: { type: Type.STRING, description: "Must be 'LinkedIn', 'X', or 'Facebook'" },
            summary: { type: Type.STRING },
          },
          required: ["name", "title", "company", "contactInfo", "platform", "summary"]
        }
      }
    }
  });

  try {
    const jsonStr = response.text?.trim() || "[]";
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI response as JSON", e);
    return [];
  }
};

export const generatePersonalizedMessage = async (leadName: string, company: string, summary: string, userValueProp: string, platform: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Write a high-converting, professional introductory message for ${platform} to ${leadName} from ${company}. 
    Context about them: ${summary}. 
    My value proposition: ${userValueProp}. 
    Keep it appropriate for ${platform} (e.g. shorter and punchier for X, more professional for LinkedIn). Under 100 words.`,
  });

  return response.text || "";
};

/**
 * Simulates checking an inbox/social feed for a specific lead.
 * In a real app, this would use Gmail/OAuth tokens.
 */
export const analyzeInboxForLead = async (leadName: string, platform: string): Promise<{ status: 'responded' | 'no-reply' | 'declined', analysis: string }> => {
  const ai = getAIClient();
  // We mock the "email content" that the agent "found"
  const mockContext = `Agent is scanning private messages on ${platform} for ${leadName}...`;
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Simulate an agent checking a user's inbox. We sent a message to ${leadName} on ${platform}. 
    Decide if they responded favorably, didn't respond, or declined.
    Provide a JSON object with:
    1. 'status': one of ['responded', 'no-reply', 'declined']
    2. 'analysis': a brief summary of what the agent "found" or why it's categorized this way.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          status: { type: Type.STRING },
          analysis: { type: Type.STRING }
        },
        required: ["status", "analysis"]
      }
    }
  });

  try {
    return JSON.parse(response.text?.trim() || "{}");
  } catch (e) {
    return { status: 'no-reply', analysis: 'No incoming messages detected from this contact.' };
  }
};

export const generateFollowUpMessage = async (leadName: string, company: string, currentStatus: string, lastAnalysis: string, platform: string, template: string): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Generate a follow-up message for ${leadName} at ${company}. 
    Current situation: ${currentStatus}. 
    Agent analysis of last interaction: ${lastAnalysis}. 
    Platform: ${platform}.
    User Template: ${template}.
    
    The goal is to move the needle. If they didn't reply, be gentle and add value. If they replied, acknowledge their points. 
    Use the user's template as a style guide but make it sound natural for ${platform}.
    Keep it under 70 words.`,
  });

  return response.text || "";
};

export const getAccountabilityCoaching = async (historyStr: string, missedCount: number): Promise<string> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze my recent productivity performance. I have missed ${missedCount} days recently. My task history is: ${historyStr}. Give me deep strategic advice on how to fix my lead generation pipeline and stay consistent.`,
    config: {
      thinkingConfig: { thinkingBudget: 32768 }
    }
  });

  return response.text || "Keep pushing forward!";
};

export const getTaskAdjustmentAdvice = async (missedTask: any, reason: string): Promise<any> => {
  const ai = getAIClient();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `The user missed a task: "${missedTask.title}" (${missedTask.description}). 
    Reason given: "${reason}". 
    The user forfeited a stake of ${missedTask.stakeAmount} crypto.
    
    Analyze why this might have happened and provide:
    1. A brief empathetic but firm strategic recommendation for the future.
    2. A "Suggested Replacement Task" that is more manageable or adjusted based on the reason.
    
    Respond in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          recommendation: { type: Type.STRING },
          suggestedTask: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              description: { type: Type.STRING },
              stakeAmount: { type: Type.NUMBER }
            },
            required: ["title", "description", "stakeAmount"]
          }
        },
        required: ["recommendation", "suggestedTask"]
      }
    }
  });

  try {
    return JSON.parse(response.text?.trim() || "{}");
  } catch (e) {
    return { recommendation: "Try to break your tasks into smaller chunks.", suggestedTask: { ...missedTask, title: missedTask.title + " (Mini)" } };
  }
};
