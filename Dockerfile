FROM node:22-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

ARG VITE_API_URL
ARG VITE_WS_URL
ARG VITE_EMAIL_FROM
ARG VITE_EMAIL_FROM_NAME
ARG VITE_SESSION_TIMEOUT

ENV VITE_API_URL=$VITE_API_URL
ENV VITE_WS_URL=$VITE_WS_URL
ENV VITE_EMAIL_FROM=$VITE_EMAIL_FROM
ENV VITE_EMAIL_FROM_NAME=$VITE_EMAIL_FROM_NAME
ENV VITE_SESSION_TIMEOUT=$VITE_SESSION_TIMEOUT

RUN npm run build

RUN ls -la && mkdir -p dist

FROM nginx:alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80 443

CMD ["nginx", "-g", "daemon off;"]