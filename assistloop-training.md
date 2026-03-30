# Agency OS - Complete User Guide & Training Document
## Viral Vision Marketing Agency - Internal Operating System

---

## Overview

Agency OS is the internal operating system for Viral Vision, a video marketing agency. It manages the entire client lifecycle from lead acquisition through video production, approval, and publishing. The platform is accessible at viralvisionmk.space.

---

## Authentication & User Roles

### Login
- Access the app at the main URL
- Enter your @viralvision.com email and password
- No pre-filled credentials; users must enter their own

### User Roles
| Role | Users | Capabilities |
|------|-------|-------------|
| **Super Admin** | Jenina | Full access to all boards, user management, can create/edit/delete users, assign roles and board permissions |
| **Admin** | Santiago, Angel | Full access to all boards, can delete entries across the app |
| **Editor** | Araceli, Sergio, Rodrigo, Alex, Javier, Leonardo, Santi | Access to production, approvals, publishing, editors, knowledge base |
| **Videographer** | Sergio | Same as editor access |
| **Social Manager** | Guido | Full board access |

### Permissions
- Only Admins (Angel, Jenina, Santiago) can delete entries
- Only the Super Admin (Jenina) can access the Users management page
- Board-level permissions can be configured per user by the Super Admin

---

## Navigation

The sidebar contains all main sections:

### Overview
- **Dashboard** - Executive metrics, revenue, pipeline health, content velocity, team performance, export buttons
- **Calendar** - Monthly view of shoots, due dates, and publish dates

### Pipeline
- **Sales** - Lead management with kanban board
- **Onboarding** - Client onboarding checklist and gate
- **Clients** - All graduated clients with status tracking

### Operations
- **Production** - Video production tracking by weekly cohorts
- **Approvals** - Review and approve/reject delivered videos
- **Publishing** - Schedule and publish approved content

### Team
- **Editors** - Editor workload, capacity, and rebalance suggestions
- **Ads** - Ad campaign management

### Resources
- **Knowledge Base** - Internal documentation and SOPs
- **Activity Log** - Audit trail of all changes

### Admin (Super Admin only)
- **Users** - User account and permission management

### Other Features
- **Global Search** - Search bar at the top of the sidebar, searches across all clients, leads, videos, and campaigns
- **Notifications** - Bell icon in sidebar showing alerts for approvals needed, overdue items, revisions, and missing footage

---

## Board-by-Board Guide

### 1. Dashboard

The executive dashboard provides an at-a-glance view of agency operations.

**Top Stats:**
- Active Clients count
- Monthly Revenue (MRR)
- Videos This Week (with progress ring showing % of 86-video weekly target)
- Ad Spend

**Revenue Section:**
- MRR, Quarterly Revenue, Annual Run Rate, Average Revenue Per Client

**Pipeline Health:**
- Total Leads, Conversion Rate, Average Deal Size, Pipeline Value
- Visual breakdown of leads by stage

**Content Velocity:**
- Videos Completed, Videos In Progress, Average Turnaround, Revision Rate

**Team Performance:**
- Table of all editors with assigned/completed counts and capacity indicators

**Bottleneck Alerts:**
- Editors over capacity
- Content not scheduled ahead
- Clients stuck in same stage

**Export:**
- Click "Export Clients", "Export Leads", "Export Videos", or "Export Ads" buttons to download CSV files

---

### 2. Calendar

Monthly calendar showing all scheduled events:

**Color Coding:**
- Blue dots = Shoot days
- Red dots = Due dates
- Green dots = Publish dates

**Interaction:**
- Navigate months with left/right arrows
- Click on any day with events to see a detail panel below the calendar
- Today is highlighted in blue

---

### 3. Sales Pipeline

Kanban board with 6 stages: Lead, Call, Proposal, Follow Up, Closed Won, Closed Lost.

**Creating Leads:**
- Click "New Lead" button
- Fill in: Contact Name, Company, Email, Phone, Source, Estimated Revenue, Notes
- Attach files (drag & drop or click to upload) and add links
- Click "Create Lead"

**Moving Leads:**
- Drag and drop cards between columns to change stage
- Moving to "Closed Won" triggers a confirmation popup, then auto-creates an onboarding client

**Editing Leads:**
- Click "Edit" on any card to edit inline (the card transforms into a form)
- Make changes and click "Save" or "Cancel"

**Deleting Leads (Admin only):**
- Click "Delete" on any card
- Confirm in the popup dialog

**Filtering:**
- Use source filter pills at the top to filter by lead source

---

### 4. Onboarding

Manages the transition from closed deal to active production client.

**Client Cards:**
- Click to expand and see the full onboarding checklist
- Each client shows a progress bar and completion percentage

**Editable Fields:**
- Package: Starter, Growth, Pro, Enterprise (dropdown)
- Start Date: Date picker
- Contact Email: Text input
- Phone: Text input
- Notes: Textarea

