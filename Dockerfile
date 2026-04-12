FROM node:20 AS frontend-build
WORKDIR /frontend

ARG FIREBASE_API_KEY
ARG FIREBASE_AUTH_DOMAIN
ARG FIREBASE_PROJECT_ID
ARG FIREBASE_STORAGE_BUCKET
ARG FIREBASE_MESSAGING_SENDER_ID
ARG FIREBASE_APP_ID
ARG FIREBASE_MEASUREMENT_ID
ARG FAST2SMS_API_KEY

# Copy package files first for layer caching
COPY bank-frontend/package.json bank-frontend/package-lock.json* ./
RUN npm ci

# Copy remaining source
COPY bank-frontend/ ./

# Inject secrets into environment files via sed
RUN sed -i "s/__FIREBASE_API_KEY__/${FIREBASE_API_KEY}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_AUTH_DOMAIN__/${FIREBASE_AUTH_DOMAIN}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_PROJECT_ID__/${FIREBASE_PROJECT_ID}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_STORAGE_BUCKET__/${FIREBASE_STORAGE_BUCKET}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_MESSAGING_SENDER_ID__/${FIREBASE_MESSAGING_SENDER_ID}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_APP_ID__/${FIREBASE_APP_ID}/g" src/environments/environment*.ts && \
    sed -i "s/__FIREBASE_MEASUREMENT_ID__/${FIREBASE_MEASUREMENT_ID}/g" src/environments/environment*.ts && \
    sed -i "s/__FAST2SMS_API_KEY__/${FAST2SMS_API_KEY}/g" src/environments/environment*.ts

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npx ng build --configuration=production

FROM maven:3.9.4-eclipse-temurin-17 AS backend-build
WORKDIR /backend

COPY bank-backend/pom.xml ./pom.xml
COPY bank-backend/src ./src

RUN mkdir -p src/main/resources/static
COPY --from=frontend-build /frontend/dist/bank-frontend/browser/ ./src/main/resources/static/
RUN mvn -B -ntp clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

RUN addgroup --system banque && adduser --system --ingroup banque banque
COPY --from=backend-build /backend/target/banque-1.0.0.jar app.jar
RUN chown banque:banque /app/app.jar

USER banque
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
