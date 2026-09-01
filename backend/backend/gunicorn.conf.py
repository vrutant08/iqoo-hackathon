# Gunicorn configuration for Render deployment
import multiprocessing

bind = "0.0.0.0:10000"
workers = 2
threads = 4
worker_class = "gthread"
timeout = 180
graceful_timeout = 30
keepalive = 65
max_requests = 1000
max_requests_jitter = 50
