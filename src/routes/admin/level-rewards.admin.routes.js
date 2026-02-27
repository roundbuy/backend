const express = require('express');
const router = express.Router();
const levelRewardsController = require('../../controllers/admin/level-rewards.admin.controller');
const { authorize } = require('../../middleware/auth.middleware');

// Routes are already protected by authenticate and authorize in admin.routes.js, 
// but we can add more specific roles if needed.

router.get('/', levelRewardsController.getAllLevelRewards);
router.post('/', levelRewardsController.createLevelReward);
router.put('/:id', levelRewardsController.updateLevelReward);
router.delete('/:id', authorize('admin'), levelRewardsController.deleteLevelReward);

module.exports = router;
