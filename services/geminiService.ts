import { GoogleGenAI, Modality } from "@google/genai";

// Assume process.env.API_KEY is configured in the environment
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

export const enhancePrompt = async (prompt: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        systemInstruction: 'أنت خبير في هندسة الأوصاف لنماذج تحويل النص إلى صور بالذكاء الاصطناعي. مهمتك هي إعادة كتابة وصف المستخدم البسيط إلى وصف غني ومفصل ووصفي بصريًا. ركز على إضافة تفاصيل حول الموضوع والبيئة والإضاءة والأسلوب الفني والتكوين والحالة المزاجية. يجب أن يكون الناتج هو نص الوصف المحسّن فقط، بدون أي عبارات حوارية أو مقدمات أو شروحات.',
      },
    });
    return response.text.trim();
  } catch (error) {
    console.error("Error enhancing prompt with Gemini API:", error);
    throw new Error("Failed to enhance prompt. Please try again.");
  }
};

export const generateImagesFromPrompt = async (
  prompt: string,
  aspectRatio: string,
  quality: string
): Promise<string[]> => {
  let qualityPromptPrefix = '';
  switch (quality) {
    case 'high':
      qualityPromptPrefix = 'إنشاء صورة عالية الجودة ومفصلة فوتوغرافيًا: ';
      break;
    case 'medium':
      qualityPromptPrefix = 'إنشاء صورة بجودة جيدة: ';
      break;
    case 'low':
      qualityPromptPrefix = 'إنشاء رسم بسيط وتفاصيل قليلة لـ: ';
      break;
    default:
      qualityPromptPrefix = 'إنشاء صورة: ';
  }

  const finalPrompt = `${qualityPromptPrefix}${prompt}`;

  try {
    const response = await ai.models.generateImages({
      model: 'imagen-4.0-generate-001',
      prompt: finalPrompt,
      config: {
        numberOfImages: 4,
        outputMimeType: 'image/jpeg',
        aspectRatio: aspectRatio,
      },
    });

    if (response.generatedImages && response.generatedImages.length > 0) {
      return response.generatedImages.map(
        (image) => `data:image/jpeg;base64,${image.image.imageBytes}`
      );
    } else {
      return [];
    }
  } catch (error) {
    console.error("Error generating images with Gemini API:", error);
    throw new Error("Failed to generate images. Please check the API key and prompt.");
  }
};


export const editImageFromPrompt = async (base64ImageData: string, prompt: string): Promise<string> => {
    const match = base64ImageData.match(/^data:(.*);base64,(.*)$/);
    if (!match) {
        throw new Error("Invalid base64 image data string.");
    }
    const mimeType = match[1];
    const data = match[2];

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: data,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: prompt,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
              const base64ImageBytes: string = part.inlineData.data;
              // The model might return a different mime type, so we construct the data URL with the new type.
              const newMimeType = part.inlineData.mimeType;
              return `data:${newMimeType};base64,${base64ImageBytes}`;
            }
        }
        throw new Error("No image found in the edit response.");

    } catch (error) {
        console.error("Error editing image with Gemini API:", error);
        throw new Error("Failed to edit image. Please try again.");
    }
};
