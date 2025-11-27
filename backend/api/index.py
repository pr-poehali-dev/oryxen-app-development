import json
import os
import psycopg2
import jwt
from typing import Dict, Any, Optional

def verify_auth(event: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    headers = event.get('headers', {})
    token = headers.get('x-auth-token') or headers.get('X-Auth-Token')
    
    if not token:
        return None
    
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    if not secret or secret == 'None':
        secret = 'default-secret-key'
    decoded = jwt.decode(token, str(secret), algorithms=['HS256'])
    return decoded

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: API for servers, channels, messages and voice sessions
    Args: event with httpMethod, body, queryStringParameters
    Returns: HTTP response with requested data
    '''
    method = event.get('httpMethod', 'GET')
    path = event.get('queryStringParameters', {}).get('path', '')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    user = verify_auth(event)
    if not user:
        return {
            'statusCode': 401,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Unauthorized'}),
            'isBase64Encoded': False
        }
    
    user_id = user['user_id']
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    if path == 'servers' and method == 'GET':
        cursor.execute("""
            SELECT DISTINCT s.id, s.name, s.icon, s.owner_id, s.created_at
            FROM servers s
            INNER JOIN server_members sm ON s.id = sm.server_id
            WHERE sm.user_id = %s
            ORDER BY s.created_at
        """, (user_id,))
        servers = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'servers': [
                    {
                        'id': s[0],
                        'name': s[1],
                        'icon': s[2],
                        'owner_id': s[3],
                        'created_at': s[4].isoformat() if s[4] else None
                    } for s in servers
                ]
            }),
            'isBase64Encoded': False
        }
    
    elif path == 'servers' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        name = body_data.get('name', '').strip()
        icon = body_data.get('icon', '🚀')
        
        if not name:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Server name is required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "INSERT INTO servers (name, icon, owner_id) VALUES (%s, %s, %s) RETURNING id, name, icon, owner_id, created_at",
            (name, icon, user_id)
        )
        server = cursor.fetchone()
        server_id = server[0]
        
        cursor.execute(
            "INSERT INTO server_members (server_id, user_id) VALUES (%s, %s)",
            (server_id, user_id)
        )
        
        cursor.execute(
            "INSERT INTO channels (server_id, name, type, position) VALUES (%s, %s, %s, %s)",
            (server_id, 'общий', 'text', 0)
        )
        cursor.execute(
            "INSERT INTO channels (server_id, name, type, position) VALUES (%s, %s, %s, %s)",
            (server_id, 'Общая комната', 'voice', 1)
        )
        
        conn.commit()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'server': {
                    'id': server[0],
                    'name': server[1],
                    'icon': server[2],
                    'owner_id': server[3],
                    'created_at': server[4].isoformat() if server[4] else None
                }
            }),
            'isBase64Encoded': False
        }
    
    elif path == 'channels' and method == 'GET':
        params = event.get('queryStringParameters', {})
        server_id = params.get('server_id')
        
        if not server_id:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'server_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute("""
            SELECT c.id, c.name, c.type, c.position
            FROM channels c
            WHERE c.server_id = %s
            ORDER BY c.position, c.created_at
        """, (server_id,))
        channels = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'channels': [
                    {
                        'id': str(c[0]),
                        'name': c[1],
                        'type': c[2],
                        'position': c[3]
                    } for c in channels
                ]
            }),
            'isBase64Encoded': False
        }
    
    elif path == 'messages' and method == 'GET':
        params = event.get('queryStringParameters', {})
        channel_id = params.get('channel_id')
        
        if not channel_id:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'channel_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute("""
            SELECT m.id, m.content, m.created_at, u.id, u.username, u.avatar_url
            FROM messages m
            INNER JOIN users u ON m.user_id = u.id
            WHERE m.channel_id = %s
            ORDER BY m.created_at DESC
            LIMIT 50
        """, (channel_id,))
        messages = cursor.fetchall()
        cursor.close()
        conn.close()
        
        messages.reverse()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'messages': [
                    {
                        'id': str(m[0]),
                        'content': m[1],
                        'timestamp': m[2].strftime('%H:%M') if m[2] else '',
                        'author': m[4],
                        'author_id': m[3],
                        'avatar': m[5]
                    } for m in messages
                ]
            }),
            'isBase64Encoded': False
        }
    
    elif path == 'messages' and method == 'POST':
        body_data = json.loads(event.get('body', '{}'))
        channel_id = body_data.get('channel_id')
        content = body_data.get('content', '').strip()
        
        if not channel_id or not content:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'channel_id and content are required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute(
            "INSERT INTO messages (channel_id, user_id, content) VALUES (%s, %s, %s) RETURNING id, created_at",
            (channel_id, user_id, content)
        )
        message = cursor.fetchone()
        conn.commit()
        
        cursor.execute("SELECT username, avatar_url FROM users WHERE id = %s", (user_id,))
        user_data = cursor.fetchone()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'message': {
                    'id': str(message[0]),
                    'content': content,
                    'timestamp': message[1].strftime('%H:%M') if message[1] else '',
                    'author': user_data[0],
                    'author_id': user_id,
                    'avatar': user_data[1]
                }
            }),
            'isBase64Encoded': False
        }
    
    elif path == 'members' and method == 'GET':
        params = event.get('queryStringParameters', {})
        server_id = params.get('server_id')
        
        if not server_id:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'server_id is required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute("""
            SELECT u.id, u.username, u.avatar_url
            FROM users u
            INNER JOIN server_members sm ON u.id = sm.user_id
            WHERE sm.server_id = %s
            ORDER BY u.username
        """, (server_id,))
        members = cursor.fetchall()
        cursor.close()
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'members': [
                    {
                        'id': m[0],
                        'name': m[1],
                        'avatar': m[2],
                        'online': True
                    } for m in members
                ]
            }),
            'isBase64Encoded': False
        }
    
    cursor.close()
    conn.close()
    
    return {
        'statusCode': 404,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Not found'}),
        'isBase64Encoded': False
    }