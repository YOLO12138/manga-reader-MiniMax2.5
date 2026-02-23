FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Environment variables will be provided by docker-compose via env_file

RUN mkdir -p /app/storage/manga

EXPOSE 8000

# Run with increased body size limit (200MB)
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--limit-concurrency", "100", "--limit-max-requests", "1000", "--proxy-headers", "--forwarded-allow-ips=*"]