**Onboarding Checklist (6 steps):**
1. Contract Signed
2. Invoice Paid
3. Strategy Call Done
4. Shoot Scheduled
5. Editor Assigned (with editor dropdown)
6. Social Manager Assigned (with social manager dropdown)

**Moving to Production:**
- All 6 steps must be completed (100%)
- Select which Week (1-4) to assign the client to
- Click "Move to Production" and confirm
- The client's editor, contact info, and package carry over to the new client entry
- Client appears in the Clients board as active

**Removing (Admin only):**
- Click "Remove Client" and confirm

---

### 5. Clients

Shows all clients that have graduated from onboarding.

**Features:**
- Search by client name
- Filter by status: All, Active, Churned
- View stats: Total Clients, Active, Churned, Total MRR

**Inline Editable Fields:**
- Package (dropdown)
- Monthly Revenue (number)
- Week assignment (1-4 dropdown)
- Status (active/churned dropdown)

**Columns:** Name, Package, Monthly Revenue, Week, Editor, Social Manager, Status, Email, Phone

---

### 6. Production

Manages video production organized by weekly cohorts (Week 1-4).

**Layout:**
- Collapsible week sections
- Each section shows a table of clients and their video data
- "Add Video" button to create new videos

**Inline Editable Fields:**
- Assigned Editor: Dropdown of all editors
- Shoot Date: Date picker
- Footage Uploaded: Checkbox toggle
- Editing Status: Dropdown (Not Started, Editing, Delivered, Revision, Approved)
- Ready for Posting: Auto-calculated badge
- Sent to Guido: Checkbox toggle
- Posted: Checkbox toggle
- Revisions Used: Number input

**Adding Videos:**
- Click "Add Video"
- Select Client, enter Title, choose Platform, set Shoot Date and Due Date
- Click "Create Video"

**Deleting Videos (Admin only):**
- Click delete button in the last column
- Confirm in popup

**Shoot Limit:** Warning appears when a week has 6+ shoots scheduled

---

### 7. Approvals

Review center for videos with "delivered" editing status.

**Workflow:**
- Videos appear here when editors mark them as "delivered"
- Click a video to see details and notes history
- **Approve**: Sets status to "approved" and marks as sent to Guido
- **Request Revision**: Enter revision notes, sets status back to "revision"
- Revision notes are timestamped and attributed to the reviewer

**Badge count** in the sidebar shows how many videos are awaiting approval

---

### 8. Publishing

Manages approved videos ready for scheduling and posting.

**Table Columns:**
- Video title and client name (read-only)
- Platform: Multi-select toggle pills (Instagram, TikTok, Facebook, YouTube) - click to toggle each
- Editor name
- Caption status: Click "Pending"/"Done" pill to toggle
- Thumbnail status: Click "Pending"/"Done" pill to toggle
- Scheduled Date: Inline date picker
- Posting Status: Dropdown (Pending, Scheduled, Posted)

**Weekly Grouping:** Videos organized by week with collapsible sections

**Visual Indicators:**
- Posted videos get a green-tinted row background
- Green "Posted" badge appears next to the status when posted

---

### 9. Editors / Workload

Dashboard for monitoring editor capacity and performance.

**Top Stats:** Total Editors, Weekly Target (86), Total Assigned, Completion Rate

**Editor Cards:**
- Each editor shows: name, capacity bar (green/orange/red), assigned vs cap, completed count, status badge

**Performance Table:**
- All editors with: Assigned, Capacity %, Completed, On-Time %, Avg Revisions
- Over-capacity rows highlighted in red

**Suggest Rebalance:**
- Click "Suggest Rebalance" to see auto-generated recommendations
- Algorithm identifies editors above 90% capacity and those below 60%
- Shows specific move suggestions (e.g., "Move 3 videos from Alex to Rodrigo")

---

### 10. Ads Management

Manage ad campaigns across Meta, Google, and TikTok.

**Stats:** Active Campaigns, Total Monthly Budget, Total Spent, Avg ROAS

**Filter:** All, Active, Paused, Draft, Ended

**Creating Campaigns:**
- Click "New Campaign"
- Fill in: Client, Campaign Name, Platform, Status, Budget, Spent, Creative, Schedule, Notes
- Attach files and links
- Click "Create Campaign"

**Inline Editing:**
- Click "Edit" on any row to edit in-place
- The row highlights and all fields become editable inputs
- Click "Save" to commit or "Cancel" to discard

**Status Toggle:**
- Click the status badge to toggle between Active and Paused

**Deleting (Admin only):**
- Click "Delete" and confirm

---

### 11. Knowledge Base

Internal documentation hub organized by categories.

**Categories:** Content Pipeline, Editing, Publishing, Client Management, Paid Advertising, Social Media

**Features:**
- Search across all documents
- Create new documents with title, category, author, body content
- Edit existing documents
- Delete documents (Admin only)
- Attach files and links to documents
- View attachment list on document detail page

