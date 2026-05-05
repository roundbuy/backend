-- ============================================================
-- SEED DATA: Disputes & Claims for User 23
-- Covers ALL test scenarios for Buyer (user 23) and Seller views
-- Seller is user 24 (assumed to exist — change if needed)
-- Advertisement ID 1 used (change to a valid ad ID in your DB)
-- IMPORTANT: Run the migration file FIRST before this seed!
-- ============================================================

USE roundbuy;

-- Disable strict mode to handle optional fields gracefully
SET SESSION sql_mode = '';

-- Dispute 1: User 23 as BUYER - State 1: Seller hasn't responded (pending)
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  status, priority
) VALUES (
  'DIS00000100', 23, 24, 1,
  'buyer_initiated', 'Item not as described',
  'The coffee maker I received is completely different to what was shown in the listing. The color, model and brand do not match at all.',
  'pending', 'medium'
);

-- Dispute 2: User 23 as BUYER - State 2: Seller ACCEPTED
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision, status, priority
) VALUES (
  'DIS00000101', 23, 24, 1,
  'buyer_initiated', 'Damaged or defective item',
  'The laptop I received has a cracked screen and does not power on. It was clearly damaged before shipping.',
  'You are right, I apologise. The item must have been damaged during packing. I accept your demand.',
  'accept', 'awaiting_response', 'high'
);

-- Dispute 3: User 23 as BUYER - State 3: Seller NEGOTIATES, both suggestions submitted
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  status, priority
) VALUES (
  'DIS00000102', 23, 24, 1,
  'buyer_initiated', 'Item not received',
  'I paid for the bicycle 2 weeks ago and it has still not arrived. The tracking number provided is not working.',
  'I understand your frustration. The courier had a delay issue. Let us settle this without further escalation.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'negotiating', 'medium'
);

-- Dispute 4: User 23 as BUYER - State 4: Both ACCEPTED (settled)
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  negotiation_buyer_decision, negotiation_seller_decision,
  status, priority
) VALUES (
  'DIS00000103', 23, 24, 1,
  'buyer_initiated', 'Wrong item received',
  'I ordered a blue jacket size L but received a red jacket size S.',
  'I apologise for the mix-up. I am willing to negotiate a resolution.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'accept', 'accept',
  'settled', 'medium'
);

-- Dispute 5: User 23 as BUYER - State 4: Buyer ACCEPTS, Seller DECLINES
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  negotiation_buyer_decision, negotiation_seller_decision,
  status, priority
) VALUES (
  'DIS00000104', 23, 24, 1,
  'buyer_initiated', 'Seller not responding',
  'The seller took my payment but stopped responding after I raised the issue about the product quality.',
  'I am open to negotiation but the buyer needs to return the item first.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'accept', 'decline',
  'awaiting_response', 'medium'
);

-- Dispute 6: User 23 as BUYER - State 4: Both DECLINE
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  negotiation_buyer_decision, negotiation_seller_decision,
  status, priority
) VALUES (
  'DIS00000105', 23, 24, 1,
  'buyer_initiated', 'Transaction cancelled',
  'Both parties could not agree on the resolution terms after multiple attempts.',
  'I believe the buyer is being unreasonable about the return condition of the item.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'decline', 'decline',
  'awaiting_response', 'medium'
);

-- Dispute 7: User 23 as BUYER - State 5: Seller DECLINED (buyer can escalate)
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  status, priority
) VALUES (
  'DIS00000106', 23, 24, 1,
  'buyer_initiated', 'Item not as described',
  'The headphones stopped working after one day of use. The seller refused to help at all.',
  'Yes! I checked the item before shipping. The item was working perfectly. You must have broken it yourself.',
  'decline',
  'awaiting_response', 'high'
);

-- Dispute 8: User 23 as SELLER - State 1: Buyer filed, seller (23) hasn't responded
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  status, priority
) VALUES (
  'DIS00000107', 24, 23, 1,
  'buyer_initiated', 'Item not as described',
  'The camera lens I received has scratches and the autofocus does not work correctly.',
  'pending', 'high'
);

