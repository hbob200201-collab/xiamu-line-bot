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
  res.send("Xiamu Property LINE Bot V6 Smart Parse is running.");
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

  const rawText = event.message.text || "";
  const text = rawText.trim();
  const key = normalize(text);
  const userId = event.source.userId || "";
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
  const name = await getDisplayName(userId);

  if (key === "我的id") {
    return reply(event.replyToken, `你的 LINE User ID：\n${userId}`);
  }

  // 圖文選單
  if (key === "報修") return reply(event.replyToken, smartRepairHelp());
  if (key === "休息離哨" || key === "離哨") return reply(event.replyToken, directLeave(name, now));
  if (key === "上哨") return reply(event.replyToken, directDuty(name, now));
  if (key === "車位查詢" || key === "查車位") return reply(event.replyToken, smartParkingHelp());
  if (key === "異常事件" || key === "異常") return reply(event.replyToken, smartIncidentHelp());
  if (key === "交接回報" || key === "交接") return reply(event.replyToken, smartHandoverHelp());
  if (key === "功能" || key === "選單" || key === "menu") return reply(event.replyToken, mainMenu());

  // 智能判讀
  const smart = smartRouter(text, key, name, now);
  if (smart) return reply(event.replyToken, smart);

  return reply(event.replyToken, `我無法判斷這筆內容。

你可以直接輸入：
A棟3樓燈不亮
B1車道住戶糾紛
B2-124
124
A3-22
交接 今日B1臨停需追蹤`);
}

function normalize(input) {
  return String(input)
    .replace(/[🔧🛠☕👮🚗🚨📋✅]/g, "")
    .replace(/[\/／]/g, "")
    .replace(/\s+/g, "")
    .replace(/：/g, ":")
    .trim()
    .toLowerCase();
}

function smartRouter(text, key, name, now) {
  // 1. 車位查詢優先：車位格式、戶別、門牌純數字
  const parkingKeyword = detectParkingKeyword(text);
  if (parkingKeyword && !looksLikeRepair(text) && !looksLikeIncident(text) && !looksLikeHandover(text)) {
    records.parkingQueries.push({ time: now, name, keyword: parkingKeyword });
    return parkingSearch(parkingKeyword);
  }

  // 2. 明確車位查詢
  if (key.startsWith("車位查詢") || key.startsWith("查車位")) {
    const keyword = text.replace(/車位查詢|查車位|：|:/g, "").trim();
    records.parkingQueries.push({ time: now, name, keyword });
    return parkingSearch(keyword);
  }

  // 3. 交接
  if (looksLikeHandover(text)) {
    const parsed = parseHandover(text);
    records.handovers.push({ time: now, name, content: text, parsed });
    return `📋 交接回報已登錄

回報人：${name}
時間：${now}
班別：${parsed.shift || "未判讀"}
內容：${parsed.content}

系統判斷：交接事項`;
  }

  // 4. 異常事件
  if (looksLikeIncident(text)) {
    const parsed = parseIncident(text);
    const id = `E-${dateId()}-${String(records.incidents.length + 1).padStart(3, "0")}`;
    records.incidents.push({ id, time: now, name, content: text, parsed });
    return `🚨 異常事件已登錄

事件編號：${id}
回報人：${name}
時間：${now}
地點：${parsed.location || "未判讀"}
事件：${parsed.issue || text}

系統判斷：異常事件`;
  }

  // 5. 報修
  if (looksLikeRepair(text)) {
    const parsed = parseRepair(text);
    const id = `R-${dateId()}-${String(records.repairs.length + 1).padStart(3, "0")}`;
    records.repairs.push({ id, time: now, name, content: text, parsed });
    return `🔧 報修已建立

案件編號：${id}
回報人：${name}
時間：${now}
位置：${parsed.location || "未判讀"}
類別：${parsed.category || "一般報修"}
說明：${parsed.issue || text}

系統已自動判讀為：報修案件`;
  }

  // 6. 傳統格式仍支援
  if (text.startsWith("報修內容")) {
    const id = `R-${dateId()}-${String(records.repairs.length + 1).padStart(3, "0")}`;
    records.repairs.push({ id, time: now, name, content: text });
    return `✅ 報修已建立\n案件編號：${id}\n回報人：${name}\n時間：${now}\n\n${text}`;
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

  return null;
}

function detectParkingKeyword(text) {
  const t = text.trim().toUpperCase();

  // 汽車位：B2-124、B3 041、B1-22
  let m = t.match(/\bB[1-5]\s*[-－]?\s*\d{1,3}\b/);
  if (m) return m[0].replace(/\s+/g, "").replace("－", "-");

  // 戶別：A3-22、A3-22F、B5-10
  m = t.match(/\b[AB]\d\s*[-－]?\s*\d{1,2}F?\b/i);
  if (m) return m[0].toUpperCase().replace(/\s+/g, "").replace("－", "-").replace(/F$/, "");

  // 門牌或機車位：純數字 2~4 位，例如 267、124、215
  m = t.match(/^\d{2,4}$/);
  if (m) return m[0];

  // 明確講車位、機車位、門牌、戶別時，抓後面的代碼
  if (/車位|機車位|汽車位|門牌|戶別/.test(text)) {
    m = t.match(/[AB]\d\s*[-－]?\s*\d{1,2}F?|B[1-5]\s*[-－]?\s*\d{1,3}|\d{2,4}/i);
    if (m) return m[0].toUpperCase().replace(/\s+/g, "").replace("－", "-").replace(/F$/, "");
  }

  return "";
}

function looksLikeRepair(text) {
  return /(報修|故障|壞|破|漏水|滲水|堵塞|不亮|燈|電|跳電|水|門|鎖|對講機|電梯|消防|排水|馬桶|異音|設備|維修|修繕|空調|冷氣|發霉|天花板|牆面|地板)/.test(text);
}

function looksLikeIncident(text) {
  return /(異常|事件|糾紛|爭議|吵架|衝突|臨停|違停|噪音|闖入|可疑|受傷|跌倒|火警|誤報|警報|防火|打架|住戶反映|投訴|客訴|緊急)/.test(text);
}

function looksLikeHandover(text) {
  return /(交接|待辦|追蹤|未完成|今日重點|提醒|明日|晚班|早班|中班|夜班|續辦|需注意)/.test(text);
}

function parseLocation(text) {
  const patterns = [
    /[AB]棟?\s*\d{1,2}樓?/i,
    /[AB]\d\s*[-－]?\s*\d{1,2}F?/i,
    /B[1-5]F?/i,
    /地下[一二三四五12345]樓/,
    /[一二三四五六七八九十\d]+樓/,
    /大廳|櫃台|車道|停車場|梯廳|中庭|公設|健身房|Lounge|垃圾間|機房|屋頂|RF|電梯|信箱區|管理室/
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) return m[0].replace(/\s+/g, "");
  }
  return "";
}

