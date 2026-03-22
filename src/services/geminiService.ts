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

  // Try RapidAPI via our server proxy first
  try {
    const response = await fetch(`/api/tiktok/user/${username}`);
    if (response.ok) {
      const data = await response.json();
      return data as UserProfile;
    }
  } catch (error) {
    console.warn("Server proxy failed, trying direct client-side call (Netlify/Vercel mode)...");
  }

  // Fallback: Try direct client-side call (useful for Netlify/Vercel static deployments)
  const clientApiKey = import.meta.env.VITE_RAPIDAPI_KEY;
  const clientApiHost = import.meta.env.VITE_RAPIDAPI_HOST || "tiktok-scraper7.p.rapidapi.com";

  if (clientApiKey) {
    try {
      const response = await fetch(`https://${clientApiHost}/user/info?unique_id=${username}`, {
        headers: {
          "x-rapidapi-key": clientApiKey,
          "x-rapidapi-host": clientApiHost,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data && data.code === 0 && data.data) {
          const user = data.data.user;
          const stats = data.data.stats;
          return {
            username: user.uniqueId,
            displayName: user.nickname,
            profilePicture: user.avatarLarger || user.avatarMedium || user.avatarThumb,
            followerCount: stats.followerCount,
          };
        }
      }
    } catch (error) {
      console.error("Direct TikTok API call failed:", error);
    }
  }

  const apiPromise = (async () => {
    try {
      const ai = getAI();
      if (!ai) return localFallback;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Find the real TikTok profile information for the username: ${username}. 
        Search the web to find their actual display name, their real follower count, and a valid URL to their profile picture.
        If you cannot find the exact profile, find the most likely match or return the most accurate data available.
        Return the data in the specified JSON format.`,
        config: {
          tools: [{ googleSearch: {} }],
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
