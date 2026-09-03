# Multi-stage build for optimal image size
FROM python:3.11-slim AS builder

WORKDIR /usr/src/app

# Disable pip cache to keep image small, ignore python buffer delays
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install system compilation packages for PyMuPDF, Pillow, and ReportLab
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    libmupdf-dev \
    libfreetype6-dev \
    libjpeg-dev \
    zlib1g-dev \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# Install dependencies into local user space
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --user --no-cache-dir -r requirements.txt

# Final minimal runner stage
FROM python:3.11-slim AS runner

WORKDIR /app

# Install only runtime shared library dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    libmupdf-dev \
    libfreetype6-dev \
    libjpeg-dev \
    zlib1g-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy built packages from builder stage
COPY --from=builder /root/.local /root/.local
COPY . .

ENV PATH=/root/.local/bin:$PATH
ENV PORT=8000

EXPOSE 8000

# Dynamically bind to Render's $PORT (defaults to 8000 locally)
CMD ["sh", "-c", "uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]