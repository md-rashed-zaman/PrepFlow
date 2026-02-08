CREATE TABLE IF NOT EXISTS lists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    source_type TEXT NOT NULL DEFAULT 'custom', -- custom | template
    source_key TEXT,
    version TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_lists_owner ON lists(owner_user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS list_items (
    list_id UUID NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (list_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_list_items_order ON list_items(list_id, order_index);

CREATE TABLE IF NOT EXISTS contests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    duration_minutes INT NOT NULL,
    strategy TEXT NOT NULL DEFAULT 'balanced',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_contests_user ON contests(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS contest_items (
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    order_index INT NOT NULL,
    target_minutes INT NOT NULL DEFAULT 0,
    PRIMARY KEY (contest_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_contest_items_order ON contest_items(contest_id, order_index);

CREATE TABLE IF NOT EXISTS contest_results (
    contest_id UUID NOT NULL REFERENCES contests(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    grade INT,
    time_spent_sec INT,
    solved_flag BOOL,
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (contest_id, problem_id)
);
CREATE INDEX IF NOT EXISTS idx_contest_results_recorded ON contest_results(contest_id, recorded_at DESC);

