# Toddl.Health - Consent Forms Visual Guide

**Purpose:** Show exactly how GDPR-compliant consent forms should appear in your app  
**Last Updated:** November 10, 2025

---

## Table of Contents
1. [Real App Examples (With Links)](#real-app-examples)
2. [Toddl.Health Recommended Flow (Detailed Mockups)](#toddl-recommended-flow)
3. [Design Best Practices](#design-best-practices)
4. [Technical Implementation](#technical-implementation)

---

## Real App Examples

### 1. **BabySparks** (Baby Development App)
**What to look for:** How they handle child data collection

**To see their flow:**
1. Download BabySparks app: [iOS](https://apps.apple.com/app/babysparks-development-app/id794574199) | [Android](https://play.google.com/store/apps/details?id=com.babysparks.babysparks)
2. Create a new account
3. Pay attention to their child profile creation flow

**Key screens they use:**
- Welcome/Onboarding screen
- Account creation (email/password)
- Child profile creation (name, birthdate, gender)
- Optional: Medical history questions
- Terms acceptance screen

---

### 2. **Huckleberry** (Baby Sleep & Development)
**What to look for:** Multi-stage consent with clear explanations

**To see their flow:**
1. Download Huckleberry: [iOS](https://apps.apple.com/app/huckleberry-baby-child-tracker/id1286129854) | [Android](https://play.google.com/store/apps/details?id=com.huckleberry)
2. Look at how they handle:
   - Sleep data
   - Development milestones
   - Premium subscription consent

---

### 3. **MyChart** (Healthcare App by Epic)
**What to look for:** Gold standard for medical data consent

**Why it's relevant:**
- They handle real medical records (HIPAA compliant)
- Multi-layered consent process
- Clear data sharing controls

**Key features:**
- Separate consent for different data types
- Clear toggle switches
- "Learn more" expandable sections
- Explicit "I understand" checkboxes

---

### 4. **Apple Health** (Built into iOS)
**What to look for:** Permission granularity and user control

**To see it:**
1. Open Health app on iPhone
2. Go to "Sharing" or "Apps" section
3. Notice how each data type requires separate permission

**Key principles they use:**
- Per-category permissions (not all-or-nothing)
- Can revoke anytime
- Visual indicators showing what's shared
- Clear explanations of why each permission is needed

---

## Toddl Recommended Flow

Below are detailed text-based "screenshots" of what each screen should look like.

---

## **SCREEN 1: Welcome Screen**

```
┌─────────────────────────────────────┐
│                                     │
│         [Toddl.health logo]         │
│                                     │
│    Welcome to Your Parenting        │
│         Co-Pilot                    │
│                                     │
│   Track milestones, get             │
│   personalized activity             │
│   recommendations, and              │
│   celebrate your child's            │
│   development journey               │
│                                     │
│   ┌───────────────────────────┐   │
│   │   Get Started             │   │
│   └───────────────────────────┘   │
│                                     │
│   Already have an account? Log in   │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- No data collection yet
- No consent needed
- Just introduction to app value

---

## **SCREEN 2: Create Account**

```
┌─────────────────────────────────────┐
│  ← Back           Create Account     │
│─────────────────────────────────────│
│                                     │
│  Create Your Account                │
│                                     │
│  Your Email                         │
│  ┌───────────────────────────────┐ │
│  │ parent@example.com            │ │
│  └───────────────────────────────┘ │
│                                     │
│  Create Password                    │
│  ┌───────────────────────────────┐ │
│  │ ••••••••                      │ │
│  └───────────────────────────────┘ │
│  Must be at least 8 characters     │
│                                     │
│  Your Name (Optional)               │
│  ┌───────────────────────────────┐ │
│  │ Sarah                         │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Continue                    │ │
│  └───────────────────────────────┘ │
│                                     │
│  By creating an account, you agree  │
│  to our Terms of Service and        │
│  Privacy Policy                     │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Basic account creation
- Links to Terms and Privacy Policy (must be clickable)
- No medical data yet

---

## **SCREEN 3: Email Verification**

```
┌─────────────────────────────────────┐
│           Verify Your Email          │
│─────────────────────────────────────│
│                                     │
│         📧                          │
│                                     │
│  We sent a verification link to:    │
│  parent@example.com                 │
│                                     │
│  Please click the link in the       │
│  email to verify your account       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   I've Verified My Email      │ │
│  └───────────────────────────────┘ │
│                                     │
│  Didn't receive it? Resend email    │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  🔒 Why verify?                     │
│  This confirms you're a parent or   │
│  guardian and helps keep your       │
│  child's data secure.               │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Verifiable parental consent (GDPR requirement)
- Explains why verification is needed
- Simple and non-intrusive

---

## **SCREEN 4: Create Child Profile (Part 1 - Basic Info)**

```
┌─────────────────────────────────────┐
│  ← Back       Tell Us About Your    │
│               Child                  │
│─────────────────────────────────────│
│                                     │
│  Child's First Name                 │
│  ┌───────────────────────────────┐ │
│  │ Emma                          │ │
│  └───────────────────────────────┘ │
│                                     │
│  Date of Birth                      │
│  ┌─────────┬─────────┬───────────┐ │
│  │ Month ▼ │ Day ▼   │ Year ▼   │ │
│  └─────────┴─────────┴───────────┘ │
│                                     │
│  Gender (Optional)                  │
│  ┌───────────────────────────────┐ │
│  │  ○ Girl   ○ Boy   ○ Other    │ │
│  └───────────────────────────────┘ │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  🔒 Your child's data is private    │
│  and encrypted. You can delete it   │
│  anytime.                           │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Continue                    │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Basic child information
- Privacy reassurance visible
- No consent needed yet (contract basis - necessary for service)

---

## **SCREEN 5: Parental Consent & Data Processing Agreement** ⭐ CRITICAL

```
┌─────────────────────────────────────┐
│  ← Back       Data Privacy          │
│─────────────────────────────────────│
│                                     │
│  Before we continue, we need your   │
│  permission to process Emma's data  │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║  Consent Required              ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  ☑ I am Emma's parent or legal      │
│    guardian                         │
│                                     │
│  ☑ I consent to Toddl processing    │
│    Emma's name, age, and            │
│    developmental milestones to      │
│    provide personalized activity    │
│    recommendations                  │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  📋 What data we collect:           │
│  • Child's name, age, birthdate     │
│  • Milestone achievements & dates   │
│  • Activity completion history      │
│                                     │
│  🎯 Why we need it:                 │
│  • To show age-appropriate          │
│    activities                       │
│  • To track developmental progress  │
│  • To personalize recommendations   │
│                                     │
│  🔒 How we protect it:              │
│  • All data is encrypted            │
│  • Only you can see Emma's data     │
│  • We never sell your data          │
│  • You can delete it anytime        │
│                                     │
│  ▼ View our Privacy Policy          │
│  ▼ View our Terms of Service        │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   I Understand & Agree        │ │
│  └───────────────────────────────┘ │
│                                     │
│  You can change these settings      │
│  anytime in Privacy Settings        │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- ✅ Two separate checkboxes (both required)
- ✅ Clear explanation of what/why/how
- ✅ Cannot be pre-checked
- ✅ Separate from Terms acceptance
- ✅ Can withdraw consent later
- ✅ Uses child's name for personalization ("Emma's data")

---

## **SCREEN 6: Medical History Consent (Optional)** ⭐ CRITICAL

```
┌─────────────────────────────────────┐
│  ← Back    Get More Personalized    │
│            Recommendations (Optional)│
│─────────────────────────────────────│
│                                     │
│  Help us give Emma the most         │
│  relevant activities                │
│                                     │
│  Share Emma's developmental history │
│  to get AI-powered recommendations  │
│  tailored to her unique needs       │
│                                     │
│  ╔═══════════════════════════════╗ │
│  ║  Optional - Special Category   ║ │
│  ║  Data (Health Information)     ║ │
│  ╚═══════════════════════════════╝ │
│                                     │
│  □ I consent to sharing Emma's      │
│    medical and developmental        │
│    history for personalized         │
│    recommendations                  │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  🏥 What we'll ask about:           │
│  • Birth circumstances (premature,  │
│    full-term, etc.)                 │
│  • Any diagnosed conditions         │
│  • Developmental concerns           │
│  • Therapies or interventions       │
│                                     │
│  🤖 How AI uses this:               │
│  Our AI analyzes developmental      │
│  patterns to suggest activities     │
│  that match Emma's pace and needs   │
│                                     │
│  🔐 Extra Protection:               │
│  • Medical data is end-to-end       │
│    encrypted                        │
│  • Only you have the decryption key │
│  • We cannot read this data         │
│  • Stored separately from other data│
│                                     │
│  ⚠️ This is completely optional     │
│  The app works great without this   │
│  information. You can add it later  │
│  in Settings.                       │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Yes, Personalize for Emma   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Skip for Now                │ │
│  └───────────────────────────────┘ │
│                                     │
│  You can change this anytime in     │
│  Privacy Settings → Medical History │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- ✅ Clearly marked as OPTIONAL
- ✅ Separate consent from basic data
- ✅ Explicitly labeled "Special Category Data"
- ✅ Extra security explanation
- ✅ Prominent "Skip" button
- ✅ Cannot be pre-checked
- ✅ Explains app works without it
- ✅ Shows value proposition (personalization)

---

## **SCREEN 7: Medical History Questions (If Opted In)**

```
┌─────────────────────────────────────┐
│  ← Back    Emma's Developmental      │
│            History                   │
│─────────────────────────────────────│
│                                     │
│  🔒 This information is encrypted   │
│  and only visible to you            │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  Birth Details                      │
│  ┌───────────────────────────────┐ │
│  │ Full-term (37-42 weeks) ▼     │ │
│  └───────────────────────────────┘ │
│                                     │
│  Has Emma been diagnosed with any   │
│  conditions?                        │
│  ┌───────────────────────────────┐ │
│  │  ○ No                         │ │
│  │  ○ Yes (please specify below) │ │
│  └───────────────────────────────┘ │
│                                     │
│  If yes, please describe:           │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  Is Emma receiving any therapies?   │
│  ┌───────────────────────────────┐ │
│  │ □ Physical therapy            │ │
│  │ □ Occupational therapy        │ │
│  │ □ Speech therapy              │ │
│  │ □ Other                       │ │
│  └───────────────────────────────┘ │
│                                     │
│  Any additional notes?              │
│  ┌───────────────────────────────┐ │
│  │ (Optional)                    │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Save & Continue             │ │
│  └───────────────────────────────┘ │
│                                     │
│  ⓘ Skip questions you're not       │
│    comfortable answering            │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Only shown if user opted in on previous screen
- Reassurance about encryption at top
- All fields optional within this section
- Can skip questions
- Sensitive but not clinical (not diagnosing)

---

## **SCREEN 8: Consent Summary & Settings**

```
┌─────────────────────────────────────┐
│  ← Back       You're All Set! 🎉     │
│─────────────────────────────────────│
│                                     │
│  Emma's profile is ready            │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  📊 Your Privacy Settings           │
│                                     │
│  ✓ Basic Profile                    │
│    Name, age, milestones            │
│    Status: Active                   │
│                                     │
│  ✓ Medical History                  │
│    Developmental information        │
│    Status: Shared                   │
│    [Change]                         │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  🔐 You're in Control               │
│                                     │
│  You can change these settings      │
│  anytime:                           │
│  • Settings → Privacy Settings      │
│  • Download all Emma's data         │
│  • Delete Emma's profile            │
│  • Withdraw consent for medical data│
│                                     │
│  ────────────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Start Tracking Milestones   │ │
│  └───────────────────────────────┘ │
│                                     │
│  View Privacy Settings              │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Clear summary of what was consented to
- Shows status of each consent
- Direct link to change settings
- Reinforces user control

---

## **Settings Screen: Privacy Settings**

```
┌─────────────────────────────────────┐
│  ← Settings    Privacy Settings      │
│─────────────────────────────────────│
│                                     │
│  Emma's Privacy                     │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  Data Sharing                       │
│                                     │
│  Basic Profile Data                 │
│  Required for app to function       │
│  ┌───────────────────────────────┐ │
│  │ Name, age, milestones          │ │
│  │ [●────────────] ON            │ │
│  └───────────────────────────────┘ │
│  Cannot be disabled                 │
│                                     │
│  Medical History                    │
│  For personalized recommendations   │
│  ┌───────────────────────────────┐ │
│  │ Developmental information      │ │
│  │ [●────────────] ON            │ │
│  └───────────────────────────────┘ │
│  [Withdraw Consent]                 │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  Your Rights                        │
│                                     │
│  📥 Download Emma's Data            │
│  Get a copy of all data             │
│  [Download as JSON]                 │
│                                     │
│  🗑️ Delete Emma's Profile           │
│  Permanently remove all data        │
│  [Delete Profile]                   │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  Data Access Log                    │
│                                     │
│  See when data was accessed         │
│  [View Access Log]                  │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  📄 View Privacy Policy             │
│  📄 View Terms of Service           │
│  ✉️ Contact Privacy Team            │
│      privacy@toddl.health           │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Always accessible
- Clear toggle switches
- Separate "Withdraw Consent" button
- Data download and deletion prominent
- Access log for transparency

---

## **Screen: Withdraw Medical History Consent**

```
┌─────────────────────────────────────┐
│         Withdraw Consent             │
│─────────────────────────────────────│
│                                     │
│  Are you sure you want to stop      │
│  sharing Emma's medical history?    │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  What happens:                      │
│                                     │
│  ✓ Medical history data will be     │
│    deleted immediately              │
│                                     │
│  ✓ Recommendations will become      │
│    less personalized                │
│                                     │
│  ✓ Basic milestones still tracked   │
│                                     │
│  ✓ You can opt back in anytime      │
│                                     │
│  ────────────────────────────────  │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Yes, Withdraw Consent       │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │   Cancel                      │ │
│  └───────────────────────────────┘ │
│                                     │
└─────────────────────────────────────┘
```

**Notes:**
- Clear confirmation dialog
- Explains consequences
- Easy to cancel
- Reassures data will be deleted
- Mentions can opt back in

---

## Design Best Practices

### 1. **Language & Tone**

✅ **DO:**
- Use plain, simple language
- Address the parent directly ("your child", "you can")
- Use the child's name for personalization ("Emma's data")
- Be conversational but professional
- Explain "why" not just "what"

❌ **DON'T:**
- Use legal jargon
- Use passive voice ("data may be collected")
- Make it feel scary or overwhelming
- Hide information in fine print
- Use all-caps or aggressive language

**Example:**
- ✅ Good: "We use Emma's milestones to suggest activities she's ready for"
- ❌ Bad: "Data collected for personalization purposes pursuant to Article 6(1)(a)"

---

### 2. **Visual Design**

✅ **DO:**
- Use checkboxes (not toggles) for consent
- Make consent checkboxes large and easy to tap
- Use clear visual hierarchy (headers, sections)
- Include icons for quick scanning (🔒 🎯 📋)
- Use white space generously
- Make "Learn More" expandable sections
- Show progress if multi-step

❌ **DON'T:**
- Pre-check consent boxes
- Use tiny text for important info
- Bury consent in Terms of Service
- Use confusing dual-negative phrasing
- Make it look like a legal document

---

### 3. **Consent Checkboxes - Critical Rules**

✅ **MUST HAVE:**
```
□ I am [Child Name]'s parent or legal guardian

□ I consent to Toddl processing [Child Name]'s 
  [specific data types] for [specific purpose]
```

✅ **CHARACTERISTICS:**
- TWO separate checkboxes (parent verification + data consent)
- Cannot be pre-checked
- Must be checkboxes (not toggles or buttons)
- Must be clearly visible
- Must be separate from Terms/Privacy Policy acceptance
- User must take explicit action to check them

❌ **NEVER DO:**
```
❌ By continuing, you agree to everything
❌ [●───────] Consent (toggle)
❌ ☑ I agree to Terms, Privacy Policy, and data processing (pre-checked)
```

---

### 4. **Timing & Flow**

✅ **CORRECT ORDER:**
1. Welcome (no data collection)
2. Account creation (email/password only)
3. Email verification (parental consent)
4. Basic child info (name, age - necessary for service)
5. **CONSENT SCREEN** (data processing agreement)
6. **OPTIONAL MEDICAL CONSENT** (clearly optional)
7. Medical questions (only if opted in)
8. Done!

❌ **WRONG APPROACH:**
- Asking for everything at once
- Hiding consent in onboarding flow
- Making medical consent required
- Not explaining why data is needed

---

### 5. **Transparency & Control**

✅ **ALWAYS SHOW:**
- What data you collect
- Why you need it
- How you protect it
- How to withdraw consent
- How to delete data
- Data access logs

✅ **ALWAYS ALLOW:**
- Easy withdrawal of consent
- Data download (export)
- Account/data deletion
- Changing settings anytime

---

## Technical Implementation

### React Native Example (Medical History Consent)

```jsx
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { CheckBox } from 'react-native-elements';

const MedicalHistoryConsent = ({ childName, onConsent, onSkip }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const handleContinue = () => {
    if (consentGiven) {
      // Log consent to backend
      logConsent({
        type: 'medical_history',
        timestamp: new Date().toISOString(),
        childName: childName,
        consentGiven: true
      });
      onConsent();
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>
        Get More Personalized Recommendations (Optional)
      </Text>
      
      <Text style={styles.description}>
        Help us give {childName} the most relevant activities
      </Text>

      <View style={styles.consentBox}>
        <Text style={styles.boxHeader}>
          Optional - Special Category Data (Health Information)
        </Text>
        
        <CheckBox
          title={`I consent to sharing ${childName}'s medical and developmental history for personalized recommendations`}
          checked={consentGiven}
          onPress={() => setConsentGiven(!consentGiven)}
          containerStyle={styles.checkbox}
          // CRITICAL: Never use checked={true} by default
        />
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoHeader}>🏥 What we'll ask about:</Text>
        <Text style={styles.infoText}>
          • Birth circumstances{'\n'}
          • Any diagnosed conditions{'\n'}
          • Developmental concerns{'\n'}
          • Therapies or interventions
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoHeader}>🤖 How AI uses this:</Text>
        <Text style={styles.infoText}>
          Our AI analyzes developmental patterns to suggest 
          activities that match {childName}'s pace and needs
        </Text>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.infoHeader}>🔐 Extra Protection:</Text>
        <Text style={styles.infoText}>
          • Medical data is end-to-end encrypted{'\n'}
          • Only you have the decryption key{'\n'}
          • We cannot read this data{'\n'}
          • Stored separately from other data
        </Text>
      </View>

      <View style={styles.warningBox}>
        <Text style={styles.warning}>
          ⚠️ This is completely optional. The app works great 
          without this information. You can add it later in Settings.
        </Text>
      </View>

      <TouchableOpacity 
        style={[styles.button, !consentGiven && styles.buttonDisabled]}
        onPress={handleContinue}
        disabled={!consentGiven}
      >
        <Text style={styles.buttonText}>
          Yes, Personalize for {childName}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity 
        style={styles.skipButton}
        onPress={onSkip}
      >
        <Text style={styles.skipButtonText}>Skip for Now</Text>
      </TouchableOpacity>

      <Text style={styles.footer}>
        You can change this anytime in{'\n'}
        Privacy Settings → Medical History
      </Text>
    </ScrollView>
  );
};

export default MedicalHistoryConsent;
```

---

### Backend: Logging Consent

```javascript
// Node.js/Express example
app.post('/api/consent/log', authenticateUser, async (req, res) => {
  const { userId, childId, consentType, consentGiven } = req.body;
  
  try {
    // Log consent to database
    const consentRecord = await ConsentLog.create({
      user_id: userId,
      child_id: childId,
      consent_type: consentType, // 'basic_profile' or 'medical_history'
      consent_given: consentGiven,
      timestamp: new Date(),
      ip_address: req.ip,
      user_agent: req.headers['user-agent']
    });
    
    // Also update user's current consent status
    await UserConsent.upsert({
      user_id: userId,
      child_id: childId,
      consent_type: consentType,
      status: consentGiven ? 'active' : 'withdrawn',
      last_updated: new Date()
    });
    
    // If medical consent was given, enable medical data collection
    if (consentType === 'medical_history' && consentGiven) {
      await enableMedicalDataCollection(childId);
    }
    
    // If medical consent was withdrawn, delete medical data
    if (consentType === 'medical_history' && !consentGiven) {
      await deleteMedicalData(childId);
    }
    
    res.json({ success: true, consentId: consentRecord.id });
  } catch (error) {
    console.error('Consent logging error:', error);
    res.status(500).json({ error: 'Failed to log consent' });
  }
});
```

---

### Database Schema for Consent Tracking

```sql
-- Consent Log (audit trail - never delete)
CREATE TABLE consent_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  child_id UUID NOT NULL REFERENCES children(id),
  consent_type VARCHAR(50) NOT NULL, -- 'basic_profile', 'medical_history'
  consent_given BOOLEAN NOT NULL,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address INET,
  user_agent TEXT,
  
  -- Audit fields
  created_at TIMESTAMP DEFAULT NOW()
);

-- Current Consent Status (current state)
CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  child_id UUID NOT NULL REFERENCES children(id),
  consent_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL, -- 'active', 'withdrawn', 'expired'
  last_updated TIMESTAMP NOT NULL DEFAULT NOW(),
  
  UNIQUE(user_id, child_id, consent_type)
);

-- Medical Data (only accessible if consent active)
CREATE TABLE medical_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  child_id UUID NOT NULL REFERENCES children(id),
  
  -- Encrypted fields
  birth_circumstances TEXT, -- Encrypted
  diagnosed_conditions TEXT, -- Encrypted
  therapies TEXT, -- Encrypted
  additional_notes TEXT, -- Encrypted
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Encryption key reference (user-specific)
  encryption_key_id VARCHAR(255)
);
```

---

### iOS Swift Example (Biometric Consent Confirmation)

```swift
import LocalAuthentication

func confirmMedicalDataConsent(childName: String, completion: @escaping (Bool) -> Void) {
    let context = LAContext()
    var error: NSError?
    
    // Check if biometric authentication is available
    if context.canEvaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, error: &error) {
        let reason = "Confirm consent to share \(childName)'s medical history"
        
        context.evaluatePolicy(.deviceOwnerAuthenticationWithBiometrics, 
                               localizedReason: reason) { success, authError in
            DispatchQueue.main.async {
                if success {
                    // User authenticated - log consent
                    self.logConsentToBackend(consentType: "medical_history", 
                                            childName: childName)
                    completion(true)
                } else {
                    // Authentication failed
                    completion(false)
                }
            }
        }
    } else {
        // Biometric not available - use PIN/password
        showPINConfirmation(childName: childName, completion: completion)
    }
}
```

---

## Checklist for Your Implementation

### Legal Compliance ✅

- [ ] Separate checkboxes for parent verification and data consent
- [ ] Medical history consent is clearly OPTIONAL
- [ ] Checkboxes cannot be pre-checked
- [ ] Clear explanation of what/why/how for each data type
- [ ] Link to Privacy Policy and Terms (must be clickable)
- [ ] Consent logged with timestamp and IP address
- [ ] User can withdraw consent anytime
- [ ] Medical data deleted when consent withdrawn

### UX Best Practices ✅

- [ ] Child's name used throughout for personalization
- [ ] Plain language (no legal jargon)
- [ ] Visual hierarchy (headers, icons, whitespace)
- [ ] Progress indicator if multi-step
- [ ] "Skip" button prominent for optional consent
- [ ] Reassurance about privacy/security visible
- [ ] Settings easily accessible from main menu

### Technical Implementation ✅

- [ ] Consent state tracked in backend database
- [ ] Consent log (audit trail) separate from current status
- [ ] Medical data encrypted end-to-end
- [ ] Data export function works
- [ ] Account deletion removes all data
- [ ] Access log viewable by user
- [ ] Consent verification before showing medical data

---

## Common Mistakes to Avoid

### ❌ Mistake #1: Bundled Consent
```
❌ BAD:
□ I agree to Terms of Service, Privacy Policy, 
  and consent to medical data processing
