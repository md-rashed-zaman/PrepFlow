package templates

import (
	"embed"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

//go:embed data/*.json
var dataFS embed.FS

type Item struct {
	URL        string   `json:"url"`
	Title      string   `json:"title"`
	Platform   string   `json:"platform"`
	Difficulty string   `json:"difficulty"`
	Topics     []string `json:"topics"`
}

var ErrNotFound = errors.New("template not found")

func Load(key, version string) ([]Item, error) {
	key = strings.TrimSpace(strings.ToLower(key))
	version = strings.TrimSpace(strings.ToLower(version))
	if key == "" || version == "" {
		return nil, ErrNotFound
	}
	path := fmt.Sprintf("data/%s.%s.json", key, version)
	b, err := dataFS.ReadFile(path)
	if err != nil {
		return nil, ErrNotFound
	}
	var items []Item
	if err := json.Unmarshal(b, &items); err != nil {
		return nil, err
	}
	if items == nil {
		items = []Item{}
	}
	return items, nil
}