---

### 12. Activity Log

Audit trail tracking all changes across the workspace.

**Features:**
- Shows who did what and when
- Filter by entity type: Leads, Videos, Campaigns, Documents, Users, Onboarding
- Relative timestamps (e.g., "5m ago", "2h ago")
- Color-coded action badges: created (green), updated (blue), deleted (red), moved (orange)

---

### 13. User Management (Super Admin only)

Manage user accounts and permissions.

**User Table:**
- Username, Email, Role, Board Access, Actions
- Inline role dropdown to change roles directly in the table
- Board access shown as colored pills

**Creating Users:**
- Click "Add User"
- Enter: Username, Email, Password
- Select Role: Member, Editor, Videographer, Social Manager, Admin, Super Admin
- Toggle board permissions for each section
- Click "Create User"

**Editing Users:**
- Click "Edit" to modify username, email, password, role, or permissions

**Deleting Users:**
- Cannot delete the Super Admin account
- Click "Delete" and confirm for other users

---

## Client Lifecycle Flow

```
Lead (Sales)
  -> Closed Won (confirmation popup)
    -> Onboarding (auto-created with checklist)
      -> Choose week + confirm
        -> Production (active client, editor/data carried over)
          -> Videos: Not Started -> Editing -> Delivered
            -> Approvals: Approve or Request Revision
              -> Publishing: Schedule + Post
```

**Key Gates:**
1. Sales -> Onboarding: Triggered when lead is moved to "Closed Won"
2. Onboarding -> Production: All 6 checklist items must be complete, then choose a week
3. Production -> Approvals: Videos automatically appear when editing status = "delivered"
4. Approvals -> Publishing: Videos appear when approved and marked as sent to Guido

---

## Notifications

The notification bell in the sidebar shows real-time alerts:

- Videos awaiting approval (count)
- Videos needing revision (count)
- Overdue videos (past due date, not yet approved/posted)
- Videos missing footage upload
- New leads to follow up
- Approved videos not yet scheduled

Click the bell to see all notifications. Click "Dismiss all" to close.

---

## Data Export

From the Dashboard, click any export button to download CSV files:
- **Export Clients** - Client name, revenue, week, status, editor, shoot date
- **Export Leads** - Company, contact, email, phone, source, revenue, stage
- **Export Videos** - Title, client, platform, status, shoot date, due date, posted, revisions
- **Export Ads** - Campaign name, client, platform, status, budget, spent

---

## Tips & Common Workflows

### Adding a new client from scratch:
1. Go to Sales -> New Lead
2. Fill in details and create
3. Drag to "Call" -> "Proposal" -> "Follow Up" -> "Closed Won"
4. Confirm to create onboarding entry
5. Complete all 6 onboarding steps
6. Select a week and move to production

### Checking video status:
1. Use Global Search in the sidebar to find the video by name
2. Or go to Production and expand the relevant week

### Rebalancing editor workload:
1. Go to Editors page
2. Click "Suggest Rebalance"
3. Review suggestions and manually reassign editors in Production

### Scheduling content:
1. Go to Publishing
2. Toggle caption/thumbnail status pills when ready
3. Set a scheduled date
4. Change posting status to "Scheduled" then "Posted" when live

---

## Team Contacts

| Name | Role | Email |
|------|------|-------|
| Jenina | Super Admin / Creative Director | jenina@viralvision.com |
| Angel | Admin | angel@viralvision.com |
| Santiago | Admin | santiago@viralvision.com |
| Guido | Social Manager | guido@viralvision.com |
| Alex | Editor | alex@viralvision.com |
| Araceli | Editor | araceli@viralvision.com |
| Sergio | Videographer | sergio@viralvision.com |
| Rodrigo | Editor | rodrigo@viralvision.com |
| Javier | Editor | javier@viralvision.com |
| Leonardo | Editor | leonardo@viralvision.com |
| Santi | Editor | santi@viralvision.com |

---

## FAQ

**Q: I can't see the Delete button on entries.**
A: Only Admins (Jenina, Angel, Santiago) can delete. If you're logged in as an editor or member, delete buttons are hidden.

**Q: How do I add a new team member?**
A: Only Jenina (Super Admin) can manage users. Go to the Users page in the sidebar.

**Q: Where do approved videos go?**
A: When a video is approved in the Approvals page, it moves to Publishing where it can be scheduled and posted.

**Q: How do I change which week a client is in?**
A: Go to the Clients board and use the inline Week dropdown to reassign.

**Q: How do I export data?**
A: Go to the Dashboard and click the export buttons (Export Clients, Export Leads, etc.) to download CSV files.

**Q: The notification bell shows a number. What does it mean?**
A: It shows the count of items needing attention: pending approvals, overdue videos, new leads, etc. Click it to see details.

**Q: How do I search for something?**
A: Use the search bar at the top of the sidebar. It searches across clients, leads, videos, and campaigns.