```

```
✅ GOOD:
□ I agree to Terms of Service and Privacy Policy

□ I consent to processing medical data for 
  personalized recommendations (optional)
```

---

### ❌ Mistake #2: Pre-checked Boxes
```
❌ BAD:
☑ Share medical history (recommended)
```

```
✅ GOOD:
□ Share medical history (optional)
```

---

### ❌ Mistake #3: Hidden in Fine Print
```
❌ BAD:
By continuing, you agree to data processing as 
described in our 50-page Privacy Policy.
```

```
✅ GOOD:
We'll collect:
• Child's name and age
• Milestone achievements

Why: To track progress and suggest activities

[View full Privacy Policy]
```

---

### ❌ Mistake #4: No Way to Withdraw
```
❌ BAD:
Consent given during signup. Contact 
support@email.com to request changes.
```

```
✅ GOOD:
Settings → Privacy Settings → Withdraw Consent
[One-tap to withdraw]
```

---

### ❌ Mistake #5: All-or-Nothing
```
❌ BAD:
To use Toddl, you must share medical history.
```

```
✅ GOOD:
Basic tracking works without medical data.
Share medical history for personalized recommendations (optional).
```

---

## Additional Resources

### Real App Privacy Flows to Study

1. **Health Apps:**
   - Apple Health (iOS) - Gold standard for permissions
   - MyFitnessPal - Good data granularity
   - Headspace - Clear optional data

2. **Baby/Parenting Apps:**
   - BabySparks - Child profile creation
   - Huckleberry - Sleep data consent
   - Wonder Weeks - Milestone tracking

3. **Education Apps:**
   - Khan Academy Kids - Child account setup
   - ABCmouse - Parental consent flow

### Design Resources

- [GDPR Consent Examples](https://gdpr.eu/consent-examples/)
- [ICO Children's Code Design Guidance](https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/childrens-information/childrens-code-guidance-and-resources/)
- [Nielsen Norman Group: Consent Design](https://www.nngroup.com/articles/gdpr-compliance/)

### Tools for Testing

- **Figma/Sketch** - Design mockups
- **InVision/Marvel** - Interactive prototypes
- **UsabilityHub** - Test consent flow with real users
- **Hotjar** - See where users drop off in flow

---

## Next Steps

1. **Design Phase:**
   - Create mockups in Figma based on screens above
   - Test with 5-10 parents for feedback
   - Iterate on language and flow

2. **Development Phase:**
   - Implement consent screens (reference code examples)
   - Set up consent logging backend
   - Build settings/privacy dashboard

3. **Legal Review:**
   - Have lawyer review all consent language
   - Ensure checkboxes meet GDPR requirements
   - Verify data deletion actually works

4. **Testing Phase:**
   - Test complete flow end-to-end
   - Verify consent logged correctly
   - Test withdrawal and deletion
   - Test with 10-20 beta users

---

**Questions?** Contact: privacy@toddl.health

**Document Version:** 1.0  
**Last Updated:** November 10, 2025