function parseRepair(text) {
  const location = parseLocation(text);
  let category = "一般報修";
  if (/漏水|滲水|水|排水|馬桶|堵塞/.test(text)) category = "給排水";
  else if (/燈|電|跳電|插座|不亮/.test(text)) category = "水電";
  else if (/電梯|OTIS/.test(text)) category = "電梯";
  else if (/消防|火警|警報|防火/.test(text)) category = "消防";
  else if (/門禁|對講機|監視器|弱電/.test(text)) category = "弱電門禁";
  else if (/冷氣|空調/.test(text)) category = "空調";
  const issue = text.replace(location, "").replace(/^報修[:：]?\s*/, "").trim();
  return { location, category, issue };
}

function parseIncident(text) {
  const location = parseLocation(text);
  const issue = text.replace(location, "").replace(/^異常事件[:：]?\s*/, "").trim();
  return { location, issue };
}

function parseHandover(text) {
  let shift = "";
  const m = text.match(/早班|中班|晚班|夜班/);
  if (m) shift = m[0];
  const content = text.replace(/^交接回報[:：]?\s*/, "").trim();
  return { shift, content };
}

function directLeave(name, now) {
  records.leave.push({ time: now, name, content: "圖文選單直接登記休息離哨" });
  return `☕ 休息離哨已登記

人員：${name}
時間：${now}
狀態：離哨中

返回時請按「上哨」。`;
}

function directDuty(name, now) {
  records.duty.push({ time: now, name, content: "圖文選單直接登記上哨" });
  return `👮 上哨已登記

人員：${name}
時間：${now}
狀態：已返回崗位`;
}

function smartRepairHelp() {
  return `🔧【智能報修】

不用固定格式，直接輸入即可：

例：
A棟3樓燈不亮
B1車道排水堵塞
A3-18 漏水
電梯有異音

系統會自動判讀樓層、位置與報修類別。`;
}

function smartParkingHelp() {
  return `🚗【智能車位查詢】

直接輸入即可：

B2-124
124
A3-22
267
215

可用汽車位、機車位、戶別、門牌查詢。`;
}

function smartIncidentHelp() {
  return `🚨【智能異常事件】

直接輸入即可：

B1車道住戶臨停爭議
大廳住戶吵架
消防警報誤報
地下室可疑人員`;
}

function smartHandoverHelp() {
  return `📋【交接回報】

直接輸入即可：

交接 早班 B1臨停需追蹤
夜班 電梯異音明日通知廠商
今日待辦 垃圾間異味需複查`;
}

function mainMenu() {
  return `夏沐物業LINE系統

智能判讀已啟用：

報修：直接打位置+問題
車位：直接打號碼或戶別
離哨：按休息離哨
上哨：按上哨
異常：直接打事件內容
交接：直接打交接事項`;
}

function parkingSearch(keyword) {
  if (!keyword) return `請輸入查詢內容，例如：B2-124、124、A3-22、267`;

  const k = keyword.toUpperCase().replace(/\s+/g, "").replace("－","-").replace(/F$/,"");

  const data = [
    { unit: "A1-22", door: "261", owner: "羅月青", car: "B3-050", moto: "245-246" },
    { unit: "A2-22", door: "263", owner: "蔡玉惠美", car: "B2-124", moto: "215-216" },
    { unit: "A3-22", door: "267", owner: "翁紹銘", car: "B3-041", moto: "155-156" },
    { unit: "A5-22", door: "265", owner: "陳泳沛", car: "B3-042", moto: "143-144" }
  ];

  const found = data.filter(x =>
    x.unit.toUpperCase().includes(k) ||
    x.door.includes(k) ||
    x.owner.includes(keyword) ||
    x.car.toUpperCase().replace(/^B(\d)-(\d{1,2})$/, "B$1-0$2").includes(k) ||
    x.car.toUpperCase().includes(k) ||
    x.moto.includes(k) ||
    x.moto.split("-").includes(k)
  );

  if (!found.length) return `查無車位資料：${keyword}`;

  return found.map(x =>
    `🚗【車位查詢結果】
戶別：${x.unit}
門牌：${x.door}
所有權人：${x.owner}
汽車位：${x.car}
機車位：${x.moto}`
  ).join("\n\n");
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
  console.log(`Xiamu LINE Bot V6 Smart Parse running on port ${port}`);
});
