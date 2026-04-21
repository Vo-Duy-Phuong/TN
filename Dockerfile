# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /app

# Copy solution and project files
COPY QLK.sln ./
COPY src/QLK.Domain/QLK.Domain.csproj src/QLK.Domain/
COPY src/QLK.Application/QLK.Application.csproj src/QLK.Application/
COPY src/QLK.Infrastructure/QLK.Infrastructure.csproj src/QLK.Infrastructure/
COPY src/QLK.Api/QLK.Api.csproj src/QLK.Api/

# Restore dependencies
RUN dotnet restore

# Copy all files and build
COPY . .
WORKDIR /app/src/QLK.Api
RUN dotnet publish -c Release -o /app/out

# Stage 2: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/out .

# Create a folder for local storage as fallback (though Cloudinary is preferred)
RUN mkdir -p /app/wwwroot/uploads

# Set environment variables
ENV ASPNETCORE_ENVIRONMENT=Production
ENV ASPNETCORE_URLS=http://+:5020

# EXPOSE the port (Render will use its own but good for documentation)
EXPOSE 5020

ENTRYPOINT ["dotnet", "QLK.Api.dll"]
