const { promisePool } = require('./src/config/database');

const insertRewards = async () => {
    try {
        const rewardsToInsert = [];
        let sortOrder = 14;

        // We need 3 more beginner rewards
        for (let i = 1; i <= 3; i++) {
            rewardsToInsert.push({
                name: `Bonus Task ${i} (Beginner)`,
                description: `Complete this beginner level task ${i} to earn points.`,
                icon: 'star',
                color: '#4CAF50',
                type: 'level_reward',
                required_referrals: 5,
                reward_value: null,
                is_active: 1,
                sort_order: sortOrder++,
                required_level: 'beginner',
                is_earnable_once: 0,
                points_cost: 100
            });
        }

        // We need 14 more advanced rewards
        for (let i = 1; i <= 14; i++) {
            rewardsToInsert.push({
                name: `Advanced Challenge ${i}`,
                description: `A challenging task ${i} for advanced users.`,
                icon: 'flash',
                color: '#2196F3',
                type: 'level_reward',
                required_referrals: 10,
                reward_value: null,
                is_active: 1,
                sort_order: sortOrder++,
                required_level: 'advanced',
                is_earnable_once: 0,
                points_cost: 200
            });
        }

        // We need 15 more exclusive rewards
        for (let i = 1; i <= 15; i++) {
            rewardsToInsert.push({
                name: `Exclusive Elite Goal ${i}`,
                description: `An elite goal ${i} reserved for our exclusive members.`,
                icon: 'rocket',
                color: '#9C27B0',
                type: 'level_reward',
                required_referrals: 20,
                reward_value: null,
                is_active: 1,
                sort_order: sortOrder++,
                required_level: 'exclusive',
                is_earnable_once: 0,
                points_cost: 500
            });
        }

        for (const reward of rewardsToInsert) {
            await promisePool.query(
                `INSERT INTO reward_categories 
                (name, description, icon, color, type, required_referrals, reward_value, is_active, sort_order, required_level, is_earnable_once, points_cost) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    reward.name, reward.description, reward.icon, reward.color, reward.type,
                    reward.required_referrals, reward.reward_value, reward.is_active, reward.sort_order,
                    reward.required_level, reward.is_earnable_once, reward.points_cost
                ]
            );
        }

        console.log('Successfully inserted all placeholder rewards!');

        const [rows] = await promisePool.query('SELECT required_level, COUNT(*) as count FROM reward_categories GROUP BY required_level');
        console.log('New Totals:', rows);

        process.exit(0);
    } catch (error) {
        console.error('Error seeding rewards:', error);
        process.exit(1);
    }
};

insertRewards();
