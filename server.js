
const express = require("express");
const line = require("@line/bot-sdk");
const path = require("path");

const config = {
  channelAccessToken: process.env.CHANNEL_ACCESS_TOKEN,
  channelSecret: process.env.CHANNEL_SECRET,
};

const client = new line.Client(config);
const app = express();
const parkingData = require("./parkingData.json");

const records = {
  repairs: [],
  leave: [],
  duty: [],
  incidents: [],
  handovers: [],
  parkingQueries: []
};

// LINE webhook must be before express.json()
app.post("/webhook", line.middleware(config), async (req, res) => {
  try {
    await Promise.all(req.body.events.map(handleEvent));
    res.status(200).end();
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).end();
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.get("/health", (req, res) => res.status(200).send("OK"));

app.get("/api/summary", (req, res) => {
  res.json({
    repairs: records.repairs.length,
    leave: records.leave.length,
    duty: records.duty.length,
    incidents: records.incidents.length,
    handovers: records.handovers.length,
    parkingQueries: records.parkingQueries.length,
    parkingTotal: parkingData.length,
    latest: {
      repairs: records.repairs.slice(0, 50),
      leave: records.leave.slice(0, 50),
      duty: records.duty.slice(0, 50),
      incidents: records.incidents.slice(0, 50),
      handovers: records.handovers.slice(0, 50),
      parkingQueries: records.parkingQueries.slice(0, 50)
    }
  });
});

app.get("/api/parking", (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q) return res.json(parkingData.slice(0, 500));
  res.json(searchParking(q));
});

async function handleEvent(event) {
  if (event.type !== "message" || event.message.type !== "text") return;

  const text = (event.message.text || "").trim();
  const key = normalize(text);
  const userId = event.source.userId || "";
  const now = timeNow();
  const name = await getDisplayName(userId);

  if (key === "我的id") return reply(event.replyToken, `你的 LINE User ID：\n${userId}`);
  if (key === "報修") return reply(event.replyToken, helpRepair());
  if (key === "休息離哨" || key === "離哨") return reply(event.replyToken, directLeave(name, now));
  if (key === "上哨") return reply(event.replyToken, directDuty(name, now));
  if (key === "車位查詢" || key === "查車位") return reply(event.replyToken, helpParking());
  if (key === "異常事件" || key === "異常") return reply(event.replyToken, helpIncident());
  if (key === "交接回報" || key === "交接") return reply(event.replyToken, helpHandover());
  if (key === "功能" || key === "選單" || key === "menu") return reply(event.replyToken, mainMenu());

  const result = smartRouter(text, key, name, now);
  if (result) return reply(event.replyToken, result);

  return reply(event.replyToken, `格式未判斷成功。

可輸入：
A3-22
B2-124
215
A3-22 漏水
B1車道住戶糾紛
交接 早班 B1臨停需追蹤`);
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
  const explicitParking = /^(車位查詢|查車位|汽車位|機車位|車位)/.test(text);
  const unit = detectUnit(text);
  const carSpace = detectCarSpace(text);
  const motoSpace = detectMotorcycleSpace(text);
  const pureNumber = /^\d{2,4}$/.test(text.trim());

  if (explicitParking) {
    const keyword = text.replace(/車位查詢|查車位|汽車位|機車位|車位|：|:/g, "").trim();
    records.parkingQueries.unshift({ time: now, name, keyword });
    return parkingSearchReply(keyword);
  }
  if (carSpace && text.trim().toUpperCase().replace(/\s+/g,"") === carSpace) {
    records.parkingQueries.unshift({ time: now, name, keyword: carSpace });
    return parkingSearchReply(carSpace);
  }
  if (motoSpace && text.trim().replace(/\s+/g,"") === motoSpace) {
    records.parkingQueries.unshift({ time: now, name, keyword: motoSpace });
    return parkingSearchReply(motoSpace);
  }
  if (pureNumber) {
    records.parkingQueries.unshift({ time: now, name, keyword: text.trim() });
    return parkingSearchReply(text.trim());
  }
  if (unit && looksLikeRepair(text)) return createRepair(text, name, now);
  if (unit && text.trim().toUpperCase().replace(/\s+/g,"").replace(/F$/,"") === unit) {
    records.parkingQueries.unshift({ time: now, name, keyword: unit });
    return parkingSearchReply(unit);
  }
  if (looksLikeRepair(text)) return createRepair(text, name, now);
  if (looksLikeIncident(text)) return createIncident(text, name, now);
  if (looksLikeHandover(text)) return createHandover(text, name, now);
  return null;
}

function detectUnit(text) {
  const t = text.toUpperCase().replace(/\s+/g, "");
  const m = t.match(/\b[AB][1-9][-－]\d{1,2}F?\b/);
  if (!m) return "";
  return m[0].replace("－", "-").replace(/F$/, "");
}
function detectCarSpace(text) {
  const t = text.toUpperCase().replace(/\s+/g, "");
  const m = t.match(/\bB[1-5][-－]\d{3}\b/);
  if (!m) return "";
  return m[0].replace("－", "-");
}
function detectMotorcycleSpace(text) {
  const t = text.replace(/\s+/g, "");
  const m = t.match(/^\d{2,4}([-－]\d{2,4})?$/);
  if (!m) return "";
  return m[0].replace("－", "-");
}
function parseLocation(text) {
  const unit = detectUnit(text);
  if (unit) return unit;
  const patterns = [
    /[AB]棟?\s*\d{1,2}樓?/i,
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
function looksLikeRepair(text) {
  return /(報修|故障|壞|破|漏水|滲水|堵塞|不亮|燈|電|跳電|水|門|鎖|對講機|電梯|消防|排水|馬桶|異音|設備|維修|修繕|空調|冷氣|發霉|天花板|牆面|地板)/.test(text);
}
function looksLikeIncident(text) {
  return /(異常|事件|糾紛|爭議|吵架|衝突|臨停|違停|噪音|闖入|可疑|受傷|跌倒|火警|誤報|警報|防火|打架|住戶反映|投訴|客訴|緊急)/.test(text);
}
function looksLikeHandover(text) {
  return /(交接|待辦|追蹤|未完成|今日重點|提醒|明日|晚班|早班|中班|夜班|續辦|需注意)/.test(text);
}
function createRepair(text, name, now) {
  const parsed = parseRepair(text);
  const id = `R-${dateId()}-${String(records.repairs.length + 1).padStart(3, "0")}`;
  const rec = { id, time: now, name, content: text, parsed, status: "未處理" };
  records.repairs.unshift(rec);
  return `🔧 報修已建立

案件編號：${id}
回報人：${name}
時間：${now}
戶別/位置：${parsed.location || "未判讀"}
類別：${parsed.category}
說明：${parsed.issue || text}`;
}
function createIncident(text, name, now) {
  const parsed = parseIncident(text);
  const id = `E-${dateId()}-${String(records.incidents.length + 1).padStart(3, "0")}`;
  records.incidents.unshift({ id, time: now, name, content: text, parsed });
  return `🚨 異常事件已登錄

事件編號：${id}
回報人：${name}
時間：${now}
地點：${parsed.location || "未判讀"}
事件：${parsed.issue || text}`;
}
function createHandover(text, name, now) {
  const parsed = parseHandover(text);
  records.handovers.unshift({ time: now, name, content: text, parsed });
  return `📋 交接回報已登錄

回報人：${name}
時間：${now}
班別：${parsed.shift || "未判讀"}
內容：${parsed.content}`;
}
function parseRepair(text) {
  const location = parseLocation(text);
  let category = "一般報修";
  if (/漏水|滲水|水|排水|馬桶|堵塞/.test(text)) category = "給排水";
  else if (/燈|電|跳電|插座|不亮/.test(text)) category = "水電";
  else if (/電梯|OTIS/i.test(text)) category = "電梯";
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
  const m = text.match(/早班|中班|晚班|夜班/);
  const shift = m ? m[0] : "";
  const content = text.replace(/^交接回報[:：]?\s*/, "").replace(/^交接[:：]?\s*/, "").trim();
  return { shift, content };
}
function directLeave(name, now) {
  records.leave.unshift({ time: now, name, content: "圖文選單直接登記休息離哨" });
  return `☕ 休息離哨已登記

人員：${name}
時間：${now}
狀態：離哨中

返回時請按「上哨」。`;
}
function directDuty(name, now) {
  records.duty.unshift({ time: now, name, content: "圖文選單直接登記上哨" });
  return `👮 上哨已登記

人員：${name}
時間：${now}
狀態：已返回崗位`;
}
function helpRepair(){return `🔧【智能報修】

直接輸入戶別/樓層/位置 + 問題：

A3-22 漏水
A棟3樓燈不亮
B1車道排水堵塞
電梯有異音`;}
function helpParking(){return `🚗【智能車位查詢】

可輸入：

A3-22
B2-124
215
215-216
機車位215
車位查詢 267

可查：戶別、門牌、汽車位、機車位。`;}
function helpIncident(){return `🚨【異常事件】

直接輸入：
B1車道住戶臨停爭議
大廳住戶吵架
消防警報誤報`;}
function helpHandover(){return `📋【交接回報】

直接輸入：
交接 早班 B1臨停需追蹤
夜班 電梯異音明日通知廠商`;}
function mainMenu(){return `夏沐物業LINE系統

報修：戶別/樓層 + 問題
車位查詢：戶別/門牌/汽車位/機車位
離哨：按休息離哨
上哨：按上哨
異常：輸入事件內容
交接：輸入交接事項`;}

function searchParking(keyword) {
  if (!keyword) return [];
  const k = String(keyword).toUpperCase().replace(/\s+/g, "").replace("－","-").replace(/F$/,"");
  return parkingData.filter(x => {
    const motoParts = expandMotoRange(x.moto);
    return (
      String(x.unit).toUpperCase().replace(/F$/,"") === k ||
      String(x.unit).toUpperCase().replace(/F$/,"").includes(k) ||
      String(x.door) === k ||
      String(x.owner).includes(keyword) ||
      String(x.car).toUpperCase() === k ||
      String(x.car).toUpperCase().includes(k) ||
      String(x.moto) === k ||
      String(x.moto).includes(k) ||
      motoParts.includes(k)
    );
  }).slice(0, 50);
}
function parkingSearchReply(keyword) {
  const found = searchParking(keyword);
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
function expandMotoRange(moto) {
  if (!moto) return [];
  const s = String(moto).replace("－", "-");
  if (!s.includes("-")) return [s];
  const [a, b] = s.split("-").map(x => parseInt(x, 10));
  if (isNaN(a) || isNaN(b)) return [s];
  const arr = [];
  for (let i = Math.min(a,b); i <= Math.max(a,b); i++) arr.push(String(i));
  arr.push(s);
  return arr;
}
async function getDisplayName(userId) {
  try { const profile = await client.getProfile(userId); return profile.displayName || userId; }
  catch (e) { return userId || "未知人員"; }
}
function reply(replyToken, text) { return client.replyMessage(replyToken, { type: "text", text }); }
function timeNow() { return new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" }); }
function dateId() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth()+1).padStart(2,"0")}${String(d.getDate()).padStart(2,"0")}`;
}
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Xiamu LINE Bot V12 Admin Layout Fix running on port ${port}`));
