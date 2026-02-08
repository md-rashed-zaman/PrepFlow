package main

import (
	"flag"
	"fmt"
	"log"

	"github.com/golang-migrate/migrate/v4"
	_ "github.com/golang-migrate/migrate/v4/database/postgres"
	_ "github.com/golang-migrate/migrate/v4/source/file"
)

func main() {
	var dbURL string
	var path string
	var up bool
	var down bool

	flag.StringVar(&dbURL, "database", "", "DATABASE_URL")
	flag.StringVar(&path, "path", "", "path to migrations directory")
	flag.BoolVar(&up, "up", false, "run up migrations")
	flag.BoolVar(&down, "down", false, "run down migrations (one step)")
	flag.Parse()

	if dbURL == "" || path == "" {
		log.Fatal("missing -database or -path")
	}
	if !up && !down {
		log.Fatal("specify -up or -down")
	}

	m, err := migrate.New("file://"+path, dbURL)
	if err != nil {
		log.Fatal(err)
	}
	defer func() {
		srcErr, dbErr := m.Close()
		if srcErr != nil || dbErr != nil {
			log.Printf("migrate close: source=%v db=%v", srcErr, dbErr)
		}
	}()

	if up {
		if err := m.Up(); err != nil && err != migrate.ErrNoChange {
			log.Fatal(err)
		}
		fmt.Println("migrations up: ok")
		return
	}
	if down {
		if err := m.Steps(-1); err != nil {
			log.Fatal(err)
		}
		fmt.Println("migrations down: ok")
		return
	}
}
