'''
Business: Полный Telegram бот Тюряга с боссами, нычками, наколками, двором
Args: event, context
Returns: HTTP response
'''

import json
import os
import urllib.request
import urllib.parse
import random
from typing import Dict, Any

BOT_TOKEN = os.environ.get('TELEGRAM_BOT_TOKEN', '8464056351:AAHKV98cm2WT6SNAfHb3uoadnT9ENTweGzw')
PLAYERS: Dict[int, Dict[str, Any]] = {}

BOSSES = [
    {'id': 1, 'name': 'Главарь', 'level': 10, 'health': 1000, 'max': 1000, 'attack': 150, 'reward': 1000, 'icon': '💪'},
    {'id': 2, 'name': 'Смотрящий', 'level': 25, 'health': 2500, 'max': 2500, 'attack': 300, 'reward': 2500, 'icon': '👁️'},
    {'id': 3, 'name': 'Вор', 'level': 50, 'health': 5000, 'max': 5000, 'attack': 500, 'reward': 5000, 'icon': '👑'},
]

NYCHKI = [
    {'id': 1, 'name': 'Ложка', 'rarity': 'common', 'icon': '🥄', 'value': 10},
    {'id': 2, 'name': 'Часы', 'rarity': 'rare', 'icon': '⌚', 'value': 50},
    {'id': 3, 'name': 'Телефон', 'rarity': 'rare', 'icon': '📱', 'value': 100},
    {'id': 4, 'name': 'Заточка', 'rarity': 'epic', 'icon': '🔪', 'value': 200},
    {'id': 5, 'name': 'Ключи', 'rarity': 'legendary', 'icon': '🗝️', 'value': 500},
]

TATTOOS = [
    {'id': 1, 'name': 'Звезды', 'price': 500, 'auth': 5, 'icon': '⭐', 'level': 5},
    {'id': 2, 'name': 'Тигр', 'price': 1000, 'auth': 10, 'icon': '🐯', 'level': 10},
    {'id': 3, 'name': 'Купола', 'price': 1500, 'auth': 15, 'icon': '⛪', 'level': 15},
]

YARD = [
    {'id': 1, 'name': 'Качалка', 'energy': 20, 'money': 50, 'exp': 20, 'icon': '💪'},
    {'id': 2, 'name': 'Карты', 'energy': 15, 'money': 150, 'exp': 30, 'icon': '🎴'},
    {'id': 3, 'name': 'Торговля', 'energy': 10, 'money': 200, 'exp': 15, 'icon': '💼'},
    {'id': 4, 'name': 'Драка', 'energy': 30, 'money': 100, 'exp': 50, 'icon': '👊'},
]

def get_rep(auth: int) -> str:
    if auth >= 150: return 'Вор в законе 👑'
    if auth >= 100: return 'Блатной 💎'
    if auth >= 75: return 'Козырный 🎴'
    if auth >= 50: return 'Шерстяной 🧥'
    if auth >= 25: return 'Бродяга 🎒'
    if auth >= 10: return 'Мужик 👤'
    return 'Петух 🐔'

def get_player(tid: int, user: str) -> Dict[str, Any]:
    if tid not in PLAYERS:
        PLAYERS[tid] = {
            'name': f'Зэк {user or tid}',
            'level': 1, 'exp': 0, 'money': 1000,
            'auth': 0, 'energy': 100, 'health': 100,
            'attack': 50, 'defense': 30,
            'nychki': [], 'tattoos': [],
            'boss_hp': {b['id']: b['max'] for b in BOSSES}
        }
    return PLAYERS[tid]

def send(cid: int, text: str, kb: Dict = None):
    url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
    data = {'chat_id': cid, 'text': text, 'parse_mode': 'HTML'}
    if kb:
        data['reply_markup'] = json.dumps(kb)
    try:
        req = urllib.request.Request(url, urllib.parse.urlencode(data).encode())
        urllib.request.urlopen(req)
    except:
        pass

