# Estágio de Build
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Estágio de Produção
FROM nginx:alpine
# Copia o build (ajustado para Angular 17+)
COPY --from=build /app/dist/cadastro-faciais-i9/browser /usr/share/nginx/html
# Copia o arquivo que vamos criar no passo abaixo
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
