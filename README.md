# 遠雄夏沐物業 LINE Bot A版

功能：
- 保全輸入回報
- Bot 自動同步推播給經理
- 支援：報修、休息離哨、上哨、異常事件、交接回報

## LINE 使用方式

保全輸入：

異常事件 B1車道住戶臨停爭議

經理會收到：

【異常事件】
人員：保全LINE名稱
時間：目前時間
內容：異常事件 B1車道住戶臨停爭議

## Render 環境變數

CHANNEL_SECRET=你的 LINE Channel Secret
CHANNEL_ACCESS_TOKEN=你的 LINE Channel Access Token
MANAGER_USER_ID=經理的 LINE User ID

## Webhook URL

部署完成後，在 LINE Developers 填：

https://你的render網址.onrender.com/webhook

並開啟 Use webhook。
