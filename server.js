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

// 夏沐正式車位資料：由 Excel「夏沐車位資料_截圖匯入版(2).xlsx」匯入
const parkingData = [
  {
    "building": "A棟",
    "unit": "A1-22F",
    "unitBase": "A1",
    "door": "261",
    "floor": "22F",
    "owner": "羅月青",
    "car": "B3-050",
    "moto": "245-246",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-22F",
    "unitBase": "A2",
    "door": "263",
    "floor": "22F",
    "owner": "蔡王惠美",
    "car": "B2-124",
    "moto": "215-216",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-22F",
    "unitBase": "A3",
    "door": "267",
    "floor": "22F",
    "owner": "翁紹銘",
    "car": "B3-041",
    "moto": "155-156",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-22F",
    "unitBase": "A5",
    "door": "265",
    "floor": "22F",
    "owner": "陳泳沛",
    "car": "B3-042",
    "moto": "143-144",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-21F",
    "unitBase": "A1",
    "door": "261",
    "floor": "21F",
    "owner": "張王美秀",
    "car": "B1-171",
    "moto": "129,214",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-21F",
    "unitBase": "A2",
    "door": "263",
    "floor": "21F",
    "owner": "張王美秀",
    "car": "B1-172",
    "moto": "119-120",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-21F",
    "unitBase": "A3",
    "door": "267",
    "floor": "21F",
    "owner": "張王美秀",
    "car": "",
    "moto": "39,112",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-21F",
    "unitBase": "A5",
    "door": "265",
    "floor": "21F",
    "owner": "張王美秀",
    "car": "",
    "moto": "233-234",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-20F",
    "unitBase": "A1",
    "door": "261",
    "floor": "20F",
    "owner": "蔡王惠美",
    "car": "B2-117",
    "moto": "241-242",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-20F",
    "unitBase": "A2",
    "door": "263",
    "floor": "20F",
    "owner": "邱郁純",
    "car": "B2-152",
    "moto": "186-187",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-20F",
    "unitBase": "A3",
    "door": "267",
    "floor": "20F",
    "owner": "蔡王惠美",
    "car": "B2-097",
    "moto": "135-136",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-20F",
    "unitBase": "A5",
    "door": "265",
    "floor": "20F",
    "owner": "鄭巧喧",
    "car": "B3-026",
    "moto": "157,130",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-19F",
    "unitBase": "A1",
    "door": "261",
    "floor": "19F",
    "owner": "王勝雄",
    "car": "B1-159",
    "moto": "198-199",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-19F",
    "unitBase": "A2",
    "door": "263",
    "floor": "19F",
    "owner": "王勝雄",
    "car": "B1-160",
    "moto": "108-109",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-19F",
    "unitBase": "A3",
    "door": "267",
    "floor": "19F",
    "owner": "王勝雄",
    "car": "B1-161",
    "moto": "190-191",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-19F",
    "unitBase": "A5",
    "door": "265",
    "floor": "19F",
    "owner": "王勝雄",
    "car": "B2-093",
    "moto": "141-142",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-18F",
    "unitBase": "A1",
    "door": "261",
    "floor": "18F",
    "owner": "王勝雄",
    "car": "B2-086",
    "moto": "284-285",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-18F",
    "unitBase": "A2",
    "door": "263",
    "floor": "18F",
    "owner": "吳沛璇",
    "car": "B2-130",
    "moto": "145-146",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-18F",
    "unitBase": "A3",
    "door": "267",
    "floor": "18F",
    "owner": "張植勛",
    "car": "B3-007",
    "moto": "113-114",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-18F",
    "unitBase": "A5",
    "door": "265",
    "floor": "18F",
    "owner": "黃詩喻",
    "car": "B3-056",
    "moto": "188-189",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-17F",
    "unitBase": "A1",
    "door": "261",
    "floor": "17F",
    "owner": "張王美秀",
    "car": "B2-081",
    "moto": "231-232",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-17F",
    "unitBase": "A2",
    "door": "263",
    "floor": "17F",
    "owner": "楊士鴻",
    "car": "B2-082",
    "moto": "255-256",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-17F",
    "unitBase": "A3",
    "door": "267",
    "floor": "17F",
    "owner": "陳昱安",
    "car": "B3-062",
    "moto": "90-91",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-17F",
    "unitBase": "A5",
    "door": "265",
    "floor": "17F",
    "owner": "王芊秀",
    "car": "B3-58",
    "moto": "84-85",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-16F",
    "unitBase": "A1",
    "door": "261",
    "floor": "16F",
    "owner": "江偉綸",
    "car": "B3-010",
    "moto": "100-101",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-16F",
    "unitBase": "A2",
    "door": "263",
    "floor": "16F",
    "owner": "林楷樺",
    "car": "B3-044",
    "moto": "192-193",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-16F",
    "unitBase": "A3",
    "door": "267",
    "floor": "16F",
    "owner": "余真荃",
    "car": "B3-060",
    "moto": "178-179",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-16F",
    "unitBase": "A5",
    "door": "265",
    "floor": "16F",
    "owner": "任慧絹",
    "car": "B2-140",
    "moto": "180-181",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-15F",
    "unitBase": "A1",
    "door": "261",
    "floor": "15F",
    "owner": "陳俞霖",
    "car": "B2-150",
    "moto": "200-201",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-15F",
    "unitBase": "A2",
    "door": "263",
    "floor": "15F",
    "owner": "陳伶卉",
    "car": "B2-144",
    "moto": "104-105",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-15F",
    "unitBase": "A3",
    "door": "267",
    "floor": "15F",
    "owner": "張力元",
    "car": "B2-153",
    "moto": "176-177",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-15F",
    "unitBase": "A5",
    "door": "265",
    "floor": "15F",
    "owner": "羅世育",
    "car": "B2-121",
    "moto": "133-134",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-14F",
    "unitBase": "A1",
    "door": "261",
    "floor": "14F",
    "owner": "曾唯祐",
    "car": "B2-120",
    "moto": "223-224",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-14F",
    "unitBase": "A2",
    "door": "263",
    "floor": "14F",
    "owner": "張秀蓮",
    "car": "B3-006",
    "moto": "237-238",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-14F",
    "unitBase": "A3",
    "door": "267",
    "floor": "14F",
    "owner": "陳琪",
    "car": "B2-110",
    "moto": "243-244",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-14F",
    "unitBase": "A5",
    "door": "265",
    "floor": "14F",
    "owner": "田國璇",
    "car": "B2-131",
    "moto": "123-124",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-13F",
    "unitBase": "A1",
    "door": "261",
    "floor": "13F",
    "owner": "劉安婷",
    "car": "B3-013",
    "moto": "139-140",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-13F",
    "unitBase": "A2",
    "door": "263",
    "floor": "13F",
    "owner": "曾寶貴",
    "car": "B2-139",
    "moto": "208-209",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-13F",
    "unitBase": "A3",
    "door": "267",
    "floor": "13F",
    "owner": "陳靜宜",
    "car": "B3-019",
    "moto": "235-236",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-13F",
    "unitBase": "A5",
    "door": "265",
    "floor": "13F",
    "owner": "黃若涵",
    "car": "B2-155",
    "moto": "127-128",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-12F",
    "unitBase": "A1",
    "door": "261",
    "floor": "12F",
    "owner": "王弘榮",
    "car": "B1-165",
    "moto": "229-230",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-12F",
    "unitBase": "A2",
    "door": "263",
    "floor": "12F",
    "owner": "黃仲玄",
    "car": "B3-070",
    "moto": "227-228",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-12F",
    "unitBase": "A3",
    "door": "267",
    "floor": "12F",
    "owner": "王道成",
    "car": "B2-101",
    "moto": "184-185",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-12F",
    "unitBase": "A5",
    "door": "265",
    "floor": "12F",
    "owner": "廖志泓",
    "car": "B2-147",
    "moto": "96-97",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-11F",
    "unitBase": "A1",
    "door": "261",
    "floor": "11F",
    "owner": "吳錫政",
    "car": "B3-078",
    "moto": "88-89",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-11F",
    "unitBase": "A2",
    "door": "263",
    "floor": "11F",
    "owner": "楊智全",
    "car": "B2-149",
    "moto": "225-226",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-11F",
    "unitBase": "A3",
    "door": "267",
    "floor": "11F",
    "owner": "林芸、林浩汶",
    "car": "B3-067",
    "moto": "86-87",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-11F",
    "unitBase": "A5",
    "door": "265",
    "floor": "11F",
    "owner": "郭惠華",
    "car": "B2-126",
    "moto": "202-203",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-10F",
    "unitBase": "A1",
    "door": "261",
    "floor": "10F",
    "owner": "賴沛儒",
    "car": "B3-047",
    "moto": "257-258",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-10F",
    "unitBase": "A2",
    "door": "263",
    "floor": "10F",
    "owner": "林冠妤",
    "car": "B3-001",
    "moto": "221-222",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-10F",
    "unitBase": "A3",
    "door": "267",
    "floor": "10F",
    "owner": "賴美兆",
    "car": "B2-146",
    "moto": "196-197",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-10F",
    "unitBase": "A5",
    "door": "265",
    "floor": "10F",
    "owner": "張庭瑋",
    "car": "B2-105",
    "moto": "117-118",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-9F",
    "unitBase": "A1",
    "door": "261",
    "floor": "9F",
    "owner": "賴慧卉",
    "car": "B3-043",
    "moto": "210-211",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-9F",
    "unitBase": "A2",
    "door": "263",
    "floor": "9F",
    "owner": "陳晉輝",
    "car": "B2-119",
    "moto": "102-103",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-9F",
    "unitBase": "A3",
    "door": "267",
    "floor": "9F",
    "owner": "陳孟詩",
    "car": "B3-069",
    "moto": "204-205",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-9F",
    "unitBase": "A5",
    "door": "265",
    "floor": "9F",
    "owner": "林雨德",
    "car": "B3-066",
    "moto": "174-175",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-8F",
    "unitBase": "A1",
    "door": "261",
    "floor": "8F",
    "owner": "蔡王惠美",
    "car": "B2-083",
    "moto": "149-150",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-8F",
    "unitBase": "A2",
    "door": "263",
    "floor": "8F",
    "owner": "盧小青",
    "car": "B2-106",
    "moto": "121-122",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-8F",
    "unitBase": "A3",
    "door": "267",
    "floor": "8F",
    "owner": "蔡王惠美",
    "car": "B2-115",
    "moto": "137-138",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-8F",
    "unitBase": "A5",
    "door": "265",
    "floor": "8F",
    "owner": "鄭美玉黃千瑄",
    "car": "B2-136",
    "moto": "212-213",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-7F",
    "unitBase": "A1",
    "door": "261",
    "floor": "7F",
    "owner": "陳宇齊、陳逸如",
    "car": "B2-141",
    "moto": "94-95",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-7F",
    "unitBase": "A2",
    "door": "263",
    "floor": "7F",
    "owner": "鄧信容",
    "car": "B3-072",
    "moto": "125-126",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-7F",
    "unitBase": "A3",
    "door": "267",
    "floor": "7F",
    "owner": "王弘榮",
    "car": "B1-166",
    "moto": "151-152",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-7F",
    "unitBase": "A5",
    "door": "265",
    "floor": "7F",
    "owner": "蔣開洲",
    "car": "B2-094",
    "moto": "106-107",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-6F",
    "unitBase": "A1",
    "door": "261",
    "floor": "6F",
    "owner": "唐毓環",
    "car": "B1-158",
    "moto": "153-154",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-6F",
    "unitBase": "A2",
    "door": "263",
    "floor": "6F",
    "owner": "簡茂文",
    "car": "B2-133",
    "moto": "247-248",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-6F",
    "unitBase": "A3",
    "door": "267",
    "floor": "6F",
    "owner": "王弘榮",
    "car": "B2-089",
    "moto": "82-83",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-6F",
    "unitBase": "A5",
    "door": "265",
    "floor": "6F",
    "owner": "丁柏任",
    "car": "B3-052",
    "moto": "194-195",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-5F",
    "unitBase": "A1",
    "door": "261",
    "floor": "5F",
    "owner": "林敬賢",
    "car": "B3-038",
    "moto": "239-240",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-5F",
    "unitBase": "A2",
    "door": "263",
    "floor": "5F",
    "owner": "楊惠婷",
    "car": "B2-154",
    "moto": "182-183",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-5F",
    "unitBase": "A3",
    "door": "267",
    "floor": "5F",
    "owner": "王弘榮",
    "car": "B2-088",
    "moto": "131-132",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-5F",
    "unitBase": "A5",
    "door": "265",
    "floor": "5F",
    "owner": "黃筱筠",
    "car": "B2-134",
    "moto": "206-207",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-4F",
    "unitBase": "A1",
    "door": "261",
    "floor": "4F",
    "owner": "林朝榮",
    "car": "B3-063",
    "moto": "110-111",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-4F",
    "unitBase": "A2",
    "door": "263",
    "floor": "4F",
    "owner": "高芳璋",
    "car": "B3-008",
    "moto": "37-38",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-4F",
    "unitBase": "A3",
    "door": "267",
    "floor": "4F",
    "owner": "秦志福",
    "car": "B2-114",
    "moto": "92-93",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-4F",
    "unitBase": "A5",
    "door": "265",
    "floor": "4F",
    "owner": "陳怡君",
    "car": "B3-027",
    "moto": "115-116",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A1-3F",
    "unitBase": "A1",
    "door": "261",
    "floor": "3F",
    "owner": "蔡博宇",
    "car": "B3-076",
    "moto": "147-148",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A2-3F",
    "unitBase": "A2",
    "door": "263",
    "floor": "3F",
    "owner": "張景惠",
    "car": "B3-068",
    "moto": "99-98",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A3-3F",
    "unitBase": "A3",
    "door": "267",
    "floor": "3F",
    "owner": "朱家妤",
    "car": "B3-049",
    "moto": "35-36",
    "note": ""
  },
  {
    "building": "A棟",
    "unit": "A5-3F",
    "unitBase": "A5",
    "door": "265",
    "floor": "3F",
    "owner": "楊善閔",
    "car": "B2-125",
    "moto": "219-220",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-22F",
    "unitBase": "B1",
    "door": "271",
    "floor": "22F",
    "owner": "張王美秀",
    "car": "B2-084、B2-085、B2-095、B2-096",
    "moto": "68-69",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-22F",
    "unitBase": "B2",
    "door": "269",
    "floor": "22F",
    "owner": "張王美秀",
    "car": "",
    "moto": "64-65",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-22F",
    "unitBase": "B3",
    "door": "273",
    "floor": "22F",
    "owner": "羅月青",
    "car": "B3-051",
    "moto": "9-10",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-22F",
    "unitBase": "B5",
    "door": "275",
    "floor": "22F",
    "owner": "曾若綺",
    "car": "B3-029",
    "moto": "217-218",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-21F",
    "unitBase": "B1",
    "door": "271",
    "floor": "21F",
    "owner": "王勝雄",
    "car": "B2-091",
    "moto": "306-307",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-21F",
    "unitBase": "B2",
    "door": "269",
    "floor": "21F",
    "owner": "王勝雄",
    "car": "B2-092",
    "moto": "276-277",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-21F",
    "unitBase": "B3",
    "door": "273",
    "floor": "21F",
    "owner": "林詠恩",
    "car": "B3-018",
    "moto": "292-293",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-21F",
    "unitBase": "B5",
    "door": "275",
    "floor": "21F",
    "owner": "林以莉",
    "car": "B3-037",
    "moto": "286-287",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-20F",
    "unitBase": "B1",
    "door": "271",
    "floor": "20F",
    "owner": "蔡王惠美",
    "car": "B2-116",
    "moto": "21-22",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-20F",
    "unitBase": "B2",
    "door": "269",
    "floor": "20F",
    "owner": "施媛雯",
    "car": "B2-080",
    "moto": "44-45",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-20F",
    "unitBase": "B3",
    "door": "273",
    "floor": "20F",
    "owner": "張智鈞",
    "car": "B3-002",
    "moto": "74-75",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-20F",
    "unitBase": "B5",
    "door": "275",
    "floor": "20F",
    "owner": "陳榆中",
    "car": "B3-011",
    "moto": "334,311",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-19F",
    "unitBase": "B1",
    "door": "271",
    "floor": "19F",
    "owner": "蔡王惠美",
    "car": "B2-127",
    "moto": "23-24",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-19F",
    "unitBase": "B2",
    "door": "269",
    "floor": "19F",
    "owner": "蔡王惠美",
    "car": "B3-039",
    "moto": "332-333",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-19F",
    "unitBase": "B3",
    "door": "273",
    "floor": "19F",
    "owner": "陳怜秀",
    "car": "B2-122",
    "moto": "302-303",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-19F",
    "unitBase": "B5",
    "door": "275",
    "floor": "19F",
    "owner": "江冠錚",
    "car": "B2-143",
    "moto": "263-264",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-18F",
    "unitBase": "B1",
    "door": "271",
    "floor": "18F",
    "owner": "張欣聰",
    "car": "B2-148",
    "moto": "29-30",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-18F",
    "unitBase": "B2",
    "door": "269",
    "floor": "18F",
    "owner": "鄧智源",
    "car": "B2-113",
    "moto": "25-26",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-18F",
    "unitBase": "B3",
    "door": "273",
    "floor": "18F",
    "owner": "劉淑芬",
    "car": "B3-075",
    "moto": "308-309",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-18F",
    "unitBase": "B5",
    "door": "275",
    "floor": "18F",
    "owner": "伍妙文",
    "car": "B3-064",
    "moto": "62-63",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-17F",
    "unitBase": "B1",
    "door": "271",
    "floor": "17F",
    "owner": "張玉玲",
    "car": "B2-111",
    "moto": "328-329",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-17F",
    "unitBase": "B2",
    "door": "269",
    "floor": "17F",
    "owner": "林永正",
    "car": "B3-036",
    "moto": "278-279",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-17F",
    "unitBase": "B3",
    "door": "273",
    "floor": "17F",
    "owner": "賴碧珠",
    "car": "B3-015",
    "moto": "54-55",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-17F",
    "unitBase": "B5",
    "door": "275",
    "floor": "17F",
    "owner": "邱垂漢",
    "car": "B3-017",
    "moto": "249-250",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-16F",
    "unitBase": "B1",
    "door": "271",
    "floor": "16F",
    "owner": "曾文育",
    "car": "B3-016",
    "moto": "78-79",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-16F",
    "unitBase": "B2",
    "door": "269",
    "floor": "16F",
    "owner": "劉其勇",
    "car": "B3-033",
    "moto": "27-28",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-16F",
    "unitBase": "B3",
    "door": "273",
    "floor": "16F",
    "owner": "廖玉如",
    "car": "B3-053",
    "moto": "330-331",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-16F",
    "unitBase": "B5",
    "door": "275",
    "floor": "16F",
    "owner": "羅芸惠",
    "car": "B3-034",
    "moto": "19-20",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-15F",
    "unitBase": "B1",
    "door": "271",
    "floor": "15F",
    "owner": "張鈴湧",
    "car": "B3-055",
    "moto": "46-47",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-15F",
    "unitBase": "B2",
    "door": "269",
    "floor": "15F",
    "owner": "吳亭瑩",
    "car": "B3-073",
    "moto": "272-273",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-15F",
    "unitBase": "B3",
    "door": "273",
    "floor": "15F",
    "owner": "賴永恩",
    "car": "B3-028",
    "moto": "52-53",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-15F",
    "unitBase": "B5",
    "door": "275",
    "floor": "15F",
    "owner": "劉晏慈",
    "car": "B1-157",
    "moto": "48-49",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-14F",
    "unitBase": "B1",
    "door": "271",
    "floor": "14F",
    "owner": "林郁欣",
    "car": "B2-104",
    "moto": "267,319",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-14F",
    "unitBase": "B2",
    "door": "269",
    "floor": "14F",
    "owner": "黃于勉",
    "car": "B3-025",
    "moto": "274-275",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-14F",
    "unitBase": "B3",
    "door": "273",
    "floor": "14F",
    "owner": "黃潔妤",
    "car": "B3-031",
    "moto": "299-300",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-14F",
    "unitBase": "B5",
    "door": "275",
    "floor": "14F",
    "owner": "戴玉清",
    "car": "B2-142",
    "moto": "290-291",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-13F",
    "unitBase": "B1",
    "door": "271",
    "floor": "13F",
    "owner": "張馥丞",
    "car": "B2-151",
    "moto": "324-325",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-13F",
    "unitBase": "B2",
    "door": "269",
    "floor": "13F",
    "owner": "黃鈺瑩",
    "car": "B2-137",
    "moto": "66-67",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-13F",
    "unitBase": "B3",
    "door": "273",
    "floor": "13F",
    "owner": "梁芳慈",
    "car": "B2-102",
    "moto": "288-289",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-13F",
    "unitBase": "B5",
    "door": "275",
    "floor": "13F",
    "owner": "賴家鵬",
    "car": "B2-103",
    "moto": "280-281",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-12F",
    "unitBase": "B1",
    "door": "271",
    "floor": "12F",
    "owner": "賴昱鴻",
    "car": "B3-020",
    "moto": "1-2",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-12F",
    "unitBase": "B2",
    "door": "269",
    "floor": "12F",
    "owner": "劉其勇",
    "car": "B3-030",
    "moto": "295-296",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-12F",
    "unitBase": "B3",
    "door": "273",
    "floor": "12F",
    "owner": "王弘甲",
    "car": "B3-003",
    "moto": "251-252",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-12F",
    "unitBase": "B5",
    "door": "275",
    "floor": "12F",
    "owner": "許芳滿",
    "car": "B3-074",
    "moto": "268-269",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-11F",
    "unitBase": "B1",
    "door": "271",
    "floor": "11F",
    "owner": "黃銘煌",
    "car": "B3-035",
    "moto": "33-34",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-11F",
    "unitBase": "B2",
    "door": "269",
    "floor": "11F",
    "owner": "簡尚達",
    "car": "B3-054",
    "moto": "72-73",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-11F",
    "unitBase": "B3",
    "door": "273",
    "floor": "11F",
    "owner": "邱福傑",
    "car": "B2-108",
    "moto": "5-6",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-11F",
    "unitBase": "B5",
    "door": "275",
    "floor": "11F",
    "owner": "翁麗慧",
    "car": "B3-046",
    "moto": "316-317",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-10F",
    "unitBase": "B1",
    "door": "271",
    "floor": "10F",
    "owner": "邱豐鈞",
    "car": "B2-145",
    "moto": "320-321",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-10F",
    "unitBase": "B2",
    "door": "269",
    "floor": "10F",
    "owner": "王顥政",
    "car": "B3-048",
    "moto": "15-16",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-10F",
    "unitBase": "B3",
    "door": "273",
    "floor": "10F",
    "owner": "蔡王惠美",
    "car": "B3-040",
    "moto": "312-313",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-10F",
    "unitBase": "B5",
    "door": "275",
    "floor": "10F",
    "owner": "魏汝芸",
    "car": "B2-112",
    "moto": "282-283",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-9F",
    "unitBase": "B1",
    "door": "271",
    "floor": "9F",
    "owner": "黃暄今",
    "car": "B3-014",
    "moto": "56-57",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-9F",
    "unitBase": "B2",
    "door": "269",
    "floor": "9F",
    "owner": "卓楷芸",
    "car": "B3-065",
    "moto": "80-81",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-9F",
    "unitBase": "B3",
    "door": "273",
    "floor": "9F",
    "owner": "陳心國",
    "car": "B3-071",
    "moto": "76-77",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-9F",
    "unitBase": "B5",
    "door": "275",
    "floor": "9F",
    "owner": "黃淑雯",
    "car": "B3-057",
    "moto": "60-61",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-8F",
    "unitBase": "B1",
    "door": "271",
    "floor": "8F",
    "owner": "謝宗隆",
    "car": "B3-032",
    "moto": "7-8",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-8F",
    "unitBase": "B2",
    "door": "269",
    "floor": "8F",
    "owner": "陳家昇、張雅君",
    "car": "B3-059",
    "moto": "17-18",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-8F",
    "unitBase": "B3",
    "door": "273",
    "floor": "8F",
    "owner": "呂佳霖",
    "car": "B2-135",
    "moto": "259-260",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-8F",
    "unitBase": "B5",
    "door": "275",
    "floor": "8F",
    "owner": "中繼機房",
    "car": "",
    "moto": "",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-7F",
    "unitBase": "B1",
    "door": "271",
    "floor": "7F",
    "owner": "陳文達",
    "car": "B2-107",
    "moto": "322-323",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-7F",
    "unitBase": "B2",
    "door": "269",
    "floor": "7F",
    "owner": "游麗秋",
    "car": "B2-138",
    "moto": "13-14",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-7F",
    "unitBase": "B3",
    "door": "273",
    "floor": "7F",
    "owner": "邱淑君",
    "car": "B2-123",
    "moto": "270-271",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-7F",
    "unitBase": "B5",
    "door": "275",
    "floor": "7F",
    "owner": "林杰穎",
    "car": "B3-077",
    "moto": "297-298",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-6F",
    "unitBase": "B1",
    "door": "271",
    "floor": "6F",
    "owner": "蔡王惠美",
    "car": "B2-129",
    "moto": "261-262",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-6F",
    "unitBase": "B2",
    "door": "269",
    "floor": "6F",
    "owner": "林燕芬",
    "car": "B3-023",
    "moto": "31-32",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-6F",
    "unitBase": "B3",
    "door": "273",
    "floor": "6F",
    "owner": "謝盈鈞",
    "car": "B2-132",
    "moto": "265-266",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-6F",
    "unitBase": "B5",
    "door": "275",
    "floor": "6F",
    "owner": "周郁晨",
    "car": "B3-009",
    "moto": "310,294",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-5F",
    "unitBase": "B1",
    "door": "271",
    "floor": "5F",
    "owner": "蔡王惠美",
    "car": "B2-128",
    "moto": "40-41",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-5F",
    "unitBase": "B2",
    "door": "269",
    "floor": "5F",
    "owner": "彭雯蘋",
    "car": "B3-022",
    "moto": "50-51",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-5F",
    "unitBase": "B3",
    "door": "273",
    "floor": "5F",
    "owner": "王弘甲",
    "car": "B3-021",
    "moto": "318,301",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-5F",
    "unitBase": "B5",
    "door": "275",
    "floor": "5F",
    "owner": "潘祈歆",
    "car": "B3-012",
    "moto": "3-4",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-4F",
    "unitBase": "B1",
    "door": "271",
    "floor": "4F",
    "owner": "楊宜蓁",
    "car": "B2-156",
    "moto": "42-43",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-4F",
    "unitBase": "B2",
    "door": "269",
    "floor": "4F",
    "owner": "葉峯谷",
    "car": "B2-161",
    "moto": "304-305",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-4F",
    "unitBase": "B3",
    "door": "273",
    "floor": "4F",
    "owner": "王弘甲",
    "car": "B3-005",
    "moto": "11-12",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-4F",
    "unitBase": "B5",
    "door": "275",
    "floor": "4F",
    "owner": "謝承光",
    "car": "B3-079",
    "moto": "58-59",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B1-3F",
    "unitBase": "B1",
    "door": "271",
    "floor": "3F",
    "owner": "何湘妍",
    "car": "B2-109",
    "moto": "326-327",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B2-3F",
    "unitBase": "B2",
    "door": "269",
    "floor": "3F",
    "owner": "劉詩柔",
    "car": "B3-024",
    "moto": "70-71",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B3-3F",
    "unitBase": "B3",
    "door": "273",
    "floor": "3F",
    "owner": "王弘甲",
    "car": "B2-098",
    "moto": "314-315",
    "note": ""
  },
  {
    "building": "B棟",
    "unit": "B5-3F",
    "unitBase": "B5",
    "door": "275",
    "floor": "3F",
    "owner": "沈孟慕",
    "car": "B3-045",
    "moto": "253-254",
    "note": ""
  }
];

