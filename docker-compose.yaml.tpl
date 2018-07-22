version: "3"
services:
  app:
      container_name: __container__
      image: node:alpine
      volumes:
        - ./:/app
      working_dir: /app
      env_file: ./.env
      ports:
        - __port__
      command: npm run start
      restart: always
networks:
  default:
    external:
      name: webproxy
