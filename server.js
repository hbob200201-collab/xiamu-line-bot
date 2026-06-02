const express = require("express");
const line = require("@line/bot-sdk");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();

const records = {
  repairs: [],
  leave: [],
  duty: [],
  incidents: [],
  handovers: [],
  parkingQueries: []
};

app.get("/", (req, res) => {
  res.send("Xiamu Property LINE Bot V4 is running.");
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

  // 圖文選單按下後的動作
  if (text === "報修") return reply(event.replyToken, templateRepair());
  if (text === "休息離哨") return reply(event.replyToken, directLeave(name, now));
  if (text === "上哨") return reply(event.replyToken, directDuty(name, now));
  if (text === "車位查詢") return reply(event.replyToken, templateParking());
  if (text === "異常事件") return reply(event.replyToken, templateIncident());
  if (text === "交接回報") return reply(event.replyToken, templateHandover());

  if (["功能", "選單", "menu"].includes(text.toLowerCase())) {
    return reply(event.replyToken, mainMenu());
  }

  if (text === "6表" || text === "六表" || text === "今日紀錄") {
    return reply(event.replyToken, summary());
  }

  const result = handleRecord(text, name, now);
  if (result) return reply(event.replyToken, result);

  return reply(event.replyToken, `格式未判斷成功。\n\n請點選下方圖文選單，或輸入「功能」查看格式。`);
}

function directLeave(name, now) {
  records.leave.push({
    time: now,
    name,
    content: "圖文選單直接登記休息離哨"
  });

  return `☕ 休息離哨已登記

人員：${name}
時間：${now}
狀態：離哨中

返回時請按「上哨」登記返回。`;
}

function directDuty(name, now) {
  records.duty.push({
    time: now,
    name,
    content: "圖文選單直接登記上哨"
  });

  return `👮 上哨已登記

人員：${name}
時間：${now}
狀態：已返回崗位`;
}

function handleRecord(text, name, now) {
  if (text.startsWith("報修內容")) {
    const id = `R-${dateId()}-${String(records.repairs.length + 1).padStart(3, "0")}`;
    records.repairs.push({ id, time: now, name, content: text });
    return `✅ 報修已建立\n案件編號：${id}\n回報人：${name}\n時間：${now}\n\n${text}`;
  }

  if (text.startsWith("休息離哨內容")) {
    records.leave.push({ time: now, name, content: text });
    return `✅ 休息離哨已登錄\n人員：${name}\n時間：${now}\n\n${text}`;
  }

  if (text.startsWith("上哨內容")) {
    records.duty.push({ time: now, name, content: text });
    return `✅ 上哨已登錄\n人員：${name}\n時間：${now}\n\n${text}`;
  }

  if (text.startsWith("異常事件內容")) {
    const id = `E-${dateId()}-${String(records.incidents.length + 1).padStart(3, "0")}`;
    records.incidents.push({ id, time: now, name, content: text });
    return `🚨 異常事件已登錄\n事件編號：${id}\n回報人：${name}\n時間：${now}\n\n${text}`;
  }

  if (text.startsWith("交接回報內容")) {
    records.handovers.push({ time: now, name, content: text });
    return `📋 交接回報已登錄\n回報人：${name}\n時間：${now}\n\n${text}`;
  }

  if (text.startsWith("車位查詢內容")) {
    const keyword = text.replace("車位查詢內容", "").replace("：", "").trim();
    records.parkingQueries.push({ time: now, name, keyword });
    return parkingSearch(keyword);
  }

  if (text.startsWith("報修 ")) {
    const content = text.replace(/^報修\s*/, "");
    const id = `R-${dateId()}-${String(records.repairs.length + 1).padStart(3, "0")}`;
    records.repairs.push({ id, time: now, name, content });
    return `✅ 報修已建立\n案件編號：${id}\n回報人：${name}\n時間：${now}\n內容：${content}`;
  }

  if (text.startsWith("異常事件 ")) {
    const content = text.replace(/^異常事件\s*/, "");
    const id = `E-${dateId()}-${String(records.incidents.length + 1).padStart(3, "0")}`;
    records.incidents.push({ id, time: now, name, content });
    return `🚨 異常事件已登錄\n事件編號：${id}\n回報人：${name}\n時間：${now}\n內容：${content}`;
  }

  if (text.startsWith("車位查詢 ")) {
    const keyword = text.replace(/^車位查詢\s*/, "");
    records.parkingQueries.push({ time: now, name, keyword });
    return parkingSearch(keyword);
  }

  if (text.startsWith("上哨 ")) {
    const content = text.replace(/^上哨\s*/, "");
    records.duty.push({ time: now, name, content });
    return `✅ 上哨已登錄\n人員：${name}\n時間：${now}\n內容：${content}`;
  }

  if (text.startsWith("休息離哨 ")) {
    const content = text.replace(/^休息離哨\s*/, "");
    records.leave.push({ time: now, name, content });
    return `✅ 休息離哨已登錄\n人員：${name}\n時間：${now}\n內容：${content}`;
  }

  if (text.startsWith("交接回報 ")) {
    const content = text.replace(/^交接回報\s*/, "");
    records.handovers.push({ time: now, name, content });
    return `📋 交接回報已登錄\n回報人：${name}\n時間：${now}\n內容：${content}`;
  }

  return null;
}

function templateRepair() {
  return `🔧【報修登錄】

請複製以下格式填寫後送出：

報修內容
戶別：
位置：
類別：
問題說明：
是否急件：
處理人員：
備註：`;
}

function templateParking() {
  return `🚗【車位查詢】

請輸入：

車位查詢內容：B2-124

也可以輸入：
車位查詢 B2-124
車位查詢 A3-22
車位查詢 267`;
}

function templateIncident() {
  return `🚨【異常事件回報】

請複製以下格式填寫後送出：

異常事件內容
時間：
地點：
事件類別：
事件內容：
處理情形：
是否通知經理：
備註：`;
}

function templateHandover() {
  return `📋【交接回報】

請複製以下格式填寫後送出：

交接回報內容
班別：
回報人：
今日重點：
未完成事項：
需追蹤事項：
異常提醒：
備註：`;
}

function mainMenu() {
  return `夏沐物業LINE系統

點選圖文選單即可使用：

報修：回覆填寫格式
休息離哨：直接登記
上哨：直接登記
車位查詢：回覆查詢格式
異常事件：回覆填寫格式
交接回報：回覆填寫格式

查統計：6表`;
}

function parkingSearch(keyword) {
  if (!keyword) {
    return `請輸入查詢內容，例如：\n車位查詢 B2-124`;
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

  if (!found.length) return `查無車位資料：${keyword}`;

  return found.map(x =>
    `🚗【車位查詢結果】\n戶別：${x.unit}\n門牌：${x.door}\n所有權人：${x.owner}\n汽車位：${x.car}\n機車位：${x.moto}`
  ).join("\n\n");
}

function summary() {
  return `📊【今日6表紀錄】

1. 報修：${records.repairs.length} 筆
2. 休息離哨：${records.leave.length} 筆
3. 上哨：${records.duty.length} 筆
4. 車位查詢：${records.parkingQueries.length} 筆
5. 異常事件：${records.incidents.length} 筆
6. 交接回報：${records.handovers.length} 筆`;
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
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Xiamu LINE Bot V4 running on port ${port}`);
});
