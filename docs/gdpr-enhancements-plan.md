# GDPR Enhancement Plan for Toddl

**Created:** November 29, 2025  
**Status:** Planned  
**Estimated Total Time:** 6-10 hours

---

## Overview

This document outlines four GDPR-related features to enhance data protection and compliance for Toddl's EU launch:

1. Application-Level Encryption
2. Pseudonymization
3. Data Processing Transparency
4. Audit Logging

---

## 1. Application-Level Encryption

### Purpose
Encrypt sensitive fields at the application level before storing in the database. Even if the database is compromised, the data remains unreadable without the encryption key.

### Fields to Encrypt

| Table | Field | Reason |
|-------|-------|--------|
| `children` | `medicalHistory` | Contains health conditions, allergies, medications |
| `children` | `name` | Personally identifiable information |
| `users` | `medicalHistory` | Family medical history |
| `childMilestones` | `notes` | May contain sensitive observations |
| `teeth` | `notes` | May contain health information |

### Technical Approach

1. **Create Encryption Service**
   - Use Node.js `crypto` module
   - Algorithm: AES-256-GCM (industry standard)
   - Generate unique IV (initialization vector) for each encryption
   - Store encrypted data as: `iv:authTag:encryptedData`

2. **Encryption Key Management**
   - Store encryption key as secret environment variable (`ENCRYPTION_KEY`)
   - Key length: 32 bytes (256 bits)
   - Never log or expose the key

3. **Implementation Steps**
   - Create `server/services/encryption.ts` utility
   - Modify storage layer to encrypt before save, decrypt on read
   - Create migration script for existing unencrypted data
   - Add encryption status indicator to data export

4. **Code Structure**
   ```typescript
   // server/services/encryption.ts
   export function encrypt(text: string): string
   export function decrypt(encryptedText: string): string
   export function isEncrypted(text: string): boolean
   ```

### Complexity
**Medium** (2-3 hours)

### Dependencies
- Requires `ENCRYPTION_KEY` secret to be set
- Migration needed for existing data

### Risks
- Losing the encryption key = data loss (key must be backed up securely)
- Performance impact for large data sets (minimal for our use case)

---

## 2. Pseudonymization

