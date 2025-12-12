import { GoogleGenAI, Type } from "@google/genai";

// Ensure API_KEY is set in your environment variables
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
    console.warn("Clave API de Gemini no encontrada. Las funciones de IA estarán deshabilitadas.");
}

const ai = new GoogleGenAI({ apiKey: API_KEY! });

export const generateRaffleContent = async (prizeInfo: string): Promise<{ title: string; description: string }> => {
    if (!API_KEY) {
        return {
            title: `Rifa para: ${prizeInfo}`,
            description: 'La generación de contenido por IA está deshabilitada. Por favor, añade una clave API.'
        };
    }
    
    try {
        const prompt = `Eres un experto en marketing creativo para una empresa de rifas llamada "RifaRaiz".
        Se está creando una nueva rifa para el siguiente premio: "${prizeInfo}".
        Genera un título de rifa atractivo y emocionante en español, y una descripción de marketing convincente y persuasiva en español (menos de 80 palabras).
        El tono debe ser emocionante y crear una sensación de urgencia y deseo.
        Devuelve la respuesta como un objeto JSON con dos claves: "title" y "description". El contenido de ambas claves debe estar en español.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                // FIX: Added responseSchema to ensure consistent JSON output format.
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        title: {
                            type: Type.STRING,
                            description: "El título atractivo y emocionante de la rifa."
                        },
                        description: {
                            type: Type.STRING,
                            description: "La descripción de marketing convincente y persuasiva (menos de 80 palabras)."
                        }
                    },
                    required: ["title", "description"]
                }
            }
        });

        const text = response.text.trim();
        const jsonResponse = JSON.parse(text);

        if (jsonResponse.title && jsonResponse.description) {
            return jsonResponse;
        } else {
            throw new Error("Respuesta JSON inválida de la IA.");
        }
    } catch (error) {
        console.error("Error generando contenido de la rifa con Gemini:", error);
        return {
            title: `Rifa para: ${prizeInfo}`,
            description: `Hubo un error al generar la descripción. Por favor, escríbela manualmente.`
        };
    }
};