app.get("/", (req, res) => res.send("Xiamu Property LINE Bot V9 Official Parking Data is running."));

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

  const text = (event.message.text || "").trim();
  const key = normalize(text);
  const userId = event.source.userId || "";
  const now = new Date().toLocaleString("zh-TW", { timeZone: "Asia/Taipei" });
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
A3-22F
B2-124
215
215-216
機車位215
A3-22 漏水
B1車道住戶糾紛`);
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
  const explicitParking = /^(車位查詢|查車位|汽車位|機車位|車位|戶別查詢|門牌查詢|所有權人)/.test(text);
  const unit = detectUnit(text);
  const carSpace = detectCarSpace(text);
  const motoSpace = detectMotorcycleSpace(text);
  const pureNumber = /^\d{2,4}$/.test(text.trim());

  if (explicitParking) {
    const keyword = text.replace(/車位查詢|查車位|汽車位|機車位|車位|戶別查詢|門牌查詢|所有權人|：|:/g, "").trim();
    records.parkingQueries.push({ time: now, name, keyword });
    return parkingSearch(keyword);
  }

  // 純汽車位，例如 B2-124
  if (carSpace && text.trim().toUpperCase().replace(/\s+/g,"") === carSpace) {
    records.parkingQueries.push({ time: now, name, keyword: carSpace });
    return parkingSearch(carSpace);
  }

  // 純機車位，例如 215 或 215-216
  if (motoSpace && text.trim().replace(/\s+/g,"").replace("－","-") === motoSpace) {
    records.parkingQueries.push({ time: now, name, keyword: motoSpace });
    return parkingSearch(motoSpace);
  }

  // 純數字：可能是門牌或機車位，統一查資料
  if (pureNumber) {
    records.parkingQueries.push({ time: now, name, keyword: text.trim() });
    return parkingSearch(text.trim());
  }

  // 戶別 + 問題 = 報修
  if (unit && looksLikeRepair(text)) return createRepair(text, name, now);

  // 只有戶別 = 查資料
  const compact = text.trim().toUpperCase().replace(/\s+/g,"").replace(/F$/,"");
  if (unit && compact === unit) {
    records.parkingQueries.push({ time: now, name, keyword: unit });
    return parkingSearch(unit);
  }

  if (looksLikeRepair(text)) return createRepair(text, name, now);
  if (looksLikeIncident(text)) return createIncident(text, name, now);
  if (looksLikeHandover(text)) return createHandover(text, name, now);

  // 姓名查詢：2-4個中文字，且在資料中找到
  if (/^[\u4e00-\u9fa5]{2,4}$/.test(text) && parkingSearch(text).startsWith("🚗")) {
    records.parkingQueries.push({ time: now, name, keyword: text });
    return parkingSearch(text);
  }

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
  const m = t.match(/^\d{1,4}([-－]\d{1,4})?$/);
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
  records.repairs.push({ id, time: now, name, content: text, parsed });
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
  records.incidents.push({ id, time: now, name, content: text, parsed });
  return `🚨 異常事件已登錄

