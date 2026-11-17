# 1. Node.js image use karein
FROM node:20-alpine

# 2. Working directory set karein
WORKDIR /app

# 3. Package files copy karein
COPY package*.json ./

# 4. Dependencies install karein
RUN npm install

# 5. Baqi saara code copy karein
COPY . .

# 6. Port expose karein (React 3000 par chalta hai)
EXPOSE 3000

# 7. React app start karein (development mode mein)
CMD ["npm", "start"]