### Purpose
Replace direct identifiers (like children's names) with pseudonyms so data cannot be attributed to a specific person without additional mapping information.

### How It Works

| Current | Pseudonymized |
|---------|---------------|
| Child name: "Emma" | Pseudonym: "Child-A7X3" |
| Audit log: "User viewed Emma's data" | "User viewed Child-A7X3's data" |
| Analytics: "Emma reached milestone" | "Child-A7X3 reached milestone" |

### Technical Approach

1. **Add Pseudonym Field**
   ```typescript
   // In children table
   pseudonym: text("pseudonym").unique()
   ```

2. **Pseudonym Generation**
   - Format: `C-XXXXXX` (C = Child, 6 alphanumeric characters)
   - Generated automatically on child creation
   - Immutable once created

3. **Usage Rules**
   - Real names: Only shown in UI to authenticated parent
   - Audit logs: Always use pseudonyms
   - Analytics/exports: Use pseudonyms unless user requests real names
   - API responses: Include both (frontend uses real name, logs use pseudonym)

4. **Implementation Steps**
   - Add `pseudonym` column to `children` table
   - Create pseudonym generator utility
   - Migrate existing children (generate pseudonyms)
   - Update audit logging to use pseudonyms

### Complexity
**Low-Medium** (1-2 hours)

### Dependencies
- Schema migration required
- Should be completed before Audit Logging (audit logs will use pseudonyms)

---

## 3. Data Processing Transparency

### Purpose
Show users exactly what data we store about them, when it was collected, and why each piece of data is needed.

### User Interface

New "My Data Summary" section in Profile page:

```
📊 Your Data Summary

┌─ Account Data ─────────────────────────────────
│ Email: john@example.com
│ Purpose: Used for login and account recovery
│ Collected: November 15, 2025
│
│ Name: John Doe (optional)
│ Purpose: Personalization
│
│ Milestone Sources: CDC, NHS, WHO
│ Purpose: Filter milestones by preferred health organizations
└────────────────────────────────────────────────

┌─ Children Profiles (2) ────────────────────────
│ 
│ Emma
│ ├── Created: October 1, 2025
│ ├── Due Date: Stored for age calculations
│ ├── Medical History: Last updated Nov 20, 2025
│ ├── Milestones Tracked: 47
│ ├── Growth Measurements: 12
│ ├── Teeth Recorded: 4
│ └── AI Recommendations: 8
│
│ Liam
│ └── Created: November 10, 2025
│     └── ...
└────────────────────────────────────────────────

┌─ Data Purposes ────────────────────────────────
│ • Milestone tracking: Monitor developmental progress
│ • Growth metrics: Track physical development
│ • Medical history: Personalize AI recommendations
│ • Teeth tracking: Monitor dental development
└────────────────────────────────────────────────
```

### Technical Approach

1. **New API Endpoint**
   ```
   GET /api/user/data-summary
   ```
   Returns aggregated statistics about user's stored data

2. **Response Structure**
   ```typescript
   {
     account: {
       email: string,
       createdAt: Date,
       hasName: boolean,
       hasMilestoneSources: boolean
     },
     children: Array<{
       pseudonym: string,
       name: string,
       createdAt: Date,
       milestonesCount: number,
       growthMetricsCount: number,
       teethCount: number,
       recommendationsCount: number,
       hasMedicalHistory: boolean,
       medicalHistoryUpdatedAt: Date | null
     }>,
     totals: {
       children: number,
       milestones: number,
       growthMetrics: number,
       teeth: number,
       recommendations: number
     }
   }
   ```

3. **Implementation Steps**
   - Create `/api/user/data-summary` endpoint
   - Add new section to Profile page
   - Include explanatory text for each data category

### Complexity
**Low** (1-2 hours)

### Dependencies
None

---

## 4. Audit Logging

### Purpose
Track who accessed what data and when, for GDPR compliance and security investigations.

### Events to Log

| Action Type | Description | Details Logged |
|-------------|-------------|----------------|
| `auth.login` | User logged in | User ID, IP address, timestamp |
| `auth.logout` | User logged out | User ID, timestamp |
| `auth.failed_login` | Failed login attempt | Email (hashed), IP address |
| `child.view` | Viewed child profile | User ID, Child pseudonym |
| `child.create` | Created child profile | User ID, Child pseudonym |
| `child.update` | Updated child profile | User ID, Child pseudonym, fields changed |
| `child.delete` | Deleted child profile | User ID, Child pseudonym |
| `medical.view` | Viewed medical history | User ID, Child pseudonym |
| `medical.update` | Updated medical history | User ID, Child pseudonym |
| `milestone.update` | Updated milestone status | User ID, Child pseudonym, Milestone ID |
| `data.export` | Exported user data | User ID |
| `account.delete` | Deleted account | User ID |

### Database Schema

```typescript
export const auditLogs = pgTable("audit_logs", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id, { onDelete: "set null" }),
  action: text("action").notNull(), // e.g., "child.view"
  resourceType: text("resource_type"), // e.g., "child", "milestone"
  resourceId: text("resource_id"), // pseudonym or ID
  metadata: jsonb("metadata").$type<Record<string, any>>(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});
```

### Technical Approach

1. **Create Audit Service**
   ```typescript
   // server/services/auditLog.ts
   export async function logAction(params: {
     userId: string;
     action: string;
     resourceType?: string;
     resourceId?: string;
     metadata?: Record<string, any>;
     req?: Request;
   }): Promise<void>
   ```

2. **Add Logging to Routes**
   - Login/logout routes
   - Child CRUD routes
   - Medical history routes
   - Data export/delete routes

3. **User Audit Log Viewer**
   - New section in Profile: "Activity Log"
   - Shows last 50 actions (paginated)
   - Filter by date range and action type

4. **Data Retention**
   - Auto-delete logs older than 2 years (configurable)
   - Logs retained after account deletion for compliance (anonymized)

### Complexity
**Medium** (2-3 hours)

### Dependencies
- Pseudonymization should be completed first (logs use pseudonyms)

---

## Implementation Order

```
1. Pseudonymization (1-2 hrs)
   └── Required by Audit Logging
   
2. Audit Logging (2-3 hrs)
   └── Uses pseudonyms from step 1
   
3. Data Transparency (1-2 hrs)
   └── Can show audit log count
   
4. Encryption (2-3 hrs)
   └── Can be done in parallel with step 3
```

---

## Pre-Implementation Checklist

- [ ] Generate and securely store `ENCRYPTION_KEY` secret
- [ ] Backup existing database before migrations
- [ ] Review and approve schema changes
- [ ] Plan migration window (minimal downtime expected)

---

## Post-Implementation Verification

- [ ] Test encryption/decryption with sample data
- [ ] Verify existing data migrated correctly
- [ ] Confirm audit logs capture all required events
- [ ] Test data export includes encrypted field indicators
- [ ] Verify pseudonyms display correctly in audit logs
- [ ] UI testing for Data Transparency section

---

## Notes

- All timestamps in UTC
- Audit logs use pseudonyms, never real names
- Encryption key rotation would require re-encrypting all data
- Consider adding admin endpoint for compliance audits (future)
