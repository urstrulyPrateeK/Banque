# Root Dockerfile for Render Web Service (backend deployment)
# This builds and runs the Spring Boot backend from /bank-backend.

FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app

COPY bank-backend/pom.xml ./pom.xml
COPY bank-backend/src ./src

RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:17-jre
WORKDIR /app

COPY --from=build /app/target/bank-backend-0.0.1-SNAPSHOT.jar app.jar

EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
