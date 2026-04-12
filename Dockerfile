FROM node:20 AS frontend-build
WORKDIR /frontend

ARG FIREBASE_API_KEY
ARG FAST2SMS_API_KEY

COPY bank-frontend/ package*.json ./
RUN npm ci

COPY bank-frontend/ ./
RUN sed -i "s/__FIREBASE_API_KEY__/${FIREBASE_API_KEY}/g" src/environments/environment*.ts && \
    sed -i "s/__FAST2SMS_API_KEY__/${FAST2SMS_API_KEY}/g" src/environments/environment*.ts

ENV NODE_OPTIONS="--max-old-space-size=1024"
RUN npm run build

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
