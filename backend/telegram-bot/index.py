'''
Business: Telegram бот для игры Тюряга - обработка команд и взаимодействие с игроками
Args: event - dict с httpMethod, body, headers; context - объект с request_id
Returns: HTTP ответ с statusCode, headers, body
'''

import json
import os
from typing import Dict, Any, Optional
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def get_or_create_player(telegram_id: int, username: str) -> Dict[str, Any]:
    """Получить или создать игрока"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        "SELECT * FROM players WHERE telegram_id = %s",
        (telegram_id,)
    )
    player = cur.fetchone()
    
    if not player:
        nickname = f"Зэк {username or telegram_id}"
        cur.execute(
            """INSERT INTO players (telegram_id, username, nickname) 
               VALUES (%s, %s, %s) RETURNING *""",
            (telegram_id, username, nickname)
        )
        player = cur.fetchone()
        conn.commit()
    
    cur.close()
    conn.close()
    return dict(player)

def get_player_inventory(player_id: int) -> list:
    """Получить инвентарь игрока"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT i.*, it.name, it.icon, it.type 
           FROM inventory i
           JOIN items it ON i.item_id = it.id
           WHERE i.player_id = %s""",
        (player_id,)
    )
    inventory = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(item) for item in inventory]

def get_active_orders(player_level: int) -> list:
    """Получить активные приказы для уровня игрока"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT * FROM orders 
           WHERE active = TRUE AND required_level <= %s 
           ORDER BY difficulty, reward_money DESC
           LIMIT 5""",
        (player_level,)
    )
    orders = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(order) for order in orders]

def start_order(player_id: int, order_id: int) -> Dict[str, Any]:
    """Начать выполнение приказа"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """INSERT INTO player_orders (player_id, order_id, status)
           VALUES (%s, %s, 'active') RETURNING *""",
        (player_id, order_id)
    )
    player_order = cur.fetchone()
    conn.commit()
    
    cur.close()
    conn.close()
    return dict(player_order)

def complete_order(player_id: int, order_id: int) -> Dict[str, Any]:
    """Завершить выполнение приказа и выдать награду"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT o.reward_money, o.reward_exp, po.id
           FROM player_orders po
           JOIN orders o ON po.order_id = o.id
           WHERE po.player_id = %s AND po.order_id = %s AND po.status = 'active'""",
        (player_id, order_id)
    )
    order_data = cur.fetchone()
    
    if not order_data:
        cur.close()
        conn.close()
        return {'success': False, 'error': 'Приказ не найден'}
    
    cur.execute(
        """UPDATE players 
           SET money = money + %s, experience = experience + %s
           WHERE id = %s""",
        (order_data['reward_money'], order_data['reward_exp'], player_id)
    )
    
    cur.execute(
        """UPDATE player_orders 
           SET status = 'completed', completed_at = CURRENT_TIMESTAMP, reward_claimed = TRUE
           WHERE id = %s""",
        (order_data['id'],)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'success': True,
        'money': order_data['reward_money'],
        'exp': order_data['reward_exp']
    }

def format_player_stats(player: Dict[str, Any]) -> str:
    """Форматировать статистику игрока"""
    return f"""
👤 {player['nickname']}
{'⛓️ Заключенный' if player['role'] == 'prisoner' else '🛡️ Охрана'}

📊 Статистика:
🎖️ Уровень: {player['level']}
💰 Деньги: {player['money']:,}
🔥 Авторитет: {player['authority']}
⚡ Энергия: {player['energy']}/100
❤️ Здоровье: {player['health']}/100
✨ Опыт: {player['experience']:,}
"""

def handle_start_command(telegram_id: int, username: str) -> str:
    """Обработка команды /start"""
    player = get_or_create_player(telegram_id, username)
    
    return f"""🎮 Добро пожаловать в игру "Тюряга"! 

{format_player_stats(player)}

📋 Доступные команды:
/profile - Ваш профиль
/orders - Доступные приказы
/inventory - Ваш инвентарь
/play - Открыть игру в браузере
/help - Помощь

🎯 Играйте прямо в Telegram или откройте полную версию в браузере!
"""

def handle_profile_command(telegram_id: int) -> str:
    """Обработка команды /profile"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        "SELECT * FROM players WHERE telegram_id = %s",
        (telegram_id,)
    )
    player = cur.fetchone()
    
    cur.close()
    conn.close()
    
    if not player:
        return "❌ Игрок не найден. Используйте /start для регистрации."
    
    return format_player_stats(dict(player))

