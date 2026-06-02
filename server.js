const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

const memory = {
  repairs: [],
  leave: [],
  duty: [],
  incidents: [],
  handovers: [],
  parkingQueries: []
};

app.get("/", (req, res) => {
  res.send("Xiamu Property LINE Bot V2 is running.");
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

  const text = event.message.text.trim();
  const userId = event.source.userId || "";
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  const name = await getDisplayName(userId);

  if (text === "我的ID") {
    return reply(event.replyToken, `你的 LINE User ID：\n${userId}`);
  }

  if (["功能", "選單", "報修", "休息離哨", "上哨", "異常事件", "交接回報", "車位查詢"].includes(text)) {
    return reply(event.replyToken, menu());
  }

  const result = handleBusinessText(text, name, now);

  if (!result) {
    return reply(event.replyToken, `請依格式輸入：\n\n${menu()}`);
  }

  return reply(event.replyToken, result);
}

function handleBusinessText(text, name, now) {
  if (text.startsWith("報修")) {
    const content = text.replace(/^報修/, "").trim();
    const id = `R-${dateId()}-${String(memory.repairs.length + 1).padStart(3, "0")}`;
    memory.repairs.push({ id, time: now, name, content });
    return `✅ 報修已登錄\n案件編號：${id}\n回報人：${name}\n時間：${now}\n內容：${content || "未填寫"}`;
  }

  if (text.startsWith("休息離哨")) {
    const content = text.replace(/^休息離哨/, "").trim();
    memory.leave.push({ time: now, name, content });
    return `✅ 休息離哨已登錄\n人員：${name}\n時間：${now}\n說明：${content || "未填寫"}`;
  }

  if (text.startsWith("上哨")) {
    const content = text.replace(/^上哨/, "").trim();
    memory.duty.push({ time: now, name, content });
    return `✅ 上哨已登錄\n人員：${name}\n時間：${now}\n說明：${content || "未填寫"}`;
  }

  if (text.startsWith("異常事件")) {
    const content = text.replace(/^異常事件/, "").trim();
    const id = `E-${dateId()}-${String(memory.incidents.length + 1).padStart(3, "0")}`;
    memory.incidents.push({ id, time: now, name, content });
    return `🚨 異常事件已登錄\n事件編號：${id}\n回報人：${name}\n時間：${now}\n內容：${content || "未填寫"}`;
  }

  if (text.startsWith("交接回報")) {
    const content = text.replace(/^交接回報/, "").trim();
    memory.handovers.push({ time: now, name, content });
    return `📋 交接回報已登錄\n回報人：${name}\n時間：${now}\n內容：${content || "未填寫"}`;
  }

  if (text.startsWith("車位查詢")) {
    const keyword = text.replace(/^車位查詢/, "").trim();
    memory.parkingQueries.push({ time: now, name, keyword });
    return parkingSearch(keyword);
  }

  if (text === "今日紀錄" || text === "六表" || text === "6表") {
    return summary();
  }

  return null;
}

function parkingSearch(keyword) {
  if (!keyword) {
    return `🚗 車位查詢\n請輸入：車位查詢 B2-124\n或：車位查詢 A3-22`;
  }

  const data = [
    { unit: "A1-22", door: "261", owner: "羅月青", car: "B3-050", moto: "245-246" },
    { unit: "A2-22", door: "263", owner: "蔡玉惠美", car: "B2-124", moto: "215-216" },
    { unit: "A3-22", door: "267", owner: "翁紹銘", car: "B3-041", moto: "155-156" },
    { unit: "A5-22", door: "265", owner: "陳泳沛", car: "B3-042", moto: "143-144" }
  ];

  const found = data.filter(x =>
    x.unit.includes(keyword) ||
    x.door.includes(keyword) ||
    x.owner.includes(keyword) ||
    x.car.includes(keyword) ||
    x.moto.includes(keyword)
  );

  if (!found.length) return `查無資料：${keyword}\n請確認戶別、門牌、汽車位或機車位。`;

  return found.map(x =>
    `🚗 車位查詢結果\n戶別：${x.unit}\n門牌：${x.door}\n所有權人：${x.owner}\n汽車位：${x.car}\n機車位：${x.moto}`
  ).join("\n\n");
}

function summary() {
  return `📊 今日6表紀錄\n\n` +
    `1. 報修：${memory.repairs.length}筆\n` +
    `2. 休息離哨：${memory.leave.length}筆\n` +
    `3. 上哨：${memory.duty.length}筆\n` +
    `4. 異常事件：${memory.incidents.length}筆\n` +
    `5. 交接回報：${memory.handovers.length}筆\n` +
    `6. 車位查詢：${memory.parkingQueries.length}筆\n\n` +
    `輸入「報修 A3-18 水龍頭漏水」即可登錄。`;
}

function menu() {
  return `請輸入以下格式：\n\n` +
    `1. 報修 A3-18 水龍頭漏水\n` +
    `2. 休息離哨 王員 用餐30分鐘 代理人李員\n` +
    `3. 上哨 王員 早班\n` +
    `4. 異常事件 B1車道住戶臨停爭議\n` +
    `5. 交接回報 今日B1車道臨停需追蹤\n` +
    `6. 車位查詢 B2-124\n\n` +
    `查今日統計請輸入：6表`;
}

async function getDisplayName(userId) {
  try {
    const profile = await client.getProfile(userId);
    return profile.displayName || userId;
  } catch (e) {
    return userId || "未知人員";
  }
}

function reply(replyToken, text) {
  return client.replyMessage(replyToken, { type: "text", text });
}

function dateId() {
  const d = new Date();
  const yy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yy}${mm}${dd}`;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Xiamu LINE Bot V2 running on port ${port}`);
});
