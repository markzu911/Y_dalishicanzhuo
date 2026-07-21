import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

/**
 * Helper to get raw base64 data from either a data URI, a plain base64 string, or a remote URL.
 */
async function getImageData(input: string): Promise<string> {
  if (!input) return "";

  // If it's a data URI (starts with data:image/...), extract the base64 part
  if (input.startsWith("data:")) {
    const parts = input.split(",");
    return parts[1] || parts[0];
  }

  // If it's a remote URL, fetch it and convert to base64
  if (input.startsWith("http")) {
    try {
      console.log(`[getImageData] Fetching remote image URL with browser headers: ${input}`);
      const response = await fetch(input, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'Referer': 'https://unsplash.com/'
        }
      });
      if (!response.ok) {
        throw new Error(`HTTP Error Status: ${response.status} ${response.statusText}`);
      }
      const arrayBuffer = await response.arrayBuffer();
      const base64Str = Buffer.from(arrayBuffer).toString("base64");
      console.log(`[getImageData] Successfully fetched and converted remote image to base64. Length: ${base64Str.length}`);
      return base64Str;
    } catch (error: any) {
      console.error("[getImageData] Error fetching remote image:", error);
      throw new Error(`无法获取远程图片数据: ${input}. 详细原因: ${error.message || error}`);
    }
  }

  // Otherwise, assume it's already a raw base64 string
  return input;
}

