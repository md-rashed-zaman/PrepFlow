package scheduler

import (
	"testing"
	"time"
)

func TestPolicyAExamples(t *testing.T) {
	if got := policyA(7, 1); got != 7 {
		t.Fatalf("expected 7, got %d", got)
	}
	if got := policyA(7, 6); got != 12 {
		t.Fatalf("expected 12, got %d", got)
	}
	if got := policyA(7, 14); got != 20 {
		t.Fatalf("expected 20, got %d", got)
	}
}

func TestUpdateFailResets(t *testing.T) {
	loc := time.FixedZone("X", -5*3600)
	prev := State{Reps: 3, IntervalDays: 10, Ease: 2.0}
	res := Update(prev, 0, time.Date(2026, 2, 8, 10, 0, 0, 0, time.UTC), loc, 1, 9, 0)
	if res.State.Reps != 0 {
		t.Fatalf("expected reps reset to 0, got %d", res.State.Reps)
	}
	if res.State.IntervalDays != 1 {
		t.Fatalf("expected interval reset to 1, got %d", res.State.IntervalDays)
	}
	if res.State.Ease >= prev.Ease {
		t.Fatalf("expected ease to decrease on fail, got %f", res.State.Ease)
	}
}

func TestUpdateDueAtAnchorsToLocalDay(t *testing.T) {
	loc := time.FixedZone("X", 3*3600)
	prev := State{Reps: 0, IntervalDays: 1, Ease: 2.5}
	reviewedAt := time.Date(2026, 2, 8, 23, 30, 0, 0, time.UTC) // local is 02:30 next day
	res := Update(prev, 3, reviewedAt, loc, 1, 9, 0)

	localDue := res.DueAt.In(loc)
	if localDue.Hour() != 9 || localDue.Minute() != 0 {
		t.Fatalf("expected due at 09:00 local, got %s", localDue.Format(time.RFC3339))
	}
}
