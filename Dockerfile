# Usa una imagen oficial de Python
FROM python:3.11-slim

# Establece el directorio de trabajo
WORKDIR /app

# Copia requirements y los instala
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copia el resto del proyecto
COPY . .

# Expone el puerto de Django
EXPOSE 8000
