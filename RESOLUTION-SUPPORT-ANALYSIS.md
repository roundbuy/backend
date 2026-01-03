# Resolution & Support System - Implementation Analysis

## Process Flow Requirements

### Step 1: Issue Creation (Negotiation Start)
**Timeline: 3 days (closes at 00:00 UK time)**
- User creates an "Issue" 
- Both parties can "Accept" or "Reject"
- ✅ Notification to both users
- ✅ Issue created in system

### Step 2: Dispute Escalation
**Timeline: 20 days (closes at 00:00 UK time)**
- If Issue rejected → User "Issues a Dispute"
- If Issue accepted → Case Solved/Ended
- ✅ "DISPUTE ISSUED" notification to both parties
- Both parties provide answers, evidence, suggestions
- ⚠️ 20-day answer window needs implementation

### Step 3: Claim & Documentation
**Timeline: 7 days (closes at 00:00 UK time)**
- If "Issued Dispute" fails → Claim launched
- Both users must answer
- If no answer → answerer wins
- ⚠️ 7-day answer window needs implementation
- ⚠️ Auto-resolution logic needs implementation

### Step 4: RoundBuy Resolution Suggestions
**Timeline: 3 days (closes at 00:00 UK time)**
- RoundBuy provides automatic resolutions
- Suggestions are non-binding
- ⚠️ Auto-resolution generation needs implementation

### Step 5: Final Decision
**Timeline: Immediate after 3 days**
- Users "Agree" or "Disagree" with resolution
- Agree → Case ENDED (solved)
- Disagree → Case ENDED + Arbitration suggestion
- ⚠️ Arbitration flow needs implementation

---

## Current Implementation Status

### ✅ COMPLETED (Backend)

#### Database Schema
- ✅ `disputes` table with all required fields
- ✅ `dispute_messages` table
- ✅ `dispute_evidence` table
- ✅ `dispute_eligibility_checks` table
- ✅ `dispute_resolutions` table
- ✅ `support_tickets` table
- ✅ `support_ticket_messages` table
- ✅ `support_ticket_attachments` table
- ✅ `deleted_advertisements` table
- ✅ `notifications` table

#### API Endpoints (Backend)
- ✅ POST `/disputes` - Create dispute
- ✅ GET `/disputes` - Get user disputes
- ✅ GET `/disputes/:id` - Get dispute by ID
- ✅ POST `/disputes/:id/messages` - Add message
- ✅ GET `/disputes/:id/messages` - Get messages
- ✅ POST `/disputes/:id/evidence` - Upload evidence
- ✅ GET `/disputes/:id/evidence` - Get evidence
- ✅ PUT `/disputes/:id/status` - Update status
- ✅ GET `/resolution/all` - Get all resolution items
- ✅ GET `/resolution/exchanges` - Get exchanges
- ✅ GET `/resolution/issues` - Get issues
- ✅ GET `/resolution/ended` - Get ended cases
- ✅ GET `/support/all` - Get all support items
- ✅ GET `/support/appeals` - Get appeals
- ✅ GET `/support/tickets` - Get tickets
- ✅ GET `/support/deleted-ads` - Get deleted ads

#### Services
- ✅ DisputeService with basic CRUD operations
- ✅ SupportService with ticket management
- ✅ Basic deadline calculation (3 days for negotiation)

---

## ⚠️ PENDING IMPLEMENTATION

### 1. Timeline Management System
**Priority: HIGH**

#### Missing Features:
- ❌ Issue creation with 3-day deadline
- ❌ Dispute escalation with 20-day deadline
- ❌ Claim phase with 7-day deadline
- ❌ Resolution suggestion phase with 3-day deadline
- ❌ Automatic deadline enforcement at 00:00 UK time
- ❌ Deadline expiration handlers
- ❌ Auto-close cases when deadlines expire

#### Required Tables/Fields:
```sql
ALTER TABLE disputes ADD COLUMN issue_deadline TIMESTAMP NULL;
ALTER TABLE disputes ADD COLUMN dispute_deadline TIMESTAMP NULL;
ALTER TABLE disputes ADD COLUMN claim_deadline TIMESTAMP NULL;
ALTER TABLE disputes ADD COLUMN resolution_deadline TIMESTAMP NULL;
ALTER TABLE disputes ADD COLUMN current_phase ENUM('issue', 'dispute', 'claim', 'resolution', 'ended') DEFAULT 'issue';
```

### 2. Issue/Negotiation Flow
**Priority: HIGH**

#### Missing:
- ❌ Create "Issue" (separate from Dispute)
- ❌ Accept/Reject Issue functionality
- ❌ Auto-escalate to Dispute on rejection
- ❌ Auto-close on acceptance
- ❌ Issue status tracking

#### Required Implementation:
```javascript
// New service methods needed:
- createIssue(data)
- acceptIssue(issueId, userId)
- rejectIssue(issueId, userId)
- escalateToDispute(issueId)
```

### 3. Claim & Documentation Phase
**Priority: HIGH**

#### Missing:
- ❌ Claim creation functionality
- ❌ Answer submission for claims
- ❌ Track who answered/didn't answer
- ❌ Auto-resolution based on answers
- ❌ Winner determination logic

