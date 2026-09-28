import logging
import requests
from typing import Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class TelegramService:
    def __init__(self, bot_token: Optional[str] = None, default_chat_id: Optional[str] = None):
        self.bot_token = bot_token or settings.TELEGRAM_BOT_TOKEN
        self.default_chat_id = default_chat_id or settings.TELEGRAM_CHAT_ID

    def send_message(self, message: str, chat_id: Optional[str] = None) -> bool:
        """
        Sends an instant notification to a business's Telegram channel or group.
        Falls back to safe logging if token is not configured or mock.
        """
        target_chat_id = chat_id or self.default_chat_id
        if not self.bot_token or self.bot_token.startswith("mock_") or not target_chat_id:
            logger.info(f"[Telegram Mock Service] Message dispatched to {target_chat_id}:\n{message}")
            return True

        url = f"https://api.telegram.org/bot{self.bot_token}/sendMessage"
        payload = {
            "chat_id": target_chat_id,
            "text": message,
            "parse_mode": "HTML"
        }
        try:
            resp = requests.post(url, json=payload, timeout=5)
            return resp.status_code == 200
        except Exception as e:
            logger.error(f"Failed to deliver Telegram notification: {e}")
            return False

    def notify_new_sale(self, invoice_number: str, total_usd: float, total_khr: float, items_count: int, business_name: str, chat_id: Optional[str] = None):
        msg = (
            f"🛒 <b>New Sale Completed</b>\n"
            f"🏪 <b>Business:</b> {business_name}\n"
            f"🧾 <b>Invoice:</b> #{invoice_number}\n"
            f"📦 <b>Items:</b> {items_count}\n"
            f"💵 <b>Total:</b> ${total_usd:.2f} (៛{total_khr:,.0f})\n"
            f"⏰ <b>Status:</b> Paid"
        )
        return self.send_message(msg, chat_id)

    def notify_low_stock(self, product_name: str, sku: str, current_stock: float, min_stock: float, warehouse: str, chat_id: Optional[str] = None):
        msg = (
            f"⚠️ <b>Low Stock Alert!</b>\n"
            f"📦 <b>Product:</b> {product_name} ({sku})\n"
            f"🏢 <b>Warehouse:</b> {warehouse}\n"
            f"📉 <b>Remaining:</b> {current_stock} (Min: {min_stock})\n"
            f"👉 <i>Please replenish inventory promptly.</i>"
        )
        return self.send_message(msg, chat_id)

telegram_service = TelegramService()
