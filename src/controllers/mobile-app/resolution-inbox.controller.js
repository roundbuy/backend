const resolutionInboxService = require('../../services/resolution-inbox.service');

exports.getResolutionInbox = async (req, res) => {
  try {
    const userId = req.user.id;
    const data = await resolutionInboxService.getResolutionInbox(userId);
    
    // Group into sections for the frontend if needed
    const grouped = {
        issue: data.filter(item => item.type === 'issue'),
        dispute: data.filter(item => item.type === 'dispute'),
        claim: data.filter(item => item.type === 'claim')
    };

    res.status(200).json({
      success: true,
      data: grouped
    });
  } catch (error) {
    console.error('Error in getResolutionInbox:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch resolution inbox'
    });
  }
};