function buildPrompt(
  roomAnalysis: any,
  tableAnalysis: any,
  viewParam: string,
  hasRoomImage: boolean,
  addModel?: boolean,
  modelGender?: string,
  modelAgeGroup?: string,
  customInstructions?: string
) {
  let mainTask = "";
  let viewDesc = "";
  let referenceExplanation = "";
  let perspectiveStyleRules = "";

  if (hasRoomImage) {
    if (viewParam === "远景") {
      mainTask = "Task: Recreate the complete room from Reference Image 1 in a beautiful 45-degree elevated wide-angle interior architectural photograph of a dedicated dining room, and realistically integrate the marble table set from Reference Image 2 as a harmonious component of the room. The camera looks down at a 45-degree angle so that the top surface of the dining table is clearly visible. Crucially, the wide shot must show the entire, complete room along with the table; if Reference Image 1 shows only a single corner or partial view of the room, you MUST virtually expand, supplement, and complete the rest of the room in the exact same interior design style, materials, colors, and decoration details.";
      viewDesc = "45-DEGREE HIGH-ANGLE ARCHITECTURAL WIDE SHOT (俯视全局远景). The camera is positioned far away from the dining set but elevated higher, looking down at a 45-degree three-quarter angle. This wide-angle panoramic view captures the dining room's full volume, ceiling, and floor, while showcasing the polished top surface of the dining table. The dining table and chairs occupy about 15-20% of the frame, aligned beautifully matching the room geometry. The entire room must be beautifully structured; if the reference room is only a partial corner, virtually expand and complete the rest of the room's walls, windows, or cabinetry in the same matching style.";
      referenceExplanation = `  - REFERENCE IMAGE 1 (Room Image): Replicate this dining room style and details with 100% fidelity from an elevated 45-degree perspective. If this image shows only a partial view or a single corner of the room, you MUST virtually expand and complete the rest of the dining room space seamlessly to show a whole, complete dining room in the exact same style, material, and color palette. Do NOT include any sofas, armchairs, or coffee tables.
  - REFERENCE IMAGE 2 (Table & Chairs Image): Replicate the exact marble table and chairs with 100% fidelity, adapting them to the 45-degree high-angle perspective so that the glossy marble tabletop is clearly visible from above.`;
      perspectiveStyleRules = "Replicate the entire room from Reference Image 1 from a 45-degree elevated perspective, looking down to showcase both the complete room volume and the polished top surface of the table. If Reference Image 1 only shows a partial corner or a single wall, you MUST virtually expand, generate, and complete the rest of the room's architecture (floor, walls, cabinetry, ceiling) in the exact same interior design style. The table and chairs set must occupy roughly 15-20% of the frame and be placed straight relative to the walls.";
    } else if (viewParam === "近景") {
      mainTask = "Task: Create a beautiful high-angle close-up diagonal photograph of the dining table set from Reference Image 2 integrated into the dining room from Reference Image 1. The dining table body must dominate the bottom-left and center of the frame, with its long edge running diagonally from the top-left/top-center to the bottom-right, showcasing its magnificent marble texture and high-gloss polished finish from an overhead looking-down perspective.";
      viewDesc = "HIGH-ANGLE DIAGONAL CLOSE-UP SHOT (俯视对角线近景特写). The camera is positioned high, looking down at the dining table at a diagonal angle. The dining table dominates the bottom-left, bottom, and center of the frame, and its long edge runs diagonally from top-left/top-center to bottom-right. The high-gloss polished marble tabletop shows exquisite mirror-like reflections of the room lighting and surrounding decor. The background room behind the table remains beautifully visible from this high-angle perspective, keeping its original room details and cabinetry from Reference Image 1.";
      referenceExplanation = `  - REFERENCE IMAGE 1 (Room Image): Replicate the style, materials, and luxury ambiance of this room as a background, viewed from a matching high-angle overhead perspective behind the close-up table.
  - REFERENCE IMAGE 2 (Table & Chairs Image): Replicate the exact marble tabletop pattern, colors, and premium chairs with 100% fidelity, adapting them to this specific high-angle diagonal looking-down perspective.`;
      perspectiveStyleRules = "Adopt a high-angle, top-down diagonal close-up perspective. The dining table must occupy the bottom-left and center of the frame, with its edge running diagonally from top-left/top-center to bottom-right. Beside and to the right of the table, show two elegant leather dining chairs (styled in a sophisticated warm taupe/camel brown leather with curved backs) tucked neatly under the table, viewed from above. On the table, beautifully stage: (1) a tall glass vase containing delicate dried golden-white branches and leaves on the left, and (2) a dark rectangular serving tray with golden side handles holding two bottles of red wine and two elegant wine glasses in the middle. The polished marble surface must feature highly realistic glossy reflections of the room lighting and surrounding decor.";
    } else {
      // 中近景 (Medium Shot)
      mainTask = "Task: Recreate the dining scene from Reference Image 1 at a 45-degree elevated medium distance, centering the replicated table and chairs from Reference Image 2 as the absolute main subject, showing the table from a high-angle perspective so that the tabletop surface is beautifully visible.";
      viewDesc = "45-DEGREE HIGH-ANGLE MEDIUM SHOWCASE. The camera is positioned at a medium distance, elevated and looking down at a 45-degree three-quarter perspective at the dining table set. The table set occupies roughly 45-55% of the frame. The polished marble tabletop is clearly visible from this high-angle perspective, capturing the rich vein patterns and high-gloss reflections. A moderate portion of the surrounding room context (the adjacent walls, floor, and nearby cabinets/windows) is clearly visible in the background from this elevated angle.";
      referenceExplanation = `  - REFERENCE IMAGE 1 (Room Image): Replicate this room's dining area, floor, adjacent walls, and nearby cabinetry/sideboards with high fidelity, viewed from an elevated 45-degree perspective. Do NOT include any sofas, armchairs, or coffee tables.
  - REFERENCE IMAGE 2 (Table & Chairs Image): Replicate the exact marble table and chairs with 100% fidelity, adapting them to the 45-degree high-angle medium shot, showcasing the tabletop surface from above.`;
      perspectiveStyleRules = "Adopt a 45-degree elevated, looking-down medium perspective. The table and chairs are the clear focal point (45-55% of the frame), aligned neatly. The camera is high enough to see the glossy top surface of the marble table clearly, showcasing its exquisite patterns and reflections of the room's lights.";
    }
  } else {
    // Pure prompt generation without Room Reference Image
    if (viewParam === "远景") {
      mainTask = "Task: Generate a beautiful 45-degree elevated wide-angle interior architectural photograph of a dedicated dining room according to the prompt parameters, and realistically integrate/place the replicated marble table set from the REFERENCE IMAGE as a harmonious component of the room. The camera looks down at a 45-degree angle so that the top surface of the dining table is clearly visible. Ensure the image captures a spacious, complete, and fully structured dining room rather than a single cramped corner.";
      viewDesc = "45-DEGREE HIGH-ANGLE ARCHITECTURAL WIDE SHOT (俯视全局远景). The camera is positioned far away from the dining set but elevated higher, looking down at a 45-degree three-quarter angle. This wide-angle panoramic view captures the dining room's full volume, ceiling, and floor, while showcasing the polished top surface of the dining table. The dining table and chairs occupy about 15-20% of the frame. The entire room must be spacious, comprehensive, and complete.";
      referenceExplanation = `  - REFERENCE IMAGE (Table & Chairs Image): Replicate the exact marble table and chairs with 100% fidelity, adapting them to the 45-degree high-angle perspective so that the glossy marble tabletop is visible from above.`;
      perspectiveStyleRules = "Generate the dining room from a 45-degree elevated perspective, looking down to showcase both the complete, spacious room volume and the polished top surface of the table. The table and chairs should occupy 15-20% of the frame, aligned beautifully inside a fully complete room structure.";
    } else if (viewParam === "近景") {
      mainTask = "Task: Create a beautiful high-angle close-up diagonal photograph of the dining table set from the REFERENCE IMAGE integrated into a newly generated dedicated dining room matching the prompt parameters. The dining table body must dominate the bottom-left and center of the frame, with its long edge running diagonally from the top-left/top-center to the bottom-right, showcasing its magnificent marble texture and high-gloss polished finish from an overhead looking-down perspective.";
      viewDesc = "HIGH-ANGLE DIAGONAL CLOSE-UP SHOT (俯视对角线近景特写). The camera is positioned high, looking down at the dining table at a diagonal angle. The dining table dominates the bottom-left, bottom, and center of the frame, and its long edge runs diagonally from top-left/top-center to bottom-right. The high-gloss polished marble tabletop shows exquisite mirror-like reflections of the room lighting and surrounding decor. The background room behind the table remains beautifully visible from this high-angle perspective.";
      referenceExplanation = `  - REFERENCE IMAGE (Table & Chairs Image): Replicate the exact marble tabletop pattern, colors, and premium chairs with 100% fidelity, adapting them to this specific high-angle diagonal looking-down perspective.`;
      perspectiveStyleRules = "Adopt a high-angle, top-down diagonal close-up perspective. The dining table must occupy the bottom-left and center of the frame, with its edge running diagonally from top-left/top-center to bottom-right. Beside and to the right of the table, show two elegant leather dining chairs (styled in a sophisticated warm taupe/camel brown leather with curved backs) tucked neatly under the table, viewed from above. On the table, beautifully stage: (1) a tall glass vase containing delicate dried golden-white branches and leaves on the left, and (2) a dark rectangular serving tray with golden side handles holding two bottles of red wine and two elegant wine glasses in the middle. The polished marble surface must feature highly realistic glossy reflections of the room lighting and surrounding decor.";
    } else {
      // 中近景 (Medium Shot)
      mainTask = "Task: Create a beautiful 45-degree elevated medium distance dining scene photograph, centering the replicated table and chairs from the REFERENCE IMAGE as the absolute main subject, showing the table from a high-angle perspective so that the tabletop surface is beautifully visible.";
      viewDesc = "45-DEGREE HIGH-ANGLE MEDIUM SHOWCASE. The camera is positioned at a medium distance, elevated and looking down at a 45-degree three-quarter perspective at the dining table set. The table set occupies roughly 45-55% of the frame. The polished marble tabletop is clearly visible from this high-angle perspective, capturing the rich vein patterns and high-gloss reflections. A moderate portion of the surrounding room context (the adjacent walls, floor, and nearby cabinets/windows) is clearly visible in the background from this elevated angle.";
      referenceExplanation = `  - REFERENCE IMAGE (Table & Chairs Image): Replicate the exact marble table and chairs with 100% fidelity, adapting them to the 45-degree high-angle medium shot, showcasing the tabletop surface from above.`;
      perspectiveStyleRules = "Adopt a 45-degree elevated, looking-down medium perspective. The table and chairs are the central focus (45-55% of the frame), aligned neatly. The camera is high enough to see the glossy top surface of the marble table clearly, showcasing its exquisite patterns and reflections.";
    }
  }

  let modelInstruction = "";
  if (addModel) {
    modelInstruction = `
  7. Human Model Integration (人物模特融入) (CRITICAL):
     - You MUST include exactly one realistic, elegantly styled human figure (模特) in the dining room scene, interacting naturally with the dining space. For example, sitting gracefully on one of the dining chairs, pouring wine, or walking elegantly beside the table.
     - Model Demographic Specification:
       - Gender (性别): ${modelGender === '女' ? "Female (女性)" : "Male (男性)"}
       - Age Group (年龄段): ${modelAgeGroup} (A elegant, stylish ${modelAgeGroup === '青年' ? 'young adult around 25-30' : modelAgeGroup === '中年' ? 'middle-aged adult around 40-50' : 'elderly person around 60-70'} years old).
     - Styling and Dress: The human figure must wear high-end, minimalist luxury casual wear (e.g., beige, cream, or soft grey linen or fine knitwear) matching the elegant atmosphere. They must look relaxed, natural, and candid (not staring directly at the camera, but looking at the table or side windows).
     - The human figure must be fully integrated into the 3D space with physically accurate contact shadows on the chair or floor, and realistic lighting/reflections that perfectly match the environment. The person's presence must feel candid and natural, enhancing the luxury magazine feel rather than looking like an artificial overlay. The figure should not block the view of the beautiful marble tabletop structure.`;
  }

  const customInstructionText = customInstructions ? `
  8. ADDITIONAL CUSTOM USER DIRECTIVES (附加个性化定制要求) (CRITICAL):
     - The user has requested the following custom details, styles, backgrounds, objects, or lighting. You MUST incorporate these instructions fully, coherently, and realistically into the image generation, overriding any conflicting standard configurations:
     - CUSTOM REQUESTS: ${customInstructions}
     - Ensure any requested objects, furniture types, materials, or lighting atmospheres are perfectly blended into the dining room scene.` : "";

  return `${mainTask}

  --- REFERENCE IMAGES EXPLANATION ---
${referenceExplanation}

  --- CRITICAL RECONSTRUCTION & INTEGRATION REQUIREMENTS ---
  1. Room Restoration & Perspective Rules: ${perspectiveStyleRules}
  2. Table Placement & Orientation: Place the replicated dining table and chairs from the ${hasRoomImage ? "Reference Image 2" : "REFERENCE IMAGE"} into the designated dining area of the ${hasRoomImage ? "reconstructed" : "newly generated"} room. ${viewParam === "近景" ? "For this specific close-up view, the dining table must be placed diagonally, with its body dominating the bottom-left and center of the frame, and its long edge running diagonally from the top-left/top-center to the bottom-right, with chairs tucked neatly under the table on the right, viewed from above." : "The dining table must be placed neatly and straight in relation to the room walls, but viewed from a 45-degree three-quarter high-angle camera perspective, looking down so that the beautiful marble tabletop surface is clearly visible from above, showcasing its polished patterns and reflections. All chairs must be tucked in neatly and straight."} It must look seamlessly placed on the floor with physically accurate shadows (PBR), ambient occlusion, and lighting reflections matching the light sources of the room.
  3. No Crude Painting: The integration must be done via high-quality, coherent 3D-like synthesis, rather than a crude cut-and-paste or destructive patch-up. The final output must be a clean, cohesive, ultra-realistic photograph.
  4. Table & Chairs Details:
     - Table Shape: ${tableAnalysis.shape}
     - Table Materiality: ${tableAnalysis.marbleDetails}
     - Table Structural Design: ${tableAnalysis.legsAndBase}
     - Set Vibe: ${tableAnalysis.vibe}
  5. Room Details (for accurate ${hasRoomImage ? "restoration" : "generation"}):
     - Style: ${roomAnalysis.style}
     - Environment Details & Cabinetry: ${roomAnalysis.furniture}
     - Lighting & Atmosphere: ${roomAnalysis.spaceAndLight}
     - Suggested Placement: ${roomAnalysis.suggestedLocation}
  6. Dedicated Dining Room (Strictly NO Sofas/Living Room Elements):
     - This scene MUST be a pure, dedicated dining room (餐厅) designed solely for displaying the dining table set.
     - You MUST NOT include any living room furniture, such as sofas (沙发), armchairs (单人沙发/扶手椅/休闲椅), lounge chairs, low coffee tables (茶几), TV stands, or entertainment systems.
     - Absolutely NO gallery wall layouts or home decorations that resemble a cozy living room seating nook.
     - The background must consist strictly of dining room elements like high-end kitchen/dining cabinetry, sideboards, dining windows, curtains, or dining room walls. Do not create a combined living-dining room; keep the focus entirely on a dedicated dining room space.${modelInstruction}
${customInstructionText}

  --- EXECUTION DETAILS ---
  - View Perspective: ${viewDesc}
  - Quality: High-end architectural digest photograph, 8k resolution, photorealistic ray-traced reflections, warm and cozy lighting.
  - Text Rule: ABSOLUTELY NO TEXT, CHINESE CHARACTERS, ALPHABET CHARACTERS, LABELS, WATERMARKS, ADVERTISEMENT LOGOS, SELLING WORDS, OR GRAPHIC OVERLAYS ANYWHERE IN THE IMAGE. The image must be a pure, pristine, raw interior design photograph.
  - Final Output: A pure, clean, realistic image without any watermarks, texts, logos, or synthetic overlays.`;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  const ai = new GoogleGenAI({
    apiKey: process.env.API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoints
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Proxy for tool and upload endpoints to aibigtree.com
  app.all(["/api/tool/*", "/api/upload/*"], async (req, res) => {
    const targetUrl = `http://aibigtree.com${req.originalUrl}`;
    console.log(`[local-server proxy] Forwarding ${req.method} request to: ${targetUrl}`);

    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (typeof value === 'string') {
        headers[key] = value;
      }
    }
    // Set Host header correctly to avoid target routing issues
    headers['host'] = 'aibigtree.com';

    try {
      let bodyData: any = undefined;
      if (req.method === 'POST' || req.method === 'PUT') {
        // If it was already parsed as JSON by express.json(), stringify it.
        // Otherwise, if it is a binary stream, we can read the raw request or req.body
        if (req.body && typeof req.body === 'object' && Object.keys(req.body).length > 0) {
          bodyData = JSON.stringify(req.body);
        } else {
          // If body was not parsed (like a raw binary upload), read raw body
          const getRawBody = () => new Promise<Buffer>((resolve, reject) => {
            const chunks: Buffer[] = [];
            req.on('data', (chunk: Buffer) => chunks.push(chunk));
            req.on('end', () => resolve(Buffer.concat(chunks)));
            req.on('error', (err) => reject(err));
          });
          bodyData = await getRawBody();
        }
      }

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: headers,
        body: bodyData,
      });

      res.status(response.status);
      const contentType = response.headers.get('content-type') || '';
      for (const [key, value] of response.headers.entries()) {
        res.setHeader(key, value);
      }

      if (contentType.includes('application/json')) {
        const json = await response.json();
        res.json(json);
      } else {
        const arrayBuffer = await response.arrayBuffer();
        res.send(Buffer.from(arrayBuffer));
      }
    } catch (error: any) {
      console.error(`[local-server proxy] Error forwarding request to ${targetUrl}:`, error);
      res.status(502).json({ error: `Bad Gateway: ${error.message}` });
    }
  });

  app.post("/api/analyze-room", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY is not configured in environment secrets." });
      }

      const cleanBase64 = await getImageData(image);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            }
          },
          {
            text: "请详细分析这张房间/客餐厅图片，识别以下关键信息：\n" +
                  "1. 装修风格（例如：现代简约、北欧、美式、中式、极简等）；\n" +
                  "2. 房间内的已有家具及其布局情况；\n" +
                  "3. 空间大小、采光条件与环境整体色调；\n" +
                  "4. 适合摆放餐桌的位置与推荐的餐桌尺寸/形状。\n" +
                  "请使用指定的JSON格式返回分析结果，内容要专业、详细、具有参考价值。"
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              style: { type: Type.STRING, description: "装修风格，如'现代简约'、'法式复古'等" },
              furniture: { type: Type.STRING, description: "已有主要家具及其布局" },
              spaceAndLight: { type: Type.STRING, description: "空间大小、光线强弱与色调描述" },
              suggestedLocation: { type: Type.STRING, description: "建议摆放餐桌的具体位置与理由" },
            },
            required: ["style", "furniture", "spaceAndLight", "suggestedLocation"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from AI analysis");
      }

      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error analyzing room:", error);
      res.status(500).json({ error: error.message || "Failed to analyze room image" });
    }
  });

  app.post("/api/analyze-table", async (req, res) => {
    try {
      const { image, mimeType } = req.body;
      if (!image) {
        return res.status(400).json({ error: "Missing image data" });
      }

      if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY is not configured in environment secrets." });
      }

      const cleanBase64 = await getImageData(image);

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: [
          {
            inlineData: {
              mimeType: mimeType || "image/jpeg",
              data: cleanBase64,
            }
          },
          {
            text: "请详细分析这张大理石餐桌图片，识别以下关键信息：\n" +
                  "1. 餐桌的形状特点（例如：圆形、长方形、正方形、椭圆形等）；\n" +
                  "2. 大理石的纹理、颜色与质感特征（如白色爵士白、黑色劳伦黑金、灰色鱼肚白等）；\n" +
                  "3. 桌腿/底座的材质、颜色与结构设计风格（如金属、实木、极简黑铁、大理石柱底座等）；\n" +
                  "4. 这张餐桌整体呈现的设计风格与调性（如现代简约、奢华奢石、北欧原木等）。\n" +
                  "请使用指定的JSON格式返回分析结果。"
          }
        ],
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              shape: { type: Type.STRING, description: "餐桌形状，如'长方形'、'正圆形'等" },
              marbleDetails: { type: Type.STRING, description: "大理石纹理与颜色详细特点" },
              legsAndBase: { type: Type.STRING, description: "桌腿/底座材质与颜色" },
              vibe: { type: Type.STRING, description: "餐桌整体的设计风格与气质" },
            },
            required: ["shape", "marbleDetails", "legsAndBase", "vibe"]
          }
        }
      });

      const resultText = response.text;
      if (!resultText) {
        throw new Error("Empty response from AI analysis");
      }

      const parsedData = JSON.parse(resultText);
      res.json(parsedData);
    } catch (error: any) {
      console.error("Error analyzing table:", error);
      res.status(500).json({ error: error.message || "Failed to analyze table image" });
    }
  });

  app.post("/api/gemini", async (req, res) => {
    try {
      const { model, payload } = req.body;

      if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY is not configured in environment secrets." });
      }

      if (!model) {
        return res.status(400).json({ error: "Missing model parameter" });
      }

      // Merge model and payload into generateContent parameters
      const params = {
        model: model,
        ...payload,
      };

      console.log(`Proxying request to Gemini with model: ${model}`);
      const response = await ai.models.generateContent(params);
      
      // Return response text or the entire response
      res.json({
        text: response.text,
        candidates: response.candidates,
      });
    } catch (error: any) {
      console.error("Error in /api/gemini proxy:", error);
      res.status(500).json({ error: error.message || "Failed to process Gemini request" });
    }
  });

  app.post("/api/generate-mockup", async (req, res) => {
    try {
      const { roomAnalysis, tableAnalysis, roomImage, roomMimeType, tableImage, tableMimeType, viewParam, resolution, aspectRatio, addModel, modelGender, modelAgeGroup, isVirtual: clientIsVirtual, customInstructions } = req.body;

      if (!process.env.API_KEY) {
        return res.status(500).json({ error: "API_KEY is not configured in environment secrets." });
      }

      const isVirtual = !!clientIsVirtual || (roomImage && (roomImage.startsWith("http") || roomImage === "virtual_custom_style"));
      const hasRoomImage = !isVirtual && !!roomImage;

      const prompt = buildPrompt(roomAnalysis, tableAnalysis, viewParam, hasRoomImage, addModel, modelGender, modelAgeGroup, customInstructions);

      let imageSize = "1K";
      if (resolution === "2k") imageSize = "2K";
      if (resolution === "4k") imageSize = "4K";

      const validAspectRatios = ["1:1", "3:4", "4:3", "9:16", "16:9"];
      const ar = validAspectRatios.includes(aspectRatio) ? aspectRatio : "1:1";

      console.log(`Generating image. isVirtual: ${isVirtual}, hasRoomImage: ${hasRoomImage}, viewParam: ${viewParam}`);
      console.log("Generating image with prompt:", prompt);
      
      const cleanRoomBase64 = hasRoomImage ? await getImageData(roomImage) : "";
      const cleanTableBase64 = await getImageData(tableImage);

      const contentsParts: any[] = [
        {
          text: prompt,
        },
      ];

      // Reference Image 1: Original Room (Only if not virtual room)
      if (hasRoomImage && cleanRoomBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: roomMimeType || "image/jpeg",
            data: cleanRoomBase64,
          }
        });
      }

      // Reference Image 2: Table Product
      if (cleanTableBase64) {
        contentsParts.push({
          inlineData: {
            mimeType: tableMimeType || "image/jpeg",
            data: cleanTableBase64,
          }
        });
      }

      // Always use gemini-3.1-flash-image model for high-fidelity outputs across all resolutions
      const selectedModel = 'gemini-3.1-flash-image';

      const response = await ai.models.generateContent({
        model: selectedModel,
        contents: {
          parts: contentsParts,
        },
        config: {
          imageConfig: {
            aspectRatio: ar,
            imageSize: imageSize,
          },
        },
      });

      let base64Image = "";
      if (response.candidates && response.candidates[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            base64Image = `data:image/png;base64,${part.inlineData.data}`;
            break;
          }
        }
      }

      if (!base64Image) {
        throw new Error("No image data returned from Gemini Image model");
      }

      res.json({ image: base64Image });
    } catch (error: any) {
      console.error("Error generating mockup:", error);
      let errorMessage = error.message || "Failed to generate mockup image";
      
      // Enhance error message for quota/resource exhausted issues
      if (errorMessage.includes("RESOURCE_EXHAUSTED") || errorMessage.includes("quota")) {
        errorMessage = "API 调用配额已耗尽。请稍后再试，或者联系管理员配置更高配额的 API Key。";
      }
      
      res.status(500).json({ error: errorMessage });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
