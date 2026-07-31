FROM node:24-alpine AS builder


WORKDIR /usr/src/app

COPY package.json ./
COPY package-lock.json ./

ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm ci

COPY . .

RUN npm run build


#####################

FROM nginx

WORKDIR /usr/share/nginx/html

COPY --from=builder /usr/src/app/dist .

COPY docker.conf /etc/nginx/conf.d/default.conf



EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
