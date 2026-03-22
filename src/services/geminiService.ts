import { GoogleGenAI, Type } from "@google/genai";
import { UserProfile } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI() {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    // If apiKey is "undefined" (from Vite define) or missing, we handle it
    if (!apiKey || apiKey === "undefined") {
      console.warn("GEMINI_API_KEY is missing. Using fallback mode.");
      return null;
    }
    aiInstance = new GoogleGenAI({ apiKey });
  }
  return aiInstance;
}

export async function searchUserProfile(username: string): Promise<UserProfile> {
  // Demo mode for testing without API key if needed
  if (username.toLowerCase() === "demo") {
    return {
      username: "demo_user",
      displayName: "Demo User",
      profilePicture: "https://picsum.photos/seed/demo/200",
      followerCount: 12500,
    };
  }

  const localFallback = {
    username: username,
    displayName: username.charAt(0).toUpperCase() + username.slice(1),
    profilePicture: `https://picsum.photos/seed/${username}/200`,
    followerCount: Math.floor(Math.random() * 100000),
  };

  const apiPromise = (async () => {
    try {
      const ai = getAI();
      if (!ai) return localFallback;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a realistic TikTok-style user profile for the username: ${username}. 
        The profile should include a display name, a profile picture URL (use picsum.photos), and a follower count.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              username: { type: Type.STRING },
              displayName: { type: Type.STRING },
              profilePicture: { type: Type.STRING },
              followerCount: { type: Type.NUMBER },
            },
            required: ["username", "displayName", "profilePicture", "followerCount"],
          },
        },
      });

      const profile = JSON.parse(response.text || "{}") as UserProfile;
      
      // Ensure the profile picture is a valid picsum URL if not already
      if (!profile.profilePicture.startsWith("http")) {
        profile.profilePicture = `https://picsum.photos/seed/${username}/200`;
      }

      return profile;
    } catch (error) {
      console.error("Error searching user profile:", error);
      return localFallback;
    }
  })();

  const timeoutPromise = new Promise<UserProfile>((resolve) => {
    setTimeout(() => resolve(localFallback), 1800); // 1.8s timeout to be safe for 2s total
  });

  return Promise.race([apiPromise, timeoutPromise]);
}
