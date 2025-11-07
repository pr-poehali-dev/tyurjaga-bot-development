'''
Business: Telegram бот для игры Тюряга с inline кнопками и полным функционалом
Args: event - dict с httpMethod, body; context - объект с request_id
Returns: HTTP ответ
'''

import json
import os
import urllib.request
import urllib.parse
from typing import Dict, Any

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '8464056351:AAHKV98cm2WT6SNAfHb3uoadnT9ENTweGzw')

PLAYERS_DATA: Dict[int, Dict[str, Any]] = {}

def get_or_create_player(telegram_id: int, username: str) -> Dict[str, Any]:
    if telegram_id not in PLAYERS_DATA:
        PLAYERS_DATA[telegram_id] = {
            'id': telegram_id,
            'username': username,
            'nickname': f'Зэк {username or telegram_id}',
            'level': 1,
            'experience': 0,
            'money': 1000,
            'authority': 0,
            'energy': 100,
            'health': 100,
            'role': 'prisoner',
            'inventory': [
                {'name': 'Сигареты', 'icon': '🚬', 'quantity': 5},
                {'name': 'Чай', 'icon': '🫖', 'quantity': 2}
            ]
        }
    return PLAYERS_DATA[telegram_id]

def send_message(chat_id: int, text: str, reply_markup: Dict = None):
    api_url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {
        'chat_id': chat_id,
        'text': text,
        'parse_mode': 'HTML'
    }
    if reply_markup:
        data['reply_markup'] = json.dumps(reply_markup)
    
    data_encoded = urllib.parse.urlencode(data).encode()
    req = urllib.request.Request(api_url, data=data_encoded)
    urllib.request.urlopen(req)

def get_main_keyboard():
    return {
        'inline_keyboard': [
            [
                {'text': '👤 Профиль', 'callback_data': 'profile'},
                {'text': '📋 Приказы', 'callback_data': 'orders'}
            ],
            [
                {'text': '🎒 Инвентарь', 'callback_data': 'inventory'},
                {'text': '🏪 Магазин', 'callback_data': 'shop'}
            ],
            [
                {'text': '🏆 Рейтинг', 'callback_data': 'leaderboard'},
                {'text': '🎮 Мини-игры', 'callback_data': 'minigames'}
            ]
        ]
    }

def handle_start_command(telegram_id: int, username: str, chat_id: int):
    player = get_or_create_player(telegram_id, username)
    
    text = f"""🎮 <b>Добро пожаловать в "Тюряга"!</b>

👤 <b>{player['nickname']}</b>
{'⛓️ Заключенный' if player['role'] == 'prisoner' else '🛡️ Охрана'}

📊 <b>Статистика:</b>
🎖️ Уровень: <b>{player['level']}</b>
💰 Деньги: <b>{player['money']:,}</b>
🔥 Авторитет: <b>{player['authority']}</b>
⚡ Энергия: <b>{player['energy']}/100</b>
❤️ Здоровье: <b>{player['health']}/100</b>

Выберите действие:"""
    
    send_message(chat_id, text, get_main_keyboard())

