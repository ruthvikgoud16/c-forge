FROM gcc:13-bookworm

RUN apt-get update \
  && apt-get install -y --no-install-recommends ca-certificates libseccomp-dev \
  && rm -rf /var/lib/apt/lists/*
# gcc:13-bookworm already has UID 65534 (nobody). Compose runs USER 65534:65534.

COPY --from=node:22-bookworm-slim /usr/local/bin/node /usr/local/bin/node

WORKDIR /opt/judge
COPY src ./src
COPY package.json ./

RUN mkdir -p /opt/judge/bin \
  && gcc -std=c11 -O2 -o /opt/judge/bin/confine /opt/judge/src/confine.c -lseccomp \
  && chmod 755 /opt/judge/bin/confine /opt/judge/src/entrypoint.sh \
  && chmod 644 /opt/judge/src/*.mjs /opt/judge/src/confine.c

ENV HOME=/tmp
ENV JUDGE_PORT=7080
ENV JUDGE_CONFINE=/opt/judge/bin/confine
ENV JUDGE_REQUIRE_CONFINE=1
ENV JUDGE_STATIC=1
ENV JUDGE_WORKSPACE=/workspace/runs
ENV TMPDIR=/workspace
EXPOSE 7080

USER 65534:65534
CMD ["/opt/judge/src/entrypoint.sh"]