def main_kb():
    return {
        'inline_keyboard': [
            [{'text': '👤 Профиль', 'callback_data': 'prof'}, {'text': '📋 Приказы', 'callback_data': 'ord'}],
            [{'text': '💪 Боссы', 'callback_data': 'boss'}, {'text': '📦 Нычки', 'callback_data': 'nych'}],
            [{'text': '⭐ Наколки', 'callback_data': 'tatt'}, {'text': '🏃 Двор', 'callback_data': 'yard'}],
            [{'text': '🏆 Рейтинг', 'callback_data': 'rate'}]
        ]
    }

def start(tid: int, user: str, cid: int):
    p = get_player(tid, user)
    t = f"""🎮 <b>ТЮРЯГА</b>

👤 {p['name']}
{get_rep(p['auth'])}

🎖️ Ур: {p['level']} | 💰 {p['money']:,}
🔥 Авт: {p['auth']} | ⚡ {p['energy']}/100
❤️ HP: {p['health']}/100
⚔️ Атк: {p['attack']} | 🛡️ Защ: {p['defense']}"""
    send(cid, t, main_kb())

def prof(tid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return send(cid, "❌ /start")
    t = f"""👤 <b>ПРОФИЛЬ</b>

{p['name']}
{get_rep(p['auth'])}

🎖️ Ур: {p['level']} | ✨ {p['exp']}/{p['level']*1000}
💰 {p['money']:,} | 🔥 {p['auth']}
⚡ {p['energy']}/100 | ❤️ {p['health']}/100
⚔️ {p['attack']} | 🛡️ {p['defense']}

📦 Нычек: {len(p['nychki'])}/5
⭐ Наколок: {len(p['tattoos'])}/3"""
    send(cid, t, main_kb())

def bosses(tid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    t = "💪 <b>БОССЫ</b>\n\n"
    kb = []
    for b in BOSSES:
        hp = p['boss_hp'][b['id']]
        t += f"{b['icon']} {b['name']} (Ур.{b['level']})\n❤️ {hp}/{b['max']} | 💰 {b['reward']}\n\n"
        if hp > 0 and p['energy'] >= 30:
            kb.append([{'text': f"⚔️ {b['name']} (30⚡)", 'callback_data': f"b_{b['id']}"}])
    kb.append([{'text': '🔙', 'callback_data': 'back'}])
    send(cid, t, {'inline_keyboard': kb})

def atk_boss(tid: int, bid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p or p['energy'] < 30: return
    b = next((x for x in BOSSES if x['id'] == bid), None)
    if not b: return
    
    hp = p['boss_hp'][bid]
    dmg = max(p['attack'] - 50, 20)
    new_hp = max(hp - dmg, 0)
    
    p['boss_hp'][bid] = new_hp
    p['energy'] -= 30
    
    if new_hp == 0:
        p['money'] += b['reward']
        p['exp'] += b['reward'] // 2
        p['auth'] += 5
        
        if p['exp'] >= p['level'] * 1000:
            p['level'] += 1
            p['exp'] -= (p['level']-1) * 1000
            lvl = True
        else:
            lvl = False
        
        t = f"🎉 <b>ПОБЕДА!</b>\n\n{b['icon']} {b['name']}\n💰 +{b['reward']}\n⭐ +{b['reward']//2}\n🔥 +5"
        if lvl: t += f"\n🎊 Ур.{p['level']}!"
        
        p['boss_hp'][bid] = b['max']
    else:
        t = f"💥 -{dmg}\n{b['icon']} {b['name']}\n❤️ {new_hp}/{b['max']}"
    
    send(cid, t, main_kb())

def nychki(tid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    t = "📦 <b>НЫЧКИ</b>\n\n"
    kb = []
    for n in NYCHKI:
        ok = n['id'] in p['nychki']
        st = "✅" if ok else "🔍"
        t += f"{st} {n['icon']} {n['name']} ({n['rarity']})\n💰 {n['value']}\n\n"
        if not ok:
            kb.append([{'text': f"🔍 {n['name']}", 'callback_data': f"n_{n['id']}"}])
    kb.append([{'text': '🔙', 'callback_data': 'back'}])
    send(cid, t, {'inline_keyboard': kb})

def get_nych(tid: int, nid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    n = next((x for x in NYCHKI if x['id'] == nid), None)
    if not n or nid in p['nychki']: return
    
    ch = {'legendary': 0.05, 'epic': 0.2, 'rare': 0.4, 'common': 0.6}.get(n['rarity'], 0.5)
    
    if random.random() < ch:
        p['nychki'].append(nid)
        p['money'] += n['value']
        p['auth'] += 2
        t = f"✅ <b>НАЙДЕНО!</b>\n\n{n['icon']} {n['name']}\n💰 +{n['value']}\n🔥 +2"
    else:
        t = f"❌ Не повезло с {n['name']}"
    
    send(cid, t, main_kb())

def tatts(tid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    t = "⭐ <b>НАКОЛКИ</b>\n\n"
    kb = []
    for tt in TATTOOS:
        ok = tt['id'] in p['tattoos']
        st = "✅" if ok else "💉"
        t += f"{st} {tt['icon']} {tt['name']}\nУр.{tt['level']} | 💰 {tt['price']} | 🔥 +{tt['auth']}\n\n"
        if not ok and p['level'] >= tt['level'] and p['money'] >= tt['price']:
            kb.append([{'text': f"💉 {tt['name']} ({tt['price']}💰)", 'callback_data': f"t_{tt['id']}"}])
    kb.append([{'text': '🔙', 'callback_data': 'back'}])
    send(cid, t, {'inline_keyboard': kb})

def buy_tatt(tid: int, ttid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    tt = next((x for x in TATTOOS if x['id'] == ttid), None)
    if not tt or ttid in p['tattoos']: return
    if p['level'] < tt['level'] or p['money'] < tt['price']: return
    
    p['tattoos'].append(ttid)
    p['money'] -= tt['price']
    p['auth'] += tt['auth']
    
    t = f"✅ <b>НАБИТО!</b>\n\n{tt['icon']} {tt['name']}\n🔥 +{tt['auth']}\n\n{get_rep(p['auth'])}"
    send(cid, t, main_kb())

def yard_menu(tid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    t = "🏃 <b>ДВОР</b>\n\n"
    kb = []
    for y in YARD:
        t += f"{y['icon']} {y['name']}\n⚡ {y['energy']} | 💰 {y['money']} | ⭐ {y['exp']}\n\n"
        if p['energy'] >= y['energy']:
            kb.append([{'text': f"{y['icon']} {y['name']} ({y['energy']}⚡)", 'callback_data': f"y_{y['id']}"}])
    kb.append([{'text': '🔙', 'callback_data': 'back'}])
    send(cid, t, {'inline_keyboard': kb})

def do_yard(tid: int, yid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    y = next((x for x in YARD if x['id'] == yid), None)
    if not y or p['energy'] < y['energy']: return
    
    p['energy'] -= y['energy']
    
    if random.random() > 0.3:
        p['money'] += y['money']
        p['exp'] += y['exp']
        
        lvl = False
        if p['exp'] >= p['level'] * 1000:
            p['level'] += 1
            p['exp'] -= (p['level']-1) * 1000
            lvl = True
        
        t = f"✅ <b>УСПЕХ!</b>\n\n{y['icon']} {y['name']}\n💰 +{y['money']}\n⭐ +{y['exp']}"
        if lvl: t += f"\n🎊 Ур.{p['level']}!"
    else:
        t = f"❌ Неудача в {y['name']}"
    
    send(cid, t, main_kb())

def orders(tid: int, cid: int):
    t = "📋 <b>ПРИКАЗЫ</b>\n\n🟢 Строй: 💰 50 ⭐ 10\n🟡 Нычка: 💰 150 ⭐ 30\n🔴 Спрятаться: 💰 200 ⭐ 50"
    kb = [
        [{'text': '✅ Строй', 'callback_data': 'o_1'}],
        [{'text': '✅ Нычка', 'callback_data': 'o_2'}],
        [{'text': '✅ Спрятаться', 'callback_data': 'o_3'}],
        [{'text': '🔙', 'callback_data': 'back'}]
    ]
    send(cid, t, {'inline_keyboard': kb})

def do_order(tid: int, oid: int, cid: int):
    p = PLAYERS.get(tid)
    if not p: return
    r = {1: (50, 10), 2: (150, 30), 3: (200, 50)}.get(oid, (50, 10))
    
    p['money'] += r[0]
    p['exp'] += r[1]
    
    lvl = False
    if p['exp'] >= p['level'] * 1000:
        p['level'] += 1
        p['exp'] -= (p['level']-1) * 1000
        lvl = True
    
    t = f"✅ <b>ВЫПОЛНЕНО!</b>\n\n💰 +{r[0]}\n⭐ +{r[1]}"
    if lvl: t += f"\n🎊 Ур.{p['level']}!"
    
    send(cid, t, main_kb())

def rate(cid: int):
    if not PLAYERS:
        return send(cid, "Рейтинг пуст", main_kb())
    
    top = sorted(PLAYERS.values(), key=lambda x: (x['level'], x['money']), reverse=True)[:10]
    t = "🏆 <b>РЕЙТИНГ</b>\n\n"
    for i, p in enumerate(top, 1):
        e = '🥇' if i == 1 else '🥈' if i == 2 else '🥉' if i == 3 else f'{i}.'
        t += f"{e} {p['name']}\nУр.{p['level']} | {p['money']:,}💰 | {p['auth']}🔥\n\n"
    send(cid, t, main_kb())

def callback(cb: Dict[str, Any]):
    d = cb.get('data', '')
    tid = cb['from']['id']
    user = cb['from'].get('username', '')
    cid = cb['message']['chat']['id']
    
    if d == 'back': start(tid, user, cid)
    elif d == 'prof': prof(tid, cid)
    elif d == 'boss': bosses(tid, cid)
    elif d.startswith('b_'): atk_boss(tid, int(d[2:]), cid)
    elif d == 'nych': nychki(tid, cid)
    elif d.startswith('n_'): get_nych(tid, int(d[2:]), cid)
    elif d == 'tatt': tatts(tid, cid)
    elif d.startswith('t_'): buy_tatt(tid, int(d[2:]), cid)
    elif d == 'yard': yard_menu(tid, cid)
    elif d.startswith('y_'): do_yard(tid, int(d[2:]), cid)
    elif d == 'ord': orders(tid, cid)
    elif d.startswith('o_'): do_order(tid, int(d[2:]), cid)
    elif d == 'rate': rate(cid)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method = event.get('httpMethod', 'POST')
    
    if method == 'OPTIONS':
        return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type'}, 'body': ''}
    
    if method == 'GET':
        return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'status': 'ok', 'players': len(PLAYERS)})}
    
    if method == 'POST':
        try:
            body = json.loads(event.get('body', '{}'))
            
            if 'callback_query' in body:
                callback(body['callback_query'])
            elif 'message' in body:
                msg = body['message']
                tid = msg.get('from', {}).get('id')
                user = msg.get('from', {}).get('username', '')
                text = msg.get('text', '').strip()
                cid = msg.get('chat', {}).get('id')
                
                if tid and text:
                    if text == '/start': start(tid, user, cid)
                    elif text == '/profile': prof(tid, cid)
                    elif text == '/help':
                        send(cid, "📖 <b>ПОМОЩЬ</b>\n\n/start - Меню\n/profile - Профиль\n\n🎯 Побеждай боссов, собирай нычки, набивай наколки!", main_kb())
            
            return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}
        except Exception as e:
            return {'statusCode': 500, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'error': str(e)})}
    
    return {'statusCode': 200, 'headers': {'Content-Type': 'application/json'}, 'body': json.dumps({'status': 'ok'})}
