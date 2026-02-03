
CREATE TABLE IF NOT EXISTS seller_metrics (
    user_id INT PRIMARY KEY,
    avg_response_time_minutes INT DEFAULT 0,
    pickup_meeting_attendance_rate DECIMAL(5, 2) DEFAULT 0.00,
    questions_answered_within_2h_rate DECIMAL(5, 2) DEFAULT 0.00,
    successful_sales_rate DECIMAL(5, 2) DEFAULT 0.00,
    dispute_resolution_rate DECIMAL(5, 2) DEFAULT 0.00,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