事件編號：${id}
回報人：${name}
時間：${now}
地點：${parsed.location || "未判讀"}
事件：${parsed.issue || text}`;
}

function createHandover(text, name, now) {
  const parsed = parseHandover(text);
  records.handovers.push({ time: now, name, content: text, parsed });
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

function helpRepair() {
  return `🔧【智能報修】

直接輸入戶別/樓層/位置 + 問題：

A3-22F 漏水
A3-22 漏水
A棟3樓燈不亮
B1車道排水堵塞
電梯有異音`;
}

function helpParking() {
  return `🚗【智能車位查詢】

可直接輸入：

A3-22
A3-22F
B2-124
215
215-216
機車位215
267
翁紹銘

可查：戶別、門牌、所有權人、汽車位、機車位。`;
}

function helpIncident() {
  return `🚨【異常事件】

直接輸入：
B1車道住戶臨停爭議
大廳住戶吵架
消防警報誤報`;
}

function helpHandover() {
  return `📋【交接回報】

直接輸入：
交接 早班 B1臨停需追蹤
夜班 電梯異音明日通知廠商`;
}

function mainMenu() {
  return `夏沐物業LINE系統

報修：戶別/樓層 + 問題
車位查詢：戶別/門牌/姓名/汽車位/機車位
離哨：按休息離哨
上哨：按上哨
異常：輸入事件內容
交接：輸入交接事項`;
}

function parkingSearch(keyword) {
  if (!keyword) return `請輸入查詢內容，例如：A3-22、B2-124、215、215-216、267、姓名`;

  const k = normalizeParkingKeyword(keyword);

  const found = parkingData.filter(x => {
    const unitNoF = normalizeParkingKeyword(x.unit).replace(/F$/, "");
    const unitFull = normalizeParkingKeyword(x.unit);
    const car = normalizeParkingKeyword(x.car);
    const moto = normalizeParkingKeyword(x.moto);
    const motoParts = expandMotoTokens(x.moto).map(normalizeParkingKeyword);
    return (
      unitNoF === k ||
      unitFull === k ||
      normalizeParkingKeyword(x.unitBase) === k ||
      normalizeParkingKeyword(x.door) === k ||
      String(x.owner || "").includes(keyword) ||
      car === k ||
      moto === k ||
      motoParts.includes(k)
    );
  });

  if (!found.length) return `查無車位資料：${keyword}`;

  return found.slice(0, 10).map(x =>
    `🚗【車位查詢結果】
戶別：${x.unit}
門牌：${x.door}
所有權人：${x.owner}
汽車位：${x.car || "無"}
機車位：${x.moto || "無"}`
  ).join("\n\n") + (found.length > 10 ? `\n\n共找到 ${found.length} 筆，請縮小查詢條件。` : "");
}

function normalizeParkingKeyword(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/\s+/g, "")
    .replace(/－/g, "-")
    .replace(/、/g, ",")
    .replace(/，/g, ",")
    .replace(/F$/,"");
}

function expandMotoTokens(moto) {
  if (!moto) return [];
  const text = String(moto).replace(/－/g, "-").replace(/，/g, ",").replace(/、/g, ",");
  const parts = text.split(",").map(s => s.trim()).filter(Boolean);
  const out = [];
  for (const part of parts) {
    out.push(part);
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(x => parseInt(x, 10));
      if (!isNaN(a) && !isNaN(b)) {
        for (let i = Math.min(a,b); i <= Math.max(a,b); i++) out.push(String(i));
      }
    }
  }
  return out;
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
app.listen(port, () => console.log(`Xiamu LINE Bot V9 running on port ${port}`));
