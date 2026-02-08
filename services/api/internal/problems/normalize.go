package problems

import "strings"

func NormalizeURL(raw string) string {
	u := strings.TrimSpace(raw)
	u = strings.TrimRight(u, "/")
	return u
}
