FROM alpine:3.10
RUN apk add nodejs npm python jq
RUN npm i -g --unsafe-perm=true --allow-root truffle
COPY . /app
WORKDIR /app
RUN npm init -y && npm i --save ethers
RUN truffle compile && truffle test --show-events --compile-all
RUN echo "BYTECODE:" && \
    echo "==========" && \
    cat /app/build/contracts/QARK.json | jq '.bytecode' && \
    echo "==========" && \
    echo "ABI:" && \
    echo "==========" && \
    cat /app/build/contracts/QARK.json | jq '.abi' && \
    echo "=========="
ENTRYPOINT ["truffle"]
CMD ["test", "--show-events", "--compile-all"]
