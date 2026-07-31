FROM mcr.microsoft.com/dotnet/sdk:10.0 AS builder

WORKDIR /src

COPY ./MyApp.Data/MyApp.Data.csproj ./MyApp.Data/

COPY ./MyApp.Api/MyApp.Api.csproj ./MyApp.Api/

RUN dotnet restore ./MyApp.Data/MyApp.Data.csproj

RUN dotnet restore ./MyApp.Api/MyApp.Api.csproj

COPY . .


RUN dotnet publish ./MyApp.Api/MyApp.Api.csproj -o /app/publish

###################################

FROM mcr.microsoft.com/dotnet/aspnet:10.0

WORKDIR /src/app/runapp

COPY --from=builder /app/publish .

EXPOSE 8000

CMD ["dotnet","MyApp.Api.dll" ]