#### Required:
```sql
CREATE TABLE dispute_claims (
  id INT PRIMARY KEY AUTO_INCREMENT,
  dispute_id INT NOT NULL,
  created_by INT NOT NULL,
  claim_description TEXT,
  claim_deadline TIMESTAMP,
  buyer_answered BOOLEAN DEFAULT FALSE,
  seller_answered BOOLEAN DEFAULT FALSE,
  buyer_answer TEXT,
  seller_answer TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dispute_id) REFERENCES disputes(id)
);
```

### 4. Automatic Resolution System
**Priority: MEDIUM**

#### Missing:
- ❌ AI/Rule-based resolution suggestions
- ❌ Resolution recommendation engine
- ❌ Non-binding suggestion generation
- ❌ User agreement/disagreement tracking

#### Required:
```javascript
// New service methods:
- generateResolutionSuggestions(disputeId)
- agreeWithResolution(disputeId, userId)
- disagreeWithResolution(disputeId, userId)
```

### 5. Arbitration System
**Priority: LOW**

#### Missing:
- ❌ Arbitration request functionality
- ❌ Arbitration process flow
- ❌ External arbitration integration

### 6. Notification System
**Priority: HIGH**

#### Partially Implemented:
- ✅ Notifications table exists
- ❌ Automatic notification triggers
- ❌ Email notifications
- ❌ Push notifications
- ❌ SMS notifications (optional)

#### Required Notifications:
1. Issue created → Both parties
2. Issue accepted/rejected → Both parties
3. Dispute issued → Both parties
4. Evidence submitted → Other party
5. Deadline approaching (24h, 48h warnings)
6. Deadline expired → Both parties
7. Resolution suggested → Both parties
8. Case ended → Both parties

### 7. Deadline Enforcement (Cron Jobs)
**Priority: HIGH**

#### Missing:
- ❌ Scheduled job to check deadlines
- ❌ Auto-escalate issues to disputes
- ❌ Auto-close expired cases
- ❌ Send deadline warnings
- ❌ UK timezone handling (00:00 GMT/BST)

#### Required:
```javascript
// Cron jobs needed:
- checkIssueDeadlines() // Run hourly
- checkDisputeDeadlines() // Run hourly
- checkClaimDeadlines() // Run hourly
- checkResolutionDeadlines() // Run hourly
- sendDeadlineWarnings() // Run daily
```

### 8. Mobile App UI
**Priority: HIGH**

#### Missing Screens:
- ❌ Create Issue screen
- ❌ Issue details screen (Accept/Reject)
- ❌ Dispute creation from Issue
- ❌ Claim submission screen
- ❌ Resolution agreement screen
- ❌ Timeline/Progress indicator
- ❌ Deadline countdown timers

### 9. Admin Panel
**Priority: MEDIUM**

#### Missing Features:
- ❌ View all disputes/issues
- ❌ Manual intervention capabilities
- ❌ Override deadlines
- ❌ Assign to staff
- ❌ Generate reports
- ❌ Dispute analytics dashboard

---

## Implementation Priority Order

### Phase 1: Critical (Week 1-2)
1. **Timeline Management System**
   - Add deadline fields to disputes table
   - Implement phase tracking
   - Create deadline calculation utilities

2. **Issue/Negotiation Flow**
   - Create Issue endpoints
   - Accept/Reject functionality
   - Auto-escalation logic

3. **Notification System**
   - Set up notification triggers
   - Email integration
   - Push notification setup

### Phase 2: Essential (Week 3-4)
4. **Claim & Documentation Phase**
   - Create claims table
   - Claim submission endpoints
   - Answer tracking logic

5. **Deadline Enforcement**
   - Set up cron jobs
   - UK timezone handling
   - Auto-escalation/closure logic

6. **Mobile App UI**
   - Issue creation screen
   - Issue details screen
   - Timeline indicators

### Phase 3: Important (Week 5-6)
7. **Automatic Resolution System**
   - Resolution suggestion engine
   - Agreement/disagreement tracking
   - Case closure logic

8. **Admin Panel**
   - Dispute management interface
   - Manual intervention tools
   - Basic analytics

### Phase 4: Nice-to-Have (Week 7+)
9. **Arbitration System**
   - Arbitration request flow
   - External integration (if needed)

10. **Advanced Features**
    - SMS notifications
    - Advanced analytics
    - AI-powered resolutions

---

## Estimated Development Time

- **Phase 1 (Critical)**: 80-100 hours
- **Phase 2 (Essential)**: 60-80 hours
- **Phase 3 (Important)**: 40-60 hours
- **Phase 4 (Nice-to-Have)**: 40-60 hours

**Total**: 220-300 hours (5-7 weeks with 1 developer)

---

## Next Immediate Steps

1. ✅ Review and approve this analysis
2. Create detailed technical specifications for Phase 1
3. Update database schema with new fields
4. Implement Issue creation and management
5. Set up basic notification system
6. Create mobile app screens for Issue flow
7. Implement deadline tracking and enforcement

