import express from "express";
import { handleDeploy } from "./handlers/deploy";
import { fetchRelease, fetchVersionIdByName } from "./api/jira";
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/test", (req: any, res: any) => {
  console.log("Hello World");
  res.send("Hello World");
});

app.get("/test2", async (req: any, res: any) => {
  const versions = await fetchRelease("2025-06-04");
  const releaseInfo = await fetchVersionIdByName("2025-06-04");
  res.send({ versions, releaseInfo });
});

app.post("/deploy-start", async (req: any, res: any) => {
  const { text, channel_id } = req.body;

  if (!text || !channel_id) {
    return res.status(400).send("Missing required fields");
  }

  try {
    await handleDeploy(text.trim(), channel_id);
    // res.status(200).send("배포 메시지를 보냈습니다.");
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("서버 에러 발생");
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
