import json
import os
import psycopg2
import jwt
import hashlib
from datetime import datetime, timedelta
from typing import Dict, Any

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password: str, password_hash: str) -> bool:
    return hash_password(password) == password_hash

def create_jwt_token(user_id: int, email: str) -> str:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    if not secret or secret == 'None':
        secret = 'default-secret-key'
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.utcnow() + timedelta(days=30)
    }
    return jwt.encode(payload, str(secret), algorithm='HS256')

def verify_jwt_token(token: str) -> Dict[str, Any]:
    secret = os.environ.get('JWT_SECRET', 'default-secret-key')
    if not secret or secret == 'None':
        secret = 'default-secret-key'
    return jwt.decode(token, str(secret), algorithms=['HS256'])

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Business: User authentication and registration
    Args: event with httpMethod, body
    Returns: HTTP response with user data and JWT token
    '''
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    if method != 'POST':
        return {
            'statusCode': 405,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Method not allowed'}),
            'isBase64Encoded': False
        }
    
    body_data = json.loads(event.get('body', '{}'))
    action = body_data.get('action')
    email = body_data.get('email', '').strip().lower()
    password = body_data.get('password', '')
    username = body_data.get('username', '').strip()
    
    if not email or not password:
        return {
            'statusCode': 400,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({'error': 'Email and password are required'}),
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cursor = conn.cursor()
    
    if action == 'register':
        if not username:
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Username is required'}),
                'isBase64Encoded': False
            }
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            cursor.close()
            conn.close()
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Email already exists'}),
                'isBase64Encoded': False
            }
        
        password_hash = hash_password(password)
        cursor.execute(
            "INSERT INTO users (email, username, password_hash) VALUES (%s, %s, %s) RETURNING id, email, username, avatar_url, created_at",
            (email, username, password_hash)
        )
        user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        token = create_jwt_token(user[0], user[1])
        
        return {
            'statusCode': 201,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': token,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'username': user[2],
                    'avatar_url': user[3]
                }
            }),
            'isBase64Encoded': False
        }
    
    elif action == 'login':
        cursor.execute(
            "SELECT id, email, username, password_hash, avatar_url FROM users WHERE email = %s",
            (email,)
        )
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user or not verify_password(password, user[3]):
            return {
                'statusCode': 401,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Invalid email or password'}),
                'isBase64Encoded': False
            }
        
        token = create_jwt_token(user[0], user[1])
        
        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
            'body': json.dumps({
                'token': token,
                'user': {
                    'id': user[0],
                    'email': user[1],
                    'username': user[2],
                    'avatar_url': user[4]
                }
            }),
            'isBase64Encoded': False
        }
    
    return {
        'statusCode': 400,
        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
        'body': json.dumps({'error': 'Invalid action'}),
        'isBase64Encoded': False
    }