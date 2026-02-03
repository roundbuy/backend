CREATE TABLE IF NOT EXISTS app_suggestions (
    id SERIAL PRIMARY KEY,
    user_id INT, -- Can be null for anonymous, or linked to users table
    page_route VARCHAR(255),
    rating INT CHECK (rating >= 1 AND rating <= 5),
    feedback_tags TEXT, -- Storing as JSON string or comma-separated values
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
