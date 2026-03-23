FROM nvidia/cuda:12.6.0-base-ubuntu24.04

RUN apt-get update && apt-get install -y --no-install-recommends curl jq \
    && rm -rf /var/lib/apt/lists/*

COPY collect.sh /usr/local/bin/collect.sh
RUN chmod +x /usr/local/bin/collect.sh

CMD ["collect.sh"]
