FROM node:18-alpine

WORKDIR /app

# تثبيت dependencies لـ PostgreSQL
RUN apk add --no-cache postgresql-client

# نسخ ملفات package
COPY package*.json ./

# تثبيت dependencies
RUN npm install --production

# نسخ باقي الملفات
COPY . .

# المنفذ
EXPOSE 5000

# تشغيل التطبيق
CMD ["npm", "start"]