const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const MANAGER_USER_ID = process.env.MANAGER_USER_ID || "";

const client = new line.Client(config);
const app = express();

app.get("/", (req, res) => {
  res.send("Xiamu Property LINE Bot is running.");
});

app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error(err);
    res.status(500).end();
  }
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const userText = event.message.text.trim();
  const userId = event.source.userId || "unknown";
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });

  if (userText === "我的ID") {
    return reply(event.replyToken, `你的 LINE User ID：\n${userId}`);
  }

  const menu = `請選擇回報項目，或直接輸入內容：

1. 報修
2. 休息離哨
3. 上哨
4. 異常事件
5. 交接回報

格式範例：
異常事件 B1車道住戶臨停爭議
報修 A3-18 水龍頭漏水
休息離哨 王員 用餐 30分鐘 代理人李員
上哨 王員 早班
交接回報 今日B1車道臨停需追蹤`;

  if (["報修", "休息離哨", "上哨", "異常事件", "交接回報", "功能"].includes(userText)) {
    return reply(event.replyToken, menu);
  }

  const category = detectCategory(userText);

  if (!category) {
    return reply(event.replyToken, `已收到訊息。\n\n若要同步經理，請用以下開頭：\n報修、休息離哨、上哨、異常事件、交接回報`);
  }

  const staffName = await getDisplayName(userId);

  const managerMessage =
`【${category}】
人員：${staffName}
時間：${now}
內容：${userText}

來源：LINE物業回報系統`;

  if (MANAGER_USER_ID) {
    await client.pushMessage(MANAGER_USER_ID, {
      type: "text",
      text: managerMessage
    });
  }

  return reply(event.replyToken, `已回報經理。\n\n${managerMessage}`);
}

function detectCategory(text) {
  if (text.startsWith("報修")) return "報修回報";
  if (text.startsWith("休息離哨")) return "休息離哨";
  if (text.startsWith("上哨")) return "上哨回報";
  if (text.startsWith("異常事件")) return "異常事件";
  if (text.startsWith("交接回報")) return "交接回報";
  return null;
}

async function getDisplayName(userId) {
  try {
    const profile = await client.getProfile(userId);
    return profile.displayName || userId;
  } catch (e) {
    return userId;
  }
}

function reply(replyToken, text) {
  return client.replyMessage(replyToken, { type: "text", text });
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Xiamu LINE Bot running on port ${port}`);
});
