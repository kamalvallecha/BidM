import jwt

# Test data
payload = {
    'user_id': 1,
    'email': 'test@example.com',
    'role': 'admin'
}

# Test secret key
secret_key = 'your-secret-key'

try:
    # Try to encode
    token = jwt.encode(payload, secret_key, algorithm='HS256')
    print("JWT encode successful!")
    print(f"Token: {token}")
    
    # Try to decode
    decoded = jwt.decode(token, secret_key, algorithms=['HS256'])
    print("JWT decode successful!")
    print(f"Decoded payload: {decoded}")
except Exception as e:
    print(f"Error: {str(e)}") 