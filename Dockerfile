FROM node:20-slim

WORKDIR /app

# สร้าง non-root user (UID 1000) ตามมาตรฐานความปลอดภัยของ Hugging Face Spaces
RUN useradd -m -u 1000 appuser

# คัดลอกและติดตั้ง Dependencies
COPY package*.json ./
RUN npm install

# คัดลอกซอร์สโค้ดทั้งหมด
COPY . .

# บิลด์ส่วน Frontend สำหรับ Production
RUN npm run build

# สร้างโฟลเดอร์ uploads และกำหนดสิทธิ์การเขียนไฟล์ให้ user 1000
RUN mkdir -p server/uploads && chown -R appuser:appuser /app

# สลับไปใช้ non-root user
USER appuser

# Hugging Face Spaces จะส่ง Traffic เข้าที่พอร์ต 7860
EXPOSE 7860
ENV PORT=7860
ENV NODE_ENV=production

CMD ["npm", "start"]
