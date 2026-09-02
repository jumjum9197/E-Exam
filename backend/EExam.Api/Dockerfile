FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["EExam.Api.csproj", "./"]
RUN dotnet restore "EExam.Api.csproj"

COPY . .
RUN dotnet publish "EExam.Api.csproj" -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app

COPY --from=build /app/publish .

ENV DOTNET_USE_POLLING_FILE_WATCHER=1
ENV ASPNETCORE_URLS=http://+:${PORT:-10000}

EXPOSE 10000

ENTRYPOINT ["dotnet", "EExam.Api.dll"]
