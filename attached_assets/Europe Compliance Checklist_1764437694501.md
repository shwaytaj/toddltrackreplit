# Toddl.Health - Europe Launch Compliance Checklist

**Target Market:** Ireland (Year 1), expanding to UK and EU  
**Last Updated:** November 10, 2025  
**Status:** Pre-Launch Compliance Requirements

---

## Overview

This document outlines all compliance requirements for launching Toddl.Health in Europe, with specific focus on GDPR compliance for health data and children's information.

**Key Compliance Areas:**
- ✅ GDPR (General Data Protection Regulation)
- ✅ Children's Data Protection
- ✅ Health Data Processing (Article 9 GDPR - Special Category Data)
- ✅ Technical Security Requirements
- ✅ Operational Compliance

**NOT Required for Europe-Only Launch:**
- ❌ HIPAA (US only)
- ❌ COPPA (US only - GDPR covers this in EU)
- ❌ CCPA (California only)

---

## 1. GDPR Compliance (Mandatory)

### 1.1 Legal Documents

#### Privacy Policy
**What it is:** A legal document explaining how you collect, use, store, and protect user data.

**Must include:**
- What data you collect (medical history, child's name, age, milestones)
- Why you collect it (personalized recommendations, milestone tracking)
- How long you keep it (data retention period)
- User rights (access, deletion, portability)
- Legal basis for processing (consent for medical data)
- How to contact you with privacy questions

**Examples to reference:**
- [BabySparks Privacy Policy](https://babysparks.com/privacy/) - Good example for baby app
- [Huckleberry Privacy Policy](https://huckleberrycare.com/privacy-policy) - Another baby/health app
- [ICO Privacy Notice Guide](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/individual-rights/the-right-to-be-informed/what-privacy-information-should-we-provide/) - UK regulator guidance
- [GDPR Privacy Notice Requirements](https://gdpr.eu/privacy-notice/) - Official GDPR guidance

**Cost:** €2,000-5,000 with lawyer review

---

#### Terms of Service (ToS)
**What it is:** Contract between you and users outlining rules for using your app.

**Must include:**
- What your service does and doesn't do (medical disclaimer!)
- User responsibilities
- Intellectual property rights
- Limitation of liability
- Dispute resolution
- Termination conditions

**Examples to reference:**
- [Wonder Weeks Terms](https://www.thewonderweeks.com/terms-of-service/) - Baby milestone app
- [Kinedu Terms of Service](https://kinedu.com/terms-of-service/) - Activity recommendation app
- [Termly ToS Generator](https://termly.io/resources/templates/terms-and-conditions-template/) - Template with examples

**Cost:** Usually bundled with Privacy Policy (€2,000-5,000 total)

---

#### Cookie Policy
**What it is:** Explanation of cookies/tracking technologies you use.

**Only needed if you use:**
- Analytics cookies (Google Analytics, Mixpanel, etc.)
- Authentication cookies
- Preference cookies (save user settings)
- Marketing/advertising cookies

**Examples:**
- [Cookiebot Cookie Policy Example](https://www.cookiebot.com/en/cookie-policy/)
- [Simple Cookie Policy Template](https://www.termsfeed.com/blog/sample-cookies-policy-template/)

**Note:** For a mobile app, you may have minimal cookies. If you're web-based, this is essential.

**Cost:** Usually included in privacy policy package

---

#### Consent Forms
**What it is:** Separate, explicit consent mechanisms for sensitive data processing.

**Required consent forms:**

1. **Medical History Consent**
   - "I consent to Toddl processing my child's medical history to provide personalized milestone recommendations"
   - Must be separate checkbox (not bundled)
   - Must be optional (app works without it, just less personalized)
   - User can withdraw consent anytime

2. **Child Data Processing Consent**
   - Verifiable parental consent before collecting child's name/data
   - "I am the parent/legal guardian and consent to processing my child's data"

**Examples:**
- [GDPR Consent Examples](https://gdpr.eu/consent-examples/)
- [ICO Valid Consent Guidance](https://ico.org.uk/for-organisations/guide-to-data-protection/guide-to-the-general-data-protection-regulation-gdpr/consent/what-is-valid-consent/)
- [Parental Consent Mechanisms](https://gdpr.eu/childrens-data/)

**Implementation Examples:**
```
Example Flow in App:

Screen 1: "Welcome to Toddl!"
[Continue]

Screen 2: "To provide personalized recommendations, we'd like to know about your child's development"
□ I consent to sharing my child's medical history for personalized recommendations
□ I consent to processing my child's data (name, age, milestones)
[I understand these are optional] [Continue]

Screen 3: "Verify Parental Consent"
Email verification + Credit card check (age gate)
OR Two-factor authentication
```

---

### 1.2 Data Protection Impact Assessment (DPIA)

**What it is:** A documented risk assessment for processing high-risk personal data (required for health data under GDPR).

**Must document:**
- What personal data you process (medical history, child's name, milestones)
- Why you need it (personalized AI recommendations)
- How you'll protect it (encryption, access controls)
- Privacy risks and how you mitigate them
- Necessity and proportionality of processing

**Templates to use:**
- [ICO DPIA Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/data-protection-impact-assessments-dpias/) - Official UK guidance
- [IAPP ICO DPIA Template](https://iapp.org/resources/article/ico-sample-dpia-template/) - Downloadable ICO template
- [French CNIL PIA Tool](https://www.cnil.fr/en/open-source-pia-software-helps-carry-out-data-protection-impact-assessment) - Free open-source downloadable software
- [CNIL PIA Main Page](https://www.cnil.fr/en/privacy-impact-assessment-pia) - Direct access to CNIL PIA tool downloads
- [Free DPIA Templates Guide](https://secureprivacy.ai/blog/free-dpia-templates) - Comparison of ICO, CNIL, and IAPP templates

**Who can do it:**
- You can DIY with templates (recommended for early stage)
- Or hire consultant (€1,500-3,000)

**Cost:** Free (DIY) or €1,500-3,000 (consultant)

---

### 1.3 User Rights Implementation

#### Right to Access
**What it is:** Users can request a copy of all their data.

**Implementation:**
- "Download My Data" button in app settings
- Export as JSON or CSV file
- Must include ALL data: medical history, milestones, activity logs, account info
- Deliver within 30 days of request

**Example:**
```json
{
  "user_account": {
    "email": "parent@example.com",
    "account_created": "2025-01-15"
  },
  "children": [
    {
      "name": "Emma",
      "date_of_birth": "2024-06-20",
      "medical_history": {
        "conditions": ["premature birth"],
        "notes": "Born at 36 weeks"
      },
      "milestones": [
        {
          "milestone": "First smile",
          "achieved_date": "2024-08-15",
          "age_months": 2
        }
      ]
    }
  ]
}
```

**Reference Examples:**
- [Google Takeout](https://takeout.google.com/) - Gold standard for data export
- [Facebook Download Your Information](https://www.facebook.com/help/212802592074644) - Another good example

---

#### Right to Deletion (Right to be Forgotten)
**What it is:** Users can request complete deletion of their account and all data.

**Implementation:**
- "Delete My Account" button in app settings
- Confirmation step ("Are you sure? This cannot be undone")
- Delete ALL data from all systems:
  - Production database
  - Backups (mark for deletion)
  - Analytics systems
  - Third-party processors (notify them to delete)
- Send confirmation email when complete

**Example Flow:**
```
User: "Delete My Account"
↓
App: "Are you sure? All your child's data and milestones will be permanently deleted."
[Cancel] [Yes, Delete Everything]
↓
System: 
- Deletes from production DB
- Flags in backups for deletion
- Notifies AWS/vendors to delete
- Sends confirmation: "Your account has been deleted"
```

---

#### Right to Portability
**What it is:** Users can export their data in a machine-readable format to move to another service.

**Implementation:**
- Same as Right to Access
- Use standard formats (JSON, CSV, XML)
- Make it easy to import elsewhere

**Cost:** Included in app development (2-3 days dev time)

---

### 1.4 Legal Basis for Processing

**What it is:** GDPR requires a "legal basis" (justification) for processing any personal data.

**Your legal bases:**

| Data Type | Legal Basis | Why |
|-----------|-------------|-----|
| Account info (email, password) | Contract | Necessary to provide the service |
| Child's name, age | Contract + Consent | Necessary for service + parental consent |
| Medical history | Explicit Consent (Article 9) | Special category data - requires explicit consent |
| Usage analytics | Legitimate Interest | Improve app performance (if anonymized) |

**Key Rules:**
- Medical history = ALWAYS explicit consent (separate checkbox)
- Child data = parental consent required
- Cannot use "legitimate interest" for medical data
- User can withdraw consent anytime

**Reference:**
- [GDPR Legal Bases Explained](https://gdpr.eu/article-6-how-to-process-personal-data-legally/)
- [ICO Lawful Basis Tool](https://ico.org.uk/for-organisations/gdpr-resources/lawful-basis-interactive-guidance-tool/)

---

### 1.5 Data Residency & International Transfers

**What it is:** Where you store data and rules for moving it outside EU/EEA.

**Requirement:**
- Store all EU user data in EU/EEA data centers
- If using US/non-EU services, ensure they have "adequate safeguards"

**Compliant Options:**
- ✅ AWS EU regions (eu-west-1 Dublin, eu-central-1 Frankfurt)
- ✅ Google Cloud EU regions
- ✅ Azure EU regions
- ✅ US providers with EU Data Processing Addendum (DPA)

**Examples:**
- [AWS GDPR Center](https://aws.amazon.com/compliance/gdpr-center/)
- [Google Cloud GDPR Resource Center](https://cloud.google.com/privacy/gdpr)

**Vendors requiring DPAs:**
- Hosting (AWS, Google Cloud, Azure)
- Email service (SendGrid, Mailgun)
- Payment processor (Stripe - already GDPR compliant)
- Analytics (if used)

---

## 2. Children's Data Protection

### 2.1 Verifiable Parental Consent

**What it is:** Proof that the person creating account is actually the parent/guardian.

**GDPR Requirement:**
- For children under 16 (or 13-16 depending on country), need verifiable parental consent
- Since you're collecting child's name + medical data, this is MANDATORY

**Implementation Methods:**

**Option 1: Email Verification + Declaration (Minimum viable)**
```
1. Parent enters email
2. Clicks verification link
3. Confirms: "I am the parent/legal guardian of [child name]"
4. Optional: Checkbox "I have authority to consent on behalf of this child"
```

**Option 2: Credit Card Verification (Stronger)**
```
1. Authorize small charge (€0.50-1.00)
2. Immediately refund
3. Proves adult (minors can't have credit cards)
```

**Option 3: ID Verification (Strongest, but friction)**
```
1. Upload ID document
2. Automated verification
3. Document deleted after verification
```

**Recommendation for Toddl:** Start with Option 1, add Option 2 at scale

**Reference:**
- [GDPR Children's Data Guide](https://gdpr.eu/childrens-data/)
- [ICO Children and GDPR](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance/)

---

### 2.2 Age-Appropriate Privacy

**What it is:** Privacy information presented in language kids could understand (if they used the app).

**For Toddl:** Not directly applicable since parents use the app, but good practice:
- Use simple language in privacy policy
- Avoid legal jargon
- Add a "Privacy for Parents" summary section

**Example:**
```
PRIVACY SUMMARY FOR PARENTS

What we collect: Your child's name, age, and developmental milestones you share
Why: To give you personalized activity recommendations
Who sees it: Only you (and our AI to generate recommendations)
How long: Until you delete your account
Your rights: Download, delete, or change your data anytime
```

---

## 3. Technical Security (Non-Negotiable)

### 3.1 End-to-End Encryption

**What it is:** Data encrypted so even you (the company) can't read it without user's key.

**Implementation:**
- Medical history encrypted on device before sending to server
- Server stores encrypted data
- Only parent has decryption key

**Example Architecture:**
```
User Device:
- Generate encryption key from user password
- Encrypt medical data with key
- Send encrypted data to server
- Key never leaves device

Your Server:
- Store encrypted blob
- Cannot read contents
- Can only return encrypted data to user

When user logs in:
- Device decrypts data locally using their key
```

**Tools/Libraries:**
- iOS: CryptoKit (Apple's framework)
- Android: Android Keystore + EncryptedSharedPreferences
- React Native: react-native-keychain + crypto-js

**Reference:**
- [iOS CryptoKit](https://developer.apple.com/documentation/cryptokit)
- [Android EncryptedSharedPreferences](https://developer.android.com/topic/security/data)
- [E2EE Implementation Guide](https://www.freecodecamp.org/news/end-to-end-encryption-explained/)

---

### 3.2 Encryption at Rest and in Transit

**Encryption at Rest:** Data encrypted when stored on servers

**Implementation:**
- ✅ AWS RDS encryption enabled
- ✅ S3 bucket encryption enabled
- ✅ Database-level encryption (PostgreSQL, MongoDB encryption)

**Example AWS Setup:**
```bash
# RDS Encryption
aws rds create-db-instance \
  --db-instance-identifier toddl-db \
  --storage-encrypted \
  --kms-key-id arn:aws:kms:eu-west-1:xxxxx

# S3 Bucket Encryption
aws s3api put-bucket-encryption \
  --bucket toddl-backups \
  --server-side-encryption-configuration \
    '{"Rules":[{"ApplyServerSideEncryptionByDefault":{"SSEAlgorithm":"AES256"}}]}'
```

**Encryption in Transit:** Data encrypted during transmission

**Implementation:**
- ✅ TLS 1.3 for all API calls
- ✅ HTTPS only (no HTTP)
- ✅ Certificate pinning (prevents man-in-the-middle attacks)

**Example Nginx Config:**
```nginx
server {
    listen 443 ssl http2;
    server_name api.toddl.health;

    ssl_certificate /etc/ssl/certs/toddl.crt;
    ssl_certificate_key /etc/ssl/private/toddl.key;
    ssl_protocols TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    # Enforce HTTPS
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
}
```

**Reference:**
- [AWS Encryption at Rest](https://docs.aws.amazon.com/whitepapers/latest/efs-encrypted-file-systems/encryption-of-data-at-rest.html)
- [TLS Best Practices](https://www.ssllabs.com/projects/best-practices/)

---

### 3.3 Secure Authentication

**What it is:** How users log in securely.

**Requirements:**
- Biometric authentication (Face ID, Touch ID, Fingerprint)
- PIN/passcode backup
- Auto-logout after inactivity (15-30 minutes)
- No password storage in plaintext

**Implementation:**

**iOS Example:**
```swift
import LocalAuthentication

func authenticateUser() {
    let context = LAContext()
    var error: NSError?
    
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, 
                               localizedReason: "Access your child's data") { success, error in
            if success {
                // User authenticated
            }
        }
    }
}
```

**Android Example:**
```kotlin
import androidx.biometric.BiometricPrompt

val biometricPrompt = BiometricPrompt(this, executor,
    object : BiometricPrompt.AuthenticationCallback() {
        override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
            // User authenticated
        }
    })

biometricPrompt.authenticate(promptInfo)
```

**Password Security:**
- Use bcrypt or Argon2 for password hashing
- Never store passwords in plaintext
- Minimum password requirements (8+ chars, mix of upper/lower/numbers)

**Reference:**
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [iOS Biometric Authentication](https://developer.apple.com/documentation/localauthentication)

---

### 3.4 Auto-Logout After Inactivity

**What it is:** App logs user out after period of inactivity (security requirement).

**Implementation:**
```javascript
// React Native Example
import { AppState } from 'react-native';

let inactivityTimer;
const INACTIVITY_TIMEOUT = 15 * 60 * 1000; // 15 minutes

function resetInactivityTimer() {
  clearTimeout(inactivityTimer);
  inactivityTimer = setTimeout(() => {
    // Log user out
    logout();
  }, INACTIVITY_TIMEOUT);
}

// Reset timer on any user interaction
<TouchableOpacity onPress={resetInactivityTimer}>
```

**Best Practices:**
- 15-30 minutes for sensitive apps
- Show warning before logout ("You'll be logged out in 1 minute")
- Allow user to adjust timeout in settings (5/15/30 min options)

---

### 3.5 Encrypted Backups

**What it is:** If users backup to iCloud/Google Drive, data must be encrypted.

**Implementation:**
- Use user-controlled encryption keys (not your keys)
- User exports encrypted backup file
- Can only be decrypted with their password

**Example:**
```
User: "Backup My Data to iCloud"
↓
App: 
1. Encrypt all data with user's password-derived key
2. Upload encrypted file to iCloud
3. User keeps password (you don't have it)
↓
To restore:
1. Download encrypted file from iCloud
2. User enters password to decrypt
```

**iOS:** Use iOS Data Protection API automatically encrypts iCloud backups
**Android:** Use EncryptedFile API before uploading to Google Drive

**Reference:**
- [iOS Data Protection](https://developer.apple.com/documentation/uikit/protecting_the_user_s_privacy/encrypting_your_app_s_files)
- [Android EncryptedFile](https://developer.android.com/reference/androidx/security/crypto/EncryptedFile)

---

### 3.6 Audit Logs

**What it is:** Record of who accessed what data and when.

**Implementation:**
- Log every access to user's medical data
- Show users in a "Privacy Dashboard" in-app
- Keep logs for 12 months (GDPR requirement)

**Example Log Structure:**
```json
{
  "timestamp": "2025-11-10T14:30:00Z",
  "action": "READ",
  "resource": "medical_history",
  "user_id": "12345",
  "ip_address": "192.168.1.1",
  "result": "success"
}
```

**In-App Display:**
```
PRIVACY DASHBOARD

Your Data Access Log:
• Nov 10, 2025 2:30pm - You viewed medical history
• Nov 9, 2025 10:15am - Recommendation engine analyzed milestones
• Nov 8, 2025 8:00pm - You updated child's profile
```

**Tools:**
- AWS CloudTrail (for infrastructure logs)
- Custom logging table in database
- Log aggregation: ELK Stack (Elasticsearch, Logstash, Kibana)

---

## 4. Infrastructure & Vendor Management

### 4.1 EU-Based Hosting

**Requirement:** Data must be stored in EU/EEA data centers.

**Compliant Options:**

**AWS EU Regions:**
- eu-west-1 (Ireland) - **RECOMMENDED for you**
- eu-central-1 (Frankfurt, Germany)
- eu-west-2 (London, UK)
- eu-west-3 (Paris, France)
- eu-north-1 (Stockholm, Sweden)

**Google Cloud EU:**
- europe-west1 (Belgium)
- europe-west2 (London)
- europe-west3 (Frankfurt)
- europe-west4 (Netherlands)

**Azure EU:**
- North Europe (Ireland)
- West Europe (Netherlands)

**Setup Example (AWS):**
```bash
# Set default region to Ireland
aws configure set region eu-west-1

# Create RDS instance in Ireland
aws rds create-db-instance \
  --db-instance-identifier toddl-production \
  --db-instance-class db.t3.small \
  --engine postgres \
  --availability-zone eu-west-1a
```

---

### 4.2 Data Processing Agreements (DPAs)

**What it is:** Legal contract with any third-party vendor that processes your users' data.

**Required for:**
- ✅ Cloud hosting (AWS, Google Cloud, Azure)
- ✅ Email service (SendGrid, Postmark, AWS SES)
- ✅ Payment processor (Stripe, Paddle)
- ✅ Analytics (if used - Mixpanel, Amplitude)
- ✅ Push notifications (Firebase, OneSignal)
- ✅ Customer support (Intercom, Zendesk)

**What DPA must include:**
- Vendor only processes data per your instructions
- Vendor has adequate security measures
- Vendor helps with user rights requests (deletion, export)
- Subprocessor list (who else they share data with)
- Data breach notification obligations

**Where to get them:**
- Most vendors have standard GDPR DPAs on their website
- Sign via their portal or download PDF

**Examples:**
- [AWS Data Processing Addendum](https://d1.awsstatic.com/legal/aws-gdpr/AWS_GDPR_DPA.pdf)
- [Stripe Data Processing Agreement](https://stripe.com/legal/dpa)
- [SendGrid DPA](https://www.twilio.com/en-us/legal/data-protection-addendum)

**Action:** Create spreadsheet of all vendors + DPA status

```
| Vendor    | Service        | DPA Signed | DPA Link                    |
|-----------|----------------|------------|-----------------------------|
| AWS       | Hosting        | ✅         | https://aws.amazon.com/...  |
| Stripe    | Payments       | ✅         | https://stripe.com/...      |
| SendGrid  | Email          | ⏳ Pending | Need to sign               |
```

---

### 4.3 No Third-Party Trackers

**What it is:** Avoid analytics/tracking tools that send user data to third parties.

**Avoid (or use carefully):**
- ❌ Google Analytics (sends data to Google)
- ❌ Facebook Pixel
- ❌ Mixpanel (unless self-hosted or properly configured)
- ❌ Hotjar, FullStory (session recording)

**Alternatives:**
- ✅ Plausible Analytics (privacy-focused, EU-hosted)
- ✅ Matomo (self-hosted analytics)
- ✅ AWS CloudWatch (first-party only)
- ✅ Simple counting (DIY analytics in your own DB)

**If you must use third-party analytics:**
- Get explicit user consent
- Anonymize IP addresses
- Disable data sharing with vendor
- Add to DPA list

**Reference:**
- [Plausible Analytics](https://plausible.io/)
- [Matomo](https://matomo.org/)

---

## 5. Operational Compliance

### 5.1 Data Protection Contact

**What it is:** Designated person responsible for privacy compliance.

**Requirements:**
- Can be you (the founder) initially
- Doesn't need to be a formal "Data Protection Officer" (DPO) unless:
  - You have 250+ employees, OR
  - You process health data at large scale (thousands of users)
  
**Action:**
- Add contact email to Privacy Policy: privacy@toddl.health
- Respond to privacy requests within 30 days

**When you need a formal DPO:**
- Processing health data for 5,000+ users
- Or hire outsourced DPO service (€500-1,500/month)

**Reference:**
- [When to appoint a DPO](https://gdpr.eu/data-protection-officer/)

---

### 5.2 Data Retention Policy

**What it is:** How long you keep user data before deleting it.

**Best Practice:**
- Keep active user data indefinitely (while account exists)
- Delete inactive accounts after 24-36 months
- Delete backups after 30-90 days
- Delete support tickets after 12-24 months

**Example Policy:**
```
DATA RETENTION POLICY

Account Data: Kept while account is active
Medical History: Kept while account is active
Backups: Deleted after 90 days
Audit Logs: Kept for 12 months
Inactive Accounts: Deleted after 24 months of inactivity

Users can delete their account anytime via app settings.
```

**Implementation:**
- Automated cron job to delete old data
- Email users before auto-deletion ("Your account will be deleted in 30 days due to inactivity")

---

### 5.3 Breach Notification Process

**What it is:** Plan for what to do if there's a data breach.

**GDPR Requirements:**
- Notify supervisory authority (Data Protection Commission in Ireland) within 72 hours
- Notify affected users if high risk to their rights

**Create Incident Response Plan:**

```
BREACH RESPONSE PLAN

1. Detect Breach (automated alerts, user report, etc.)
   ↓
2. Contain Breach (shut down compromised systems)
   ↓
3. Assess Impact
   - How many users affected?
   - What data was exposed?
   - How did it happen?
   ↓
4. Notify Authorities (within 72 hours)
   - Email: info@dataprotection.ie
   - Use DPC breach notification form
   ↓
5. Notify Users (if high risk)
   - Email: "We experienced a data breach on [date]..."
   - Explain what happened, what data was affected
   - What you're doing to fix it
   ↓
6. Remediate
   - Fix vulnerability
   - Improve security
   - Document lessons learned
```

**Contact:**
- Ireland Data Protection Commission: https://www.dataprotection.ie
- Breach notification form: https://forms.dataprotection.ie/contact

**Reference:**
- [GDPR Breach Notification](https://gdpr.eu/data-breach-notification/)
- [ICO Breach Reporting](https://ico.org.uk/for-organisations/report-a-breach/)

---

### 5.4 Records of Processing Activities (ROPA)

**What it is:** Internal document listing all personal data processing activities.

**Required information:**
- What data you process
- Why you process it (purpose)
- Who has access (internal team, vendors)
- Where it's stored (AWS eu-west-1)
- How long you keep it
- Security measures

**Example ROPA:**

```
TODDL.HEALTH - RECORDS OF PROCESSING ACTIVITIES

Activity 1: User Account Management
- Data processed: Email, password hash, account creation date
- Purpose: User authentication and account access
- Legal basis: Contract (necessary to provide service)
- Recipients: AWS (hosting), SendGrid (email)
- Storage location: AWS RDS eu-west-1 (Ireland)
- Retention: While account active, deleted upon account deletion
- Security: Encrypted at rest, TLS in transit

Activity 2: Medical History Processing
- Data processed: Child's medical conditions, developmental notes
- Purpose: Personalized milestone recommendations
- Legal basis: Explicit consent (Article 9 GDPR - special category)
- Recipients: AWS (hosting), OpenAI API (for recommendations)
- Storage location: AWS RDS eu-west-1 (Ireland), encrypted
- Retention: While account active, deleted upon account deletion
- Security: End-to-end encryption, access logs

Activity 3: Milestone Tracking
- Data processed: Child's name, age, milestone achievements, dates
- Purpose: Track development progress, generate recommendations
- Legal basis: Contract + Parental consent
- Recipients: AWS (hosting)
- Storage location: AWS RDS eu-west-1 (Ireland)
- Retention: While account active, deleted upon account deletion
- Security: Encrypted at rest, TLS in transit, audit logs
```

**Template:**
- [ICO ROPA Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/guide-to-accountability-and-governance/documentation/) - Official UK guidance with templates
- [ICO Documentation Templates](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/accountability-and-governance/documentation/how-do-we-document-our-processing-activities/) - Controller and processor templates
- [Securiti ROPA Template](https://securiti.ai/templates/records-of-processing-activities-ropa-templates/) - Free downloadable template

**Cost:** Free (DIY with template)

---

## 6. Pre-Launch Checklist Summary

### Phase 1: Legal & Documentation (Weeks 1-2)

- [ ] **Hire privacy lawyer** (€2K-5K)
  - Draft GDPR-compliant Privacy Policy
  - Draft Terms of Service
  - Draft consent forms
  
- [ ] **Complete DPIA** (DIY or consultant €1.5K-3K)
  - Document data flows
  - Assess privacy risks
  - Document mitigations

- [ ] **Create ROPA** (Free, DIY)
  - List all data processing activities
  - Document legal bases
  - Identify all vendors

---

### Phase 2: Technical Implementation (Weeks 3-4)

- [ ] **Implement encryption**
  - End-to-end encryption for medical data
  - Encryption at rest (AWS RDS encryption)
  - TLS 1.3 for all API calls

- [ ] **Build user rights features**
  - Data export function (download as JSON/CSV)
  - Account deletion (complete data removal)
  - Audit log viewer in app

- [ ] **Secure authentication**
  - Biometric authentication (Face ID/Touch ID)
  - PIN/passcode backup
  - Auto-logout after 15 minutes

- [ ] **Set up EU hosting**
  - AWS eu-west-1 (Ireland) or similar
  - Database in EU region
  - Backups in EU region

---

### Phase 3: Vendor Management (Week 5)

- [ ] **Get DPAs from all vendors**
  - AWS DPA signed
  - Stripe DPA signed
  - SendGrid/email provider DPA signed
  - Any other vendors

- [ ] **Review analytics approach**
  - Remove or properly configure third-party trackers
  - Consider privacy-friendly alternative (Plausible)
  - Get consent if using analytics

---

### Phase 4: Operational Setup (Week 6)

- [ ] **Designate data protection contact**
  - Set up privacy@toddl.health email
  - Add to Privacy Policy

- [ ] **Document retention policy**
  - Decide how long to keep data
  - Set up automated deletion for old data

- [ ] **Create breach response plan**
  - Document incident response steps
  - Save DPC contact info
  - Test breach notification process

- [ ] **Test consent flows**
  - Medical history consent works
  - Parental consent verification works
  - Users can withdraw consent

---

### Phase 5: Launch Readiness (Week 7)

- [ ] **Beta test with 5-10 users**
  - Test data export
  - Test account deletion
  - Verify encryption working
  - Check consent flows

- [ ] **Legal review**
  - Lawyer reviews all docs one final time
  - Sign off on DPIA
  - Confirm DPAs in place

- [ ] **Launch!** 🚀

---

## 7. Cost Summary

### Pre-Launch Costs

| Item | Cost | Required? |
|------|------|-----------|
| Privacy lawyer (Privacy Policy, ToS, consent forms) | €2,000-5,000 | ✅ Yes |
| DPIA consulting | €1,500-3,000 | Optional (DIY) |
| Technical implementation (encryption, data rights) | 3-4 weeks dev time | ✅ Yes |
| DPAs with vendors | Free (self-service) | ✅ Yes |
| ROPA creation | Free (DIY) | ✅ Yes |
| **Total Pre-Launch** | **€2,000-8,000** | |

### Ongoing Costs (Post-Launch)

| Item | Cost | When Needed? |
|------|------|--------------|
| EU hosting (AWS/Google Cloud) | €50-200/month | From launch |
| Outsourced DPO service | €500-1,500/month | At scale (5K+ users) |
| Security audit | €5,000-15,000 | Year 1 post-launch |
| Penetration testing | €3,000-8,000 | Year 1 post-launch |
| Bug bounty program | €500-2,000/month | Optional, Year 2+ |

---

## 8. Recommended Consultancies

For help with any of the above, contact these Ireland-based GDPR consultancies:

1. **Pembroke Privacy** (Dublin) - Healthcare specialization
   - Website: https://pembrokeprivacy.com
   - Best for: Privacy policy, DPIA, ongoing DPO support

2. **Ambit Compliance** (Ireland) - Healthcare focus
   - Website: https://www.ambitcompliance.ie
   - Best for: Healthcare data protection expertise

3. **XpertDPO** (Ireland) - Medtech expertise
   - Website: https://xpertdpo.com
   - Best for: Outsourced DPO, DPIA support

4. **Data Compliance Europe** (Dublin)
   - Website: https://www.datacomplianceeurope.eu
   - Phone: +353 1 635 1580
   - Best for: Legal + technical implementation

---

## 9. Key Resources

### Official Regulators
- [Ireland Data Protection Commission](https://www.dataprotection.ie) - Your supervisory authority
- [ICO (UK)](https://ico.org.uk) - Excellent GDPR guidance and templates
- [CNIL (France)](https://www.cnil.fr/en) - Free DPIA tool

### Templates & Tools
- [ICO GDPR Templates](https://ico.org.uk/for-organisations/sme-web-hub/)
- [GDPR.eu Resources](https://gdpr.eu/checklist/)
- [CNIL DPIA Tool](https://www.cnil.fr/en/open-source-pia-software-helps-carry-out-data-protection-assesment)

### Technical Resources
- [OWASP Mobile Security](https://owasp.org/www-project-mobile-security/)
- [AWS GDPR Center](https://aws.amazon.com/compliance/gdpr-center/)
- [Encryption Best Practices](https://www.ncsc.gov.uk/collection/mobile-device-guidance/mobile-device-encryption)

---

## 10. Next Steps

**This Week:**
1. Contact 2-3 Ireland consultancies for quotes (Pembroke, Ambit, Data Compliance Europe)
2. Ask them for: initial compliance package quote + timeline
3. Start DPA collection from vendors (AWS, Stripe, email provider)

**Next 2 Weeks:**
1. Hire lawyer/consultant for legal docs
2. Complete DPIA (DIY or with consultant)
3. Start technical implementation (encryption, data rights)

**Weeks 3-6:**
1. Finish technical implementation
2. Set up EU hosting
3. Get all DPAs signed
4. Create operational documents (retention policy, breach plan)

**Week 7:**
1. Beta test with 5-10 users
2. Final legal review
3. Launch! 🎉

---

**Questions or Need Help?**
Contact privacy@toddl.health or reach out to any of the recommended consultancies above.

**Document Version:** 1.0  
**Last Updated:** November 10, 2025  
**Next Review:** Before launch (est. January 2026)
