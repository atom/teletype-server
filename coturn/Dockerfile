FROM ubuntu:18.04

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive apt-get install -y coturn

ADD turnserver.conf /etc/turnserver.conf

EXPOSE 3478

CMD exec /bin/bash -c "trap : TERM INT; /usr/bin/turnserver -c /etc/turnserver.conf -v"
