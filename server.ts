import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

// Create Gemini AI client using the server-side API key
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // --- API ROUTES ---
  
  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: process.env.NODE_ENV || "development" });
  });

  // Live TV Program using Google Search Grounding
  app.get("/api/live-tv", async (req, res) => {
    try {
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        console.log("No GEMINI_API_KEY provided, returning fallback local shows.");
        return res.json({ source: "local_fallback", shows: null });
      }

      console.log("Fetching live TV program using Gemini Google Search Grounding...");
      
      const prompt = `Search the web for the actual current Slovak TV program (TV program na dnes - 24. jún 2026) for major channels: Jednotka, TV Markíza, TV JOJ, HBO, Spektrum, and Eurosport 1.
Identify the real movies, series, shows, and sporting events scheduled for today.

CRITICAL: For every single program/movie/series identified, you MUST search ČSFD (csfd.cz) to retrieve its actual, real-world ČSFD rating percentage (e.g. 84 for 84%).
- Use real ČSFD rating values from Česko-Slovenská filmová databáze. Do not invent these numbers.
- If a show is a series, find the general series rating on ČSFD (e.g. "Teória veľkého tresku" is 89%, "Dunaj, k vašim službám" is around 75%, "Nemocnica" is around 40%, etc.).
- If a program is a news broadcast (e.g. "Televízne noviny" is 35%) or a live sport broadcast (e.g. "Eurosport Live" or "Tour de France"), search CSFD for its entry or assign the actual percentage rating listed on ČSFD.
- Include the real Slovak title of the program, correct broadcast times (startTime and endTime in HH:MM format matching today's actual schedule), real IMDb ratings, correct year of release, director, and lead cast.

Return a JSON array of 12-22 show objects.
Do not include any markdown backticks like \`\`\`json or \`\`\` in your response, just return the raw JSON text directly so it can be parsed with JSON.parse.

Each object in the array MUST strictly match this schema:
{
  "id": "string (unique identifier, e.g. 'live_m1', 'live_j2')",
  "station": "string (MUST be one of: 'TV Markíza', 'TV JOJ', 'Jednotka', 'HBO', 'Spektrum', 'Eurosport 1')",
  "title": "string (real Slovak title of the program)",
  "startTime": "string (format 'HH:MM', e.g. '20:30')",
  "endTime": "string (format 'HH:MM', e.g. '21:50')",
  "durationMinutes": 120,
  "description": "string (real description in Slovak describing this specific movie/episode)",
  "genre": "string (MUST be one of: 'Dráma', 'Dokument', 'Sci-Fi / Fantasy', 'Komédia', 'Akcia', 'Rozprávky / Animovaný', 'Šport', 'Thriller / Horor')",
  "posterUrl": "string (a high-quality Unsplash image URL matching the show theme/genre, e.g. 'https://images.unsplash.com/photo-1543536448-d209d2d13a1c')",
  "ratingCsfd": 85, // MUST BE THE REAL PERCENTAGE RATING FROM CSFD (0-100)
  "ratingImdb": 7.9,
  "cast": ["actor1", "actor2"],
  "director": "string",
  "year": 2024,
  "isMovie": true
}

Make sure to distribute shows across morning, afternoon, prime-time (20:30), and late night. Provide at least 2-3 shows for each of the 6 stations. Ensure the startTime and endTime are consecutive or cover popular times today. Only return the valid JSON array without any other text.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        }
      });

      let responseText = response.text || "";
      console.log("Raw response from Gemini live-tv:", responseText.substring(0, 150) + "...");

      // Clean response text from potential markdown wrappers
      responseText = responseText.trim();
      if (responseText.startsWith("```json")) {
        responseText = responseText.substring(7);
      } else if (responseText.startsWith("```")) {
        responseText = responseText.substring(3);
      }
      if (responseText.endsWith("```")) {
        responseText = responseText.substring(0, responseText.length - 3);
      }
      responseText = responseText.trim();

      const shows = JSON.parse(responseText);
      
      if (Array.isArray(shows) && shows.length > 0) {
        console.log(`Successfully parsed ${shows.length} live shows from Gemini Search Grounding.`);
        return res.json({ source: "gemini_grounding", shows });
      } else {
        throw new Error("Parsed content is not a non-empty array");
      }
    } catch (error: any) {
      console.error("Error fetching live TV program via Gemini Search Grounding:", error);
      res.json({ source: "local_fallback", shows: null, error: error.message });
    }
  });

  // Endpoint: Generate personalized recommendation commentary for a specific show
  app.post("/api/show-insights", async (req, res) => {
    try {
      const { userProfile, show } = req.body;
      
      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({
          insights: `Pre zobrazenie AI zdôvodnení odporúčaní si prosím pridajte svoj **GEMINI_API_KEY** do panelu **Settings > Secrets** v AI Studio.\n\nBez kľúča ti aspoň môžeme povedať, že tento program (${show.title}) patrí do tvojho obľúbeného žánru **${show.genre}**!`
        });
      }

      if (!userProfile || !show) {
        return res.status(400).json({ error: "Missing userProfile or show data" });
      }

      const prompt = `Si inteligentný slovenský televízny sprievodca "finda".
Používateľ sa volá ${userProfile.name}, narodil sa ${userProfile.birthDate}, používa operátora ${userProfile.operator}.
Jeho obľúbené žánre sú: ${userProfile.favoriteGenres.join(", ")}.
Jeho obľúbené filmy a seriály sú: "${userProfile.favoriteShows}".

Aktuálne si klikol na televízny program:
Názov: ${show.title}
Stanica: ${show.station}
Žáner: ${show.genre}
Popis: ${show.description}
Čas: ${show.startTime} - ${show.endTime}
Hodnotenie ČSFD/IMDb: ČSFD ${show.ratingCsfd || "N/A"}%, IMDb ${show.ratingImdb || "N/A"}/10

Vygeneruj krátke, osobné, priateľské a presvedčivé zdôvodnenie (max 3 vety) v slovenčine, prečo by si mal ${userProfile.name} tento program pozrieť.
Použi tykanie, oslovuj ho menom, naviaž to na jeho vybrané žánre alebo obľúbené tituly, ak je to možné. Ak program úplne nezapadá, milo mu vysvetli, prečo by to mohla byť zaujímavá zmena. Na záver pridaj jeden trefný televízny emoji. Buduj dôveru ako TV kamoš.`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: prompt,
      });

      res.json({ insights: response.text });
    } catch (error: any) {
      console.error("Error in show-insights:", error);
      res.status(500).json({ error: error.message || "Interná chyba servera" });
    }
  });

  // Endpoint: Finda AI Companion Chatbot
  app.post("/api/chat", async (req, res) => {
    try {
      const { message, history, userProfile, currentShows } = req.body;

      if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "MY_GEMINI_API_KEY") {
        return res.json({
          reply: `Ahoj! Ja som tvoj AI TV sprievodca **finda**. Rád by som ti poradil, ale momentálne nemám prístup k **GEMINI_API_KEY**. Poprosím ťa, aby si ho vložil do **Settings > Secrets** v AI Studio.\n\nZatiaľ si môžeš prezerať náš programový prehľad, vybrať si operátora alebo upraviť svoj profil! 🍿`
        });
      }

      // Structure system instructions
      const systemInstruction = `Si inteligentný, vtipný a veľmi scestovaný slovenský televízny poradca menom "finda".
Pomáhaš používateľom nájsť ten najlepší program na dnes večer, kecáš s nimi o filmoch, seriáloch, hercoch a športových prenosoch.

Informácie o aktuálnom používateľovi:
Meno: ${userProfile?.name || "Kamoš"}
Operátor: ${userProfile?.operator || "Satelit/Kábel"}
Obľúbené žánre: ${userProfile?.favoriteGenres?.join(", ") || "Všetky"}
Napísal o svojom vkuse: "${userProfile?.favoriteShows || "nič"}"

Tu je zoznam aktuálne vysielaných programov v našej databáze:
${JSON.stringify(currentShows || [])}

Pravidlá odpovedania:
1. Odpovedaj VŽDY v slovenčine.
2. Buď extrémne priateľský, používaj tykanie a občas oslov používateľa menom (${userProfile?.name || "Kamoš"}).
3. Keď sa používateľ spýta na odporúčanie, pozri sa na aktuálne programy v našej databáze a odporuč tie, ktoré sa zhodujú s jeho vkusom, alebo mu vysvetli, prečo by mal vyskúšať niečo iné.
4. Používaj filmové a televízne emoji (🍿, 🎬, 📺, 📡, 🏆).
5. Tvoja odpoveď by mala byť stručná, prehľadná a pútavá (približne 2-4 odseky max, žiadne obrie litánie).`;

      // Formulate complete contents including instructions and the message
      // To preserve history correctly, map history to standard parts
      const contents = [
        { role: "user", parts: [{ text: systemInstruction }] },
        { role: "model", parts: [{ text: "Rozumiem! Som finda, tvoj najlepší slovenský TV kamoš. Ako ti dnes pomôžem vybrať ten najlepší program?" }] }
      ];

      // Append past chat history if it exists
      if (history && history.length > 0) {
        history.forEach((h: any) => {
          contents.push({
            role: h.role === "user" ? "user" : "model",
            parts: [{ text: h.text }]
          });
        });
      }

      // Append latest message
      contents.push({
        role: "user",
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: contents,
      });

      res.json({ reply: response.text });
    } catch (error: any) {
      console.error("Error in AI Chat:", error);
      res.status(500).json({ error: error.message || "Interná chyba servera" });
    }
  });

  // --- VITE MIDDLEWARE SETUP ---
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode (Vite middleware enabled)");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode (Static asset server enabled)");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`finda full-stack backend running on port ${PORT}`);
  });
}

startServer();