-- Dispute 9: User 23 as SELLER - State 3: Negotiating, both suggestions in
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  status, priority
) VALUES (
  'DIS00000108', 24, 23, 1,
  'buyer_initiated', 'Damaged or defective item',
  'The guitar arrived with a broken tuning peg and a crack in the body.',
  'I understand the issue. The guitar was packed carefully but shipping may have caused damage.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'negotiating', 'medium'
);

-- Dispute 10: User 23 as SELLER - State 4: Seller ACCEPTS, Buyer DECLINES
INSERT INTO disputes (
  dispute_number, user_id, seller_id, advertisement_id,
  dispute_type, dispute_category, problem_description,
  seller_response, seller_decision,
  buyer_suggestion, seller_suggestion,
  negotiation_buyer_decision, negotiation_seller_decision,
  status, priority
) VALUES (
  'DIS00000109', 24, 23, 1,
  'buyer_initiated', 'Item not received',
  'I never received the watch I paid for.',
  'I am willing to negotiate and accept partial resolution.',
  'negotiate',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'Let us settle the matter. I know MR Lorem Ipsum very well. He left his hat yesterday. But I want to settle the case.',
  'decline', 'accept',
  'awaiting_response', 'medium'
);

-- ============================================================
-- CLAIMS
-- ============================================================

-- Claim 1: User 23 as CLAIMANT - Pending
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, status, priority
) VALUES (
  'CLM00000100',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000106'),
  23, 24, 1,
  'The seller declined my dispute without valid reason. I paid for a product that broke after one day. I am escalating for a full refund.',
  'pending', 'high'
);

-- Claim 2: User 23 as CLAIMANT - Under Review
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, status, priority, assigned_at
) VALUES (
  'CLM00000101',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000105'),
  23, 24, 1,
  'Both parties failed to reach a negotiated resolution. The seller is being uncooperative and refusing all reasonable settlement suggestions.',
  'under_review', 'medium', NOW()
);

-- Claim 3: User 23 as CLAIMANT - Resolved FAVOR_BUYER
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, seller_response,
  admin_decision, admin_notes, resolution_amount,
  status, priority, assigned_at, resolved_at
) VALUES (
  'CLM00000102',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000104'),
  23, 24, 1,
  'Seller declined and did not ship the item. I have bank transfer receipt and no delivery confirmation.',
  'I did ship the item. The buyer must have provided the wrong address.',
  'favor_buyer',
  'After reviewing all evidence we rule in favour of the Claimant. A full refund of £149.99 will be processed within 2-4 business days.',
  149.99,
  'resolved', 'high', NOW(), NOW()
);

-- Claim 4: User 23 as CLAIMANT - Closed FAVOR_SELLER
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, seller_response,
  admin_decision, admin_notes,
  status, priority, assigned_at, resolved_at, closed_at
) VALUES (
  'CLM00000103',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000107'),
  23, 24, 1,
  'The item stopped working after 48 hours. I believe it was faulty from the start.',
  'I tested the item before despatch. The buyer appears to have damaged it themselves.',
  'favor_seller',
  'Based on photographic evidence the damage occurred after delivery. Claim dismissed.',
  'closed', 'medium', NOW(), NOW(), NOW()
);

-- Claim 5: User 23 as DEFENDANT - Pending claim against them
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, status, priority
) VALUES (
  'CLM00000104',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000107'),
  24, 23, 1,
  'I escalated because the seller (user 23) refused to acknowledge the damage. I have unboxing video and photos.',
  'pending', 'high'
);

-- Claim 6: User 23 as DEFENDANT - Under review with seller response
INSERT INTO claims (
  claim_number, dispute_id, user_id, seller_id, advertisement_id,
  claim_reason, seller_response,
  status, priority, assigned_at
) VALUES (
  'CLM00000105',
  (SELECT id FROM disputes WHERE dispute_number = 'DIS00000108'),
  24, 23, 1,
  'The guitar arrived broken. I have video evidence of the unboxing showing the damage.',
  'I packed the guitar with professional packaging. The damage must have been caused by the courier. I am not liable.',
  'under_review', 'medium', NOW()
);

-- Restore sql_mode
SET SESSION sql_mode = DEFAULT;

SELECT 'Seed data inserted successfully! All dispute and claim states for user 23 are ready.' as result;
