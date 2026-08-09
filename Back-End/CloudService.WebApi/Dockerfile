FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS base
USER $APP_UID
WORKDIR /app
EXPOSE 8080
EXPOSE 8081

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
ARG BUILD_CONFIGURATION=Release
WORKDIR /src

# Copy all csproj files first to leverage Docker cache for restore
COPY ["CloudService.Domain/CloudService.Domain.csproj", "CloudService.Domain/"]
COPY ["CloudService.Application/CloudService.Application.csproj", "CloudService.Application/"]
COPY ["CloudService.Infrastructure/CloudService.Infrastructure.csproj", "CloudService.Infrastructure/"]
COPY ["CloudService.WebApi/CloudService.WebApi.csproj", "CloudService.WebApi/"]

# Restore packages
RUN dotnet restore "CloudService.WebApi/CloudService.WebApi.csproj"

# Copy the rest of the source code
COPY . .
WORKDIR "/src/CloudService.WebApi"

# Build the project
RUN dotnet build "CloudService.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish "CloudService.WebApi.csproj" -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "CloudService.WebApi.dll"]