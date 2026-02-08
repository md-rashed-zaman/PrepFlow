package scheduler

import (
	"math"
	"time"
)

type State struct {
	Reps         int
	IntervalDays int
	Ease         float64
}

type Result struct {
	State State
	DueAt time.Time
}

// Update applies the SM-2 rules in AGENTS.md plus the user minimum interval "Policy A".
// - grade: 0..4
// - minIntervalDays: M (>=1)
// - dueHourLocal/dueMinuteLocal: local time used to anchor due_at (e.g., 9:30 => 09:30 local time).
func Update(prev State, grade int, reviewedAt time.Time, userTZ *time.Location, minIntervalDays int, dueHourLocal int, dueMinuteLocal int) Result {
	if prev.Ease <= 0 {
		prev.Ease = 2.5
	}
	if prev.IntervalDays <= 0 {
		prev.IntervalDays = 1
	}
	if prev.Reps < 0 {
		prev.Reps = 0
	}
	if minIntervalDays <= 0 {
		minIntervalDays = 1
	}
	if dueHourLocal < 0 || dueHourLocal > 23 {
		dueHourLocal = 9
	}
	if dueMinuteLocal < 0 || dueMinuteLocal > 59 {
		dueMinuteLocal = 0
	}

	next := prev
	if grade <= 1 {
		next.Reps = 0
		next.IntervalDays = 1
		next.Ease = math.Max(1.3, next.Ease-0.2)
	} else {
		next.Reps++
		switch next.Reps {
		case 1:
			next.IntervalDays = 1
		case 2:
			next.IntervalDays = 6
		default:
			next.IntervalDays = int(math.Round(float64(next.IntervalDays) * next.Ease))
			if next.IntervalDays < 1 {
				next.IntervalDays = 1
			}
		}

		d := float64(4 - grade)
		next.Ease = next.Ease + (0.10 - d*(0.08+d*0.02))
		if next.Ease < 1.3 {
			next.Ease = 1.3
		}
	}

	base := next.IntervalDays
	final := policyA(minIntervalDays, base)
	dueAt := AnchorLocalDay(reviewedAt, userTZ, dueHourLocal, dueMinuteLocal).AddDate(0, 0, final)
	return Result{
		State: next,
		DueAt: dueAt.UTC(),
	}
}

func policyA(minIntervalDays int, baseIntervalDays int) int {
	if minIntervalDays <= 0 {
		minIntervalDays = 1
	}
	if baseIntervalDays < 1 {
		baseIntervalDays = 1
	}
	shifted := baseIntervalDays + (minIntervalDays - 1)
	if shifted < minIntervalDays {
		return minIntervalDays
	}
	return shifted
}

// AnchorLocalDay returns a timestamp anchored at (hour:minute) on the local calendar day of t.
// It is used to keep due times stable for ICS feeds and user expectations.
func AnchorLocalDay(t time.Time, loc *time.Location, hour int, minute int) time.Time {
	if loc == nil {
		loc = time.UTC
	}
	lt := t.In(loc)
	return time.Date(lt.Year(), lt.Month(), lt.Day(), hour, minute, 0, 0, loc)
}

// DueAtToday returns today's anchored due timestamp in UTC for a user.
func DueAtToday(nowUTC time.Time, userTZ *time.Location, dueHourLocal int, dueMinuteLocal int) time.Time {
	return AnchorLocalDay(nowUTC, userTZ, dueHourLocal, dueMinuteLocal).UTC()
}
