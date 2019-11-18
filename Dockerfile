FROM alpine:3.10
RUN apk add nodejs npm python
RUN npm i -g --unsafe-perm=true --allow-root truffle
COPY . /app
WORKDIR /app
RUN npm init -y && npm i --save ethers
RUN truffle test --show-events --compile-all
ENTRYPOINT ["truffle"]
CMD ["test", "--show-events", "--compile-all"]
