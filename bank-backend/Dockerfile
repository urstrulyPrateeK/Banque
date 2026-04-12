FROM maven:3.9.4-eclipse-temurin-17 AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN mvn -B -ntp clean package -DskipTests

FROM eclipse-temurin:17-jre
WORKDIR /app

RUN addgroup --system banque && adduser --system --ingroup banque banque
COPY --from=build /app/target/banque-1.0.0.jar app.jar
RUN chown banque:banque /app/app.jar

USER banque
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.jar"]
