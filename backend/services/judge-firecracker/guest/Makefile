CC ?= gcc
CFLAGS ?= -std=c11 -O2 -Wall -Wextra -static

supervisor: supervisor.c
	$(CC) $(CFLAGS) -o supervisor supervisor.c

clean:
	rm -f supervisor
