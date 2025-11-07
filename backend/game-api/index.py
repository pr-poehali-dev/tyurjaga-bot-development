'''
Business: API для игры Тюряга - получение и обновление данных игроков
Args: event - dict с httpMethod, body, queryStringParameters; context - объект с request_id
Returns: HTTP ответ с данными игрока, приказами, инвентарем
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    """Подключение к базе данных"""
    dsn = os.environ.get('DATABASE_URL')
    return psycopg2.connect(dsn)

def get_player_by_id(player_id: int) -> Dict[str, Any]:
    """Получить игрока по ID"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM players WHERE id = %s", (player_id,))
    player = cur.fetchone()
    
    cur.close()
    conn.close()
    return dict(player) if player else None

def get_all_items() -> List[Dict[str, Any]]:
    """Получить все предметы"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM items ORDER BY type, price")
    items = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(item) for item in items]

def get_player_inventory(player_id: int) -> List[Dict[str, Any]]:
    """Получить инвентарь игрока"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT i.*, it.name, it.icon, it.type, it.description
           FROM inventory i
           JOIN items it ON i.item_id = it.id
           WHERE i.player_id = %s""",
        (player_id,)
    )
    inventory = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(item) for item in inventory]

def get_active_orders_for_player(player_id: int) -> List[Dict[str, Any]]:
    """Получить активные приказы для игрока"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT level FROM players WHERE id = %s", (player_id,))
    player_data = cur.fetchone()
    
    if not player_data:
        cur.close()
        conn.close()
        return []
    
    cur.execute(
        """SELECT * FROM orders 
           WHERE active = TRUE AND required_level <= %s 
           ORDER BY difficulty, reward_money DESC
           LIMIT 10""",
        (player_data['level'],)
    )
    orders = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(order) for order in orders]

def buy_item(player_id: int, item_id: int) -> Dict[str, Any]:
    """Купить предмет"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM items WHERE id = %s", (item_id,))
    item = cur.fetchone()
    
    cur.execute("SELECT * FROM players WHERE id = %s", (player_id,))
    player = cur.fetchone()
    
    if not item or not player:
        cur.close()
        conn.close()
        return {'success': False, 'error': 'Предмет или игрок не найден'}
    
    if player['money'] < item['price']:
        cur.close()
        conn.close()
        return {'success': False, 'error': 'Недостаточно денег'}
    
    cur.execute(
        """INSERT INTO inventory (player_id, item_id, quantity)
           VALUES (%s, %s, 1)
           ON CONFLICT (player_id, item_id) 
           DO UPDATE SET quantity = inventory.quantity + 1""",
        (player_id, item_id)
    )
    
    cur.execute(
        "UPDATE players SET money = money - %s WHERE id = %s",
        (item['price'], player_id)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {'success': True, 'message': f'Куплено: {item["name"]}'}

def use_item(player_id: int, item_id: int) -> Dict[str, Any]:
    """Использовать предмет"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT i.*, it.effect_type, it.effect_value
           FROM inventory i
           JOIN items it ON i.item_id = it.id
           WHERE i.player_id = %s AND i.item_id = %s""",
        (player_id, item_id)
    )
    inventory_item = cur.fetchone()
    
    if not inventory_item or inventory_item['quantity'] < 1:
        cur.close()
        conn.close()
        return {'success': False, 'error': 'Предмет не найден в инвентаре'}
    
    effect_type = inventory_item['effect_type']
    effect_value = inventory_item['effect_value']
    
    if effect_type == 'health':
        cur.execute(
            "UPDATE players SET health = LEAST(health + %s, 100) WHERE id = %s",
            (effect_value, player_id)
        )
    elif effect_type == 'energy':
        cur.execute(
            "UPDATE players SET energy = LEAST(energy + %s, 100) WHERE id = %s",
            (effect_value, player_id)
        )
    elif effect_type == 'authority':
        cur.execute(
            "UPDATE players SET authority = authority + %s WHERE id = %s",
            (effect_value, player_id)
        )
    
    cur.execute(
        """UPDATE inventory SET quantity = quantity - 1 
           WHERE player_id = %s AND item_id = %s""",
        (player_id, item_id)
    )
    
    cur.execute(
        "DELETE FROM inventory WHERE quantity <= 0"
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {'success': True, 'effect': effect_type, 'value': effect_value}

def complete_order(player_id: int, order_id: int) -> Dict[str, Any]:
    """Завершить приказ"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute("SELECT * FROM orders WHERE id = %s", (order_id,))
    order = cur.fetchone()
    
    if not order:
        cur.close()
        conn.close()
        return {'success': False, 'error': 'Приказ не найден'}
    
    cur.execute(
        """UPDATE players 
           SET money = money + %s, 
               experience = experience + %s,
               level = CASE 
                   WHEN experience + %s >= level * 1000 THEN level + 1 
                   ELSE level 
               END
           WHERE id = %s
           RETURNING *""",
        (order['reward_money'], order['reward_exp'], order['reward_exp'], player_id)
    )
    
    updated_player = cur.fetchone()
    
    cur.execute(
        """INSERT INTO player_orders (player_id, order_id, status, completed_at, reward_claimed)
           VALUES (%s, %s, 'completed', CURRENT_TIMESTAMP, TRUE)""",
        (player_id, order_id)
    )
    
    conn.commit()
    cur.close()
    conn.close()
    
    return {
        'success': True,
        'reward': {
            'money': order['reward_money'],
            'exp': order['reward_exp']
        },
        'player': dict(updated_player)
    }

def get_leaderboard(limit: int = 10) -> List[Dict[str, Any]]:
    """Получить таблицу лидеров"""
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    cur.execute(
        """SELECT nickname, level, money, authority, experience
           FROM players
           ORDER BY level DESC, experience DESC
           LIMIT %s""",
        (limit,)
    )
    leaderboard = cur.fetchall()
    
    cur.close()
    conn.close()
    return [dict(player) for player in leaderboard]

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    path: str = event.get('path', '/')
    
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
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters', {}) or {}
            action = params.get('action', '')
            
            if action == 'player':
                player_id = int(params.get('player_id', 1))
                player = get_player_by_id(player_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'player': player})
                }
            
            elif action == 'inventory':
                player_id = int(params.get('player_id', 1))
                inventory = get_player_inventory(player_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'inventory': inventory})
                }
            
            elif action == 'orders':
                player_id = int(params.get('player_id', 1))
                orders = get_active_orders_for_player(player_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'orders': orders})
                }
            
            elif action == 'items':
                items = get_all_items()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'items': items})
                }
            
            elif action == 'leaderboard':
                leaderboard = get_leaderboard()
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps({'leaderboard': leaderboard})
                }
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            action = body.get('action', '')
            
            if action == 'buy_item':
                player_id = body.get('player_id')
                item_id = body.get('item_id')
                result = buy_item(player_id, item_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result)
                }
            
            elif action == 'use_item':
                player_id = body.get('player_id')
                item_id = body.get('item_id')
                result = use_item(player_id, item_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result)
                }
            
            elif action == 'complete_order':
                player_id = body.get('player_id')
                order_id = body.get('order_id')
                result = complete_order(player_id, order_id)
                return {
                    'statusCode': 200,
                    'headers': {
                        'Content-Type': 'application/json',
                        'Access-Control-Allow-Origin': '*'
                    },
                    'body': json.dumps(result)
                }
        
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid action'})
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)})
        }
