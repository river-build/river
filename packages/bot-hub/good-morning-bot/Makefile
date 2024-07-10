start:
	docker-compose up --remove-orphans -d

stop:
	docker-compose down

build:
	docker-compose build

clean:
	docker-compose down -v --remove-orphans

logs:
	docker-compose logs -f

.PHONY: start stop build clean logs
