import os
import pymysql
import redis
import json
import time
import logging
import ssl
from redis.exceptions import ConnectionError, TimeoutError

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def get_cors_headers():
    return {
        'Access-Control-Allow-Origin': 'https://d164wgldj6tosl.cloudfront.net',
        'Access-Control-Allow-Headers': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Type'
    }

class DB:
    _instance = None
    _max_retries = 3
    
    @classmethod
    def get_connection(cls):
        if not cls._instance or not cls._instance.open:
            for attempt in range(cls._max_retries):
                try:
                    cls._instance = pymysql.connect(
                        host=os.environ['RDS_HOST'],
                        user=os.environ['DB_USER'],
                        password=os.environ['DB_PASSWORD'],
                        db=os.environ['DB_NAME'],
                        cursorclass=pymysql.cursors.DictCursor,
                        autocommit=False,
                        connect_timeout=5
                    )
                    break
                except pymysql.Error as e:
                    logger.error(f"Database connection attempt {attempt + 1} failed: {e}")
                    if attempt == cls._max_retries - 1:
                        raise
                    time.sleep(1)
        return cls._instance

class Cache:
    _instance = None
    _max_retries = 3
    
    @classmethod
    def get_client(cls):
        if not cls._instance:
            for attempt in range(cls._max_retries):
                try:
                    cls._instance = redis.Redis(
                        host=os.environ['ELASTICACHE_ENDPOINT'],
                        port=6379,
                        decode_responses=True,
                        socket_timeout=5,
                        socket_connect_timeout=5,
                        retry_on_timeout=True,
                        ssl=True,  # ✅ Enables TLS
                        ssl_cert_reqs=None  # ✅ Bypasses certificate verification (for testing)
                    )
                    # Test the connection
                    cls._instance.ping()
                    logger.info("Successfully connected to Redis with TLS")
                    break
                except (ConnectionError, TimeoutError) as e:
                    logger.error(f"Redis connection attempt {attempt + 1} failed: {e}")
                    if attempt == cls._max_retries - 1:
                        raise
                    time.sleep(1)
        return cls._instance