def handle_profile_command(telegram_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        send_message(chat_id, "❌ Используйте /start для регистрации")
        return
    
    player = PLAYERS_DATA[telegram_id]
    max_exp = player['level'] * 1000
    
    text = f"""👤 <b>Ваш профиль</b>

<b>{player['nickname']}</b>
{'⛓️ Заключенный' if player['role'] == 'prisoner' else '🛡️ Охрана'}

📊 <b>Характеристики:</b>
🎖️ Уровень: <b>{player['level']}</b>
✨ Опыт: <b>{player['experience']}/{max_exp}</b>
💰 Деньги: <b>{player['money']:,}</b>
🔥 Авторитет: <b>{player['authority']}</b>
⚡ Энергия: <b>{player['energy']}/100</b>
❤️ Здоровье: <b>{player['health']}/100</b>"""
    
    send_message(chat_id, text, get_main_keyboard())

def handle_orders_command(telegram_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        send_message(chat_id, "❌ Используйте /start для регистрации")
        return
    
    orders = [
        {'id': 1, 'title': 'Встать в строй', 'money': 50, 'exp': 10, 'difficulty': '🟢'},
        {'id': 2, 'title': 'Передать нычку', 'money': 150, 'exp': 30, 'difficulty': '🟡'},
        {'id': 3, 'title': 'Спрятаться от обыска', 'money': 200, 'exp': 50, 'difficulty': '🔴'}
    ]
    
    text = "📋 <b>Доступные приказы:</b>\n\n"
    keyboard = []
    
    for order in orders:
        text += f"{order['difficulty']} <b>{order['title']}</b>\n"
        text += f"   💰 +{order['money']} | ⭐ +{order['exp']} XP\n\n"
        keyboard.append([{'text': f"✅ {order['title']}", 'callback_data': f"order_{order['id']}"}])
    
    keyboard.append([{'text': '🔙 Назад', 'callback_data': 'back'}])
    
    send_message(chat_id, text, {'inline_keyboard': keyboard})

def handle_inventory_command(telegram_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        send_message(chat_id, "❌ Используйте /start для регистрации")
        return
    
    player = PLAYERS_DATA[telegram_id]
    inventory = player.get('inventory', [])
    
    if not inventory:
        text = "🎒 <b>Ваш инвентарь пуст</b>"
    else:
        text = "🎒 <b>Ваш инвентарь:</b>\n\n"
        for item in inventory:
            text += f"{item['icon']} <b>{item['name']}</b> x{item['quantity']}\n"
    
    send_message(chat_id, text, get_main_keyboard())

def handle_shop_command(telegram_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        send_message(chat_id, "❌ Используйте /start для регистрации")
        return
    
    player = PLAYERS_DATA[telegram_id]
    
    text = f"🏪 <b>Магазин</b>\n\nВаши деньги: <b>{player['money']:,}</b> 💰\n\n"
    
    items = [
        {'id': 1, 'name': 'Сигареты', 'icon': '🚬', 'price': 10},
        {'id': 2, 'name': 'Чай', 'icon': '🫖', 'price': 50},
        {'id': 3, 'name': 'Телефон', 'icon': '📱', 'price': 500}
    ]
    
    keyboard = []
    for item in items:
        text += f"{item['icon']} <b>{item['name']}</b> - {item['price']} 💰\n"
        keyboard.append([{'text': f"Купить {item['name']}", 'callback_data': f"buy_{item['id']}"}])
    
    keyboard.append([{'text': '🔙 Назад', 'callback_data': 'back'}])
    
    send_message(chat_id, text, {'inline_keyboard': keyboard})

def handle_leaderboard_command(chat_id: int):
    leaderboard = [
        {'name': 'Вор в законе', 'level': 45, 'money': 250000, 'authority': 89},
        {'name': 'Авторитет Макс', 'level': 38, 'money': 180000, 'authority': 72},
        {'name': 'Зэк Петя', 'level': 25, 'money': 95000, 'authority': 45}
    ]
    
    text = "🏆 <b>Таблица лидеров:</b>\n\n"
    
    for i, player in enumerate(leaderboard, 1):
        emoji = '🥇' if i == 1 else '🥈' if i == 2 else '🥉' if i == 3 else f'{i}.'
        text += f"{emoji} <b>{player['name']}</b>\n"
        text += f"   Уровень {player['level']} | {player['money']:,}💰 | {player['authority']}🔥\n\n"
    
    send_message(chat_id, text, get_main_keyboard())

def handle_minigames_command(chat_id: int):
    text = "🎮 <b>Мини-игры:</b>\n\nВыберите игру:"
    
    keyboard = [
        [{'text': '🎯 Прятки', 'callback_data': 'game_priatki'}],
        [{'text': '⚔️ Бунт', 'callback_data': 'game_bunt'}],
        [{'text': '🃏 Карты', 'callback_data': 'game_cards'}],
        [{'text': '🔙 Назад', 'callback_data': 'back'}]
    ]
    
    send_message(chat_id, text, {'inline_keyboard': keyboard})

def handle_complete_order(telegram_id: int, order_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        return
    
    player = PLAYERS_DATA[telegram_id]
    
    rewards = {
        1: {'money': 50, 'exp': 10},
        2: {'money': 150, 'exp': 30},
        3: {'money': 200, 'exp': 50}
    }
    
    reward = rewards.get(order_id, {'money': 50, 'exp': 10})
    
    player['money'] += reward['money']
    player['experience'] += reward['exp']
    
    max_exp = player['level'] * 1000
    if player['experience'] >= max_exp:
        player['level'] += 1
        player['experience'] -= max_exp
        level_up = True
    else:
        level_up = False
    
    text = f"✅ <b>Приказ выполнен!</b>\n\n"
    text += f"Получено:\n💰 +{reward['money']}\n⭐ +{reward['exp']} XP\n"
    if level_up:
        text += f"\n🎉 <b>Новый уровень {player['level']}!</b>"
    
    send_message(chat_id, text, get_main_keyboard())

def handle_buy_item(telegram_id: int, item_id: int, chat_id: int):
    if telegram_id not in PLAYERS_DATA:
        return
    
    player = PLAYERS_DATA[telegram_id]
    
    items = {
        1: {'name': 'Сигареты', 'icon': '🚬', 'price': 10},
        2: {'name': 'Чай', 'icon': '🫖', 'price': 50},
        3: {'name': 'Телефон', 'icon': '📱', 'price': 500}
    }
    
    item = items.get(item_id)
    if not item:
        return
    
    if player['money'] < item['price']:
        send_message(chat_id, f"❌ Недостаточно денег! Нужно {item['price']} 💰", get_main_keyboard())
        return
    
    player['money'] -= item['price']
    
    found = False
    for inv_item in player['inventory']:
        if inv_item['name'] == item['name']:
            inv_item['quantity'] += 1
            found = True
            break
    
    if not found:
        player['inventory'].append({
            'name': item['name'],
            'icon': item['icon'],
            'quantity': 1
        })
    
    text = f"✅ <b>Покупка успешна!</b>\n\n"
    text += f"{item['icon']} {item['name']} добавлен в инвентарь\n"
    text += f"Осталось денег: {player['money']:,} 💰"
    
    send_message(chat_id, text, get_main_keyboard())

def handle_callback(callback_query: Dict[str, Any]):
    data = callback_query.get('data', '')
    telegram_id = callback_query['from']['id']
    username = callback_query['from'].get('username', '')
    chat_id = callback_query['message']['chat']['id']
    
    if data == 'profile':
        handle_profile_command(telegram_id, chat_id)
    elif data == 'orders':
        handle_orders_command(telegram_id, chat_id)
    elif data == 'inventory':
        handle_inventory_command(telegram_id, chat_id)
    elif data == 'shop':
        handle_shop_command(telegram_id, chat_id)
    elif data == 'leaderboard':
        handle_leaderboard_command(chat_id)
    elif data == 'minigames':
        handle_minigames_command(chat_id)
    elif data == 'back':
        handle_start_command(telegram_id, username, chat_id)
    elif data.startswith('order_'):
        order_id = int(data.split('_')[1])
        handle_complete_order(telegram_id, order_id, chat_id)
    elif data.startswith('buy_'):
        item_id = int(data.split('_')[1])
        handle_buy_item(telegram_id, item_id, chat_id)
    elif data.startswith('game_'):
        game_type = data.split('_')[1]
        import random
        won = random.random() > 0.4
        if won:
            reward = 300 if game_type == 'bunt' else 200
            text = f"🎉 <b>Победа!</b>\n\nПолучено: {reward} 💰"
        else:
            text = "😔 <b>Проигрыш!</b>\n\nПопробуйте еще раз!"
        send_message(chat_id, text, get_main_keyboard())

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
    
    if method == 'GET':
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'status': 'Bot is running'})
        }
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            
            if 'callback_query' in body:
                handle_callback(body['callback_query'])
            elif 'message' in body:
                message = body['message']
                telegram_id = message.get('from', {}).get('id')
                username = message.get('from', {}).get('username', '')
                text = message.get('text', '').strip()
                chat_id = message.get('chat', {}).get('id')
                
                if not telegram_id or not text:
                    return {
                        'statusCode': 200,
                        'headers': {'Content-Type': 'application/json'},
                        'body': json.dumps({'ok': True})
                    }
                
                if text == '/start':
                    handle_start_command(telegram_id, username, chat_id)
                elif text == '/profile':
                    handle_profile_command(telegram_id, chat_id)
                elif text == '/orders':
                    handle_orders_command(telegram_id, chat_id)
                elif text == '/inventory':
                    handle_inventory_command(telegram_id, chat_id)
                elif text == '/shop':
                    handle_shop_command(telegram_id, chat_id)
                elif text == '/leaderboard':
                    handle_leaderboard_command(chat_id)
                elif text == '/help':
                    text_msg = """📖 <b>Помощь по игре "Тюряга"</b>

🎮 <b>Команды:</b>
/start - Начать игру
/profile - Ваш профиль
/orders - Приказы
/inventory - Инвентарь
/shop - Магазин
/leaderboard - Рейтинг

🎯 <b>Как играть:</b>
1. Выполняйте приказы → получайте 💰 и ⭐
2. Покупайте предметы в магазине
3. Повышайте уровень и авторитет
4. Соревнуйтесь с другими игроками!"""
                    send_message(chat_id, text_msg, get_main_keyboard())
                else:
                    send_message(chat_id, "❓ Неизвестная команда. Используйте /help", get_main_keyboard())
            
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
