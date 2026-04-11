# Root Dockerfile for Render single-service deploy.
# Stage 1: build Angular frontend
FROM node:20 AS frontend-build
WORKDIR /frontend

COPY bank-frontend/package*.json ./
RUN npm ci

COPY bank-frontend/ ./
RUN npm run build

# Stage 2: build Spring Boot backend and embed frontend static files
FROM maven:3.9.4-eclipse-temurin-17 AS backend-build
WORKDIR /backend

COPY bank-backend/pom.xml ./pom.xml
COPY bank-backend/src ./src

RUN mkdir -p src/main/resources/static
COPY --from=frontend-build /frontend/dist/bank-frontend/browser/ ./src/main/resources/static/

RUN mvn clean package -DskipTests -B

# Stage 3: runtime
FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=backend-build /backend/target/bank-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
