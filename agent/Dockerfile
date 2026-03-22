FROM alpine:3.21

RUN apk add --no-cache bash curl jq

COPY collect.sh /usr/local/bin/collect.sh
RUN chmod +x /usr/local/bin/collect.sh

CMD ["collect.sh"]
