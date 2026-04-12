FROM node:20 AS build
WORKDIR /app
ARG FIREBASE_API_KEY
ARG FAST2SMS_API_KEY

COPY package*.json ./
RUN npm ci

COPY . .
RUN sed -i "s/__FIREBASE_API_KEY__/${FIREBASE_API_KEY}/g" src/environments/environment*.ts && \
    sed -i "s/__FAST2SMS_API_KEY__/${FAST2SMS_API_KEY}/g" src/environments/environment*.ts

RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist/bank-frontend/browser /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