def handle_orders_command(telegram_id: int) -> str:
    """Обработка команды /orders"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        "SELECT * FROM players WHERE telegram_id = %s",
        (telegram_id,)
    )
    player = cur.fetchone()
    
    if not player:
        cur.close()
        conn.close()
        return "❌ Игрок не найден. Используйте /start для регистрации."
    
    orders = get_active_orders(player['level'])
    cur.close()
    conn.close()
    
    if not orders:
        return "📋 Нет доступных приказов"
    
    result = "📋 Доступные приказы:\n\n"
    difficulty_emoji = {'easy': '🟢', 'medium': '🟡', 'hard': '🔴'}
    
    for order in orders:
        result += f"{difficulty_emoji.get(order['difficulty'], '⚪')} {order['title']}\n"
        result += f"   {order['description']}\n"
        result += f"   💰 +{order['reward_money']} ⭐ +{order['reward_exp']} XP\n"
        result += f"   /order_{order['id']}\n\n"
    
    return result

def handle_inventory_command(telegram_id: int) -> str:
    """Обработка команды /inventory"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        "SELECT * FROM players WHERE telegram_id = %s",
        (telegram_id,)
    )
    player = cur.fetchone()
    
    if not player:
        cur.close()
        conn.close()
        return "❌ Игрок не найден. Используйте /start для регистрации."
    
    inventory = get_player_inventory(player['id'])
    cur.close()
    conn.close()
    
    if not inventory:
        return "🎒 Ваш инвентарь пуст"
    
    result = "🎒 Ваш инвентарь:\n\n"
    for item in inventory:
        result += f"{item['icon']} {item['name']} x{item['quantity']}\n"
    
    return result

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            update = body.get('message', {})
            
            telegram_id = update.get('from', {}).get('id')
            username = update.get('from', {}).get('username', '')
            text = update.get('text', '').strip()
            chat_id = update.get('chat', {}).get('id')
            
            if not telegram_id or not text:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'ok': True})
                }
            
            response_text = ""
            
            if text == '/start':
                response_text = handle_start_command(telegram_id, username)
            elif text == '/profile':
                response_text = handle_profile_command(telegram_id)
            elif text == '/orders':
                response_text = handle_orders_command(telegram_id)
            elif text == '/inventory':
                response_text = handle_inventory_command(telegram_id)
            elif text == '/help':
                response_text = """
📖 Помощь по игре "Тюряга"

🎮 Основные команды:
/start - Начать игру
/profile - Ваш профиль
/orders - Список приказов
/inventory - Ваш инвентарь
/play - Открыть игру

🎯 Как играть:
1. Выполняйте приказы для получения денег и опыта
2. Покупайте предметы в магазине
3. Повышайте свой авторитет
4. Создавайте кланы и соревнуйтесь с другими игроками
"""
            elif text.startswith('/order_'):
                try:
                    order_id = int(text.split('_')[1])
                    conn = get_db_connection()
                    cur = conn.cursor(cursor_factory=RealDictCursor)
                    cur.execute("SELECT id FROM players WHERE telegram_id = %s", (telegram_id,))
                    player = cur.fetchone()
                    cur.close()
                    conn.close()
                    
                    if player:
                        result = start_order(player['id'], order_id)
                        response_text = "✅ Приказ принят! Выполните его и используйте /complete для получения награды."
                    else:
                        response_text = "❌ Используйте /start для начала игры"
                except:
                    response_text = "❌ Неверная команда"
            else:
                response_text = "❓ Неизвестная команда. Используйте /help для списка команд."
            
            bot_token = os.environ.get('TELEGRAM_BOT_TOKEN')
            
            import urllib.request
            import urllib.parse
            
            api_url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            data = urllib.parse.urlencode({
                'chat_id': chat_id,
                'text': response_text,
                'parse_mode': 'HTML'
            }).encode()
            
            req = urllib.request.Request(api_url, data=data)
            urllib.request.urlopen(req)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'ok': True})
            }
            
        except Exception as e:
            return {
                'statusCode': 500,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)})
            }
    
    return {
        'statusCode': 200,
        'headers': {'Content-Type': 'application/json'},
        'body': json.dumps({'status': 'ok'})
    }
