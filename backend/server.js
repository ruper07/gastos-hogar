import express from "express";
import cors from "cors";
import Anthropic from "@anthropic-ai/sdk";

const app = express();
app.use(cors());
app.use(express.json({ limit: "20mb" }));

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

app.get("/", (req, res) => res.json({ status: "ok" }));

app.post("/api/analyze", async (req, res) => {
  const { base64, mediaType } = req.body;
  if (!base64 || !mediaType) return res.status(400).json({ error: "Faltan datos" });

  try {
    const isImg = mediaType.startsWith("image/");
    const msg = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{
        role: "user",
        content: [
          isImg
            ? { type: "image", source: { type: "base64", media_type: mediaType, data: base64 } }
            : { type: "document", source: { type: "base64", media_type: mediaType, data: base64 } },
          { type: "text", text: `Analiza este documento. Responde SOLO en JSON sin markdown:
{"tipo":"","monto":null,"fecha":null,"vencimiento":null,"descripcion":"","categoria_sugerida":"","foco_sugerido":""}` }
        ]
      }]
    });
    const txt = msg.content?.find(c => c.type === "text")?.text || "";
    const parsed = JSON.parse(txt.replace(/```json|```/g, "").trim());
    res.json(parsed);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend corriendo en puerto ${PORT}`));
