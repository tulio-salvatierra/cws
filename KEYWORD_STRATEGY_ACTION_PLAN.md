# Keyword Strategy Action Plan

## Overview
Implement focused keyword strategy with ~40 high-impact keywords, assigning 1 clear primary keyword per page to prevent keyword cannibalization and strengthen rankings.

---

## 🏠 Homepage (/)

### Current State
- H1: "Local SEO Web Design Cicero | Custom Websites for Chicago Small Businesses"
- Title: "Local SEO Web Design Cicero | Custom Websites & Digital Marketing | Cicero Web Studio"
- Meta Description: "Expert local SEO and web design services in Cicero, IL..."

### Target Keywords
- **Primary**: `custom web design Chicago`
- **Secondary**: `web design Chicago`, `small business web design Chicago`, `Chicago web design studio`

### Actions Required
1. **File**: `src/components/Hero/Hero.tsx`
   - Update H1 to: "Custom Web Design in Chicago for Small Businesses" (more natural, still SEO-safe)
   - Update hero description to focus on "custom web design Chicago" and "Chicago web design studio"
   - Remove "Local SEO Web Design Cicero" from H1 (moves to landing page)
   - **Note**: This reads more naturally while still containing the full primary keyword

2. **File**: `index.html`
   - Update title: "Custom Web Design Chicago | Professional Web Design Services | Cicero Web Studio"
   - Update meta description: "Expert custom web design Chicago services for small businesses. Professional web design agency creating modern, conversion-focused websites. Chicago web design studio trusted by local businesses."

3. **File**: `src/components/Home/Home.tsx`
   - Ensure content emphasizes "custom web design Chicago" and "Chicago web design studio" naturally

---

## 👋 About Page (/about)

### Current State
- H1: "ABOUT"
- No specific keyword targeting

### Target Keywords
- **Primary**: `Cicero Web Studio`
- **Secondary**: `Chicago web design studio`, `local digital marketing agency`

### Actions Required
1. **File**: `src/components/About/About.tsx`
   - Update H1 to: "About Cicero Web Studio | Chicago Web Design Studio"
   - Update subtitle/description to include "Cicero Web Studio" and "Chicago web design studio"
   - Ensure "local digital marketing agency" appears naturally in content
   - Focus on trust, story, credibility (no hard selling)

---

## 🧩 Services Page (/services)

### Current State
- H1: "SERVICES" (via ServicesHeader component)
- Description: "Solutions to help your business STAND OUT"

### Target Keywords
- **Primary**: `professional web design services` (or consider `web design services Chicago` for stronger geo-intent)
- **Secondary**: `website redesign Chicago`, `responsive web design`, `conversion-focused web design`

### Actions Required
1. **File**: `src/components/ServicesPage/ServicesHeader/ServicesHeader.tsx`
   - Update default title to: "Professional Web Design Services" (or "Web Design Services Chicago")
   - Update default description to: "Professional web design services in Chicago including website redesign, responsive web design, and conversion-focused web design for small businesses."
   - **Important**: Add "Chicago" in H2 or first paragraph to reinforce location (service pages convert better with geo-modifiers)

2. **File**: `src/components/ServicesPage/servicesData.ts`
   - Ensure service descriptions include secondary keywords naturally
   - Add "website redesign Chicago" to relevant service descriptions
   - Include "responsive web design" and "conversion-focused web design" where appropriate
   - **Note**: If keeping current primary, ensure "Chicago" appears prominently in first paragraph to avoid weak competition with Homepage

---

## 🧠 Blog Hub (/blog)

### Current State
- H1: "BLOG"
- Description: "Insights, tips, and thoughts on web development, design, and digital business"

### Target Keywords
- **Primary**: `web design insights for small businesses`
- **Secondary**: `web design trends 2025`, `SEO strategies for small businesses`

### Actions Required
1. **File**: `src/components/Blog/Blog.tsx`
   - Update H1 to: "Web Design Insights for Small Businesses"
   - Update description to: "Expert web design insights for small businesses. Latest web design trends 2025, SEO strategies for small businesses, and actionable tips to grow your online presence."

### Realistic Expectations
- **Note**: This keyword has low search volume
- **That's OK**: Blog hubs rarely rank for competitive terms
- **Strategy**: They rank for long-tail combinations from individual articles
- **Keep H1 as written**: Don't obsess over ranking this page directly - focus on article-level rankings

---

## 📞 Contact Page (/contact)

### Current State
- H1: "GET IN TOUCH"
- No keyword targeting

### Target Keywords
- **Primary**: `web design consultation`
- **Secondary**: `local web designer Chicago`

### Actions Required
1. **File**: `src/components/Contact/Contact.tsx`
   - Update H1 to: "Web Design Consultation | Get in Touch"
   - Add subtitle: "Schedule a free web design consultation with a local web designer Chicago"
   - Include "web design consultation" and "local web designer Chicago" in content naturally

### Realistic Expectations
- **Note**: This page won't rank strongly on its own
- **SEO Value**: Comes from internal links + conversions
- **Strategy**: Link to /contact using keyword-rich anchors like:
  - "free web design consultation"
  - "talk to a Chicago web designer"
  - "schedule a web design consultation"

---

## 📝 Blog Articles

### Article Keyword Assignments

#### 1. future-of-web-development-ai-tools
- **Primary**: `AI web development tools`
- **File**: `src/data/articles.ts`
- **Actions**: Update title and meta to emphasize "AI web development tools"

#### 2. mobile-first-website-design-why-it-matters
- **Primary**: `mobile-first website design`
- **File**: `src/data/articles.ts`
- **Actions**: Update title to include "mobile-first website design" (already partially there)

#### 3. seo-strategies-that-work-2024
- **Primary**: `SEO strategies for small businesses`
- **File**: `src/data/articles.ts`
- **Actions**: Update title to emphasize "SEO strategies for small businesses"

#### 4. scalable-ecommerce-lessons
- **Primary**: `ecommerce scalability`
- **File**: `src/data/articles.ts`
- **Actions**: Update title to include "ecommerce scalability"

#### 5. choose-right-web-design-package
- **Primary**: `website redesign checklist`
- **File**: `src/data/articles.ts`
- **Actions**: Update title to "Website Redesign Checklist: How to Choose the Right Web Design Package"

#### 6. lead-capture-forms-high-performing-website-chicago
- **Primary**: `lead capture forms`
- **File**: `src/data/articles.ts`
- **Actions**: Title already includes "lead capture forms" - verify it's primary focus

---

## 📍 Landing Pages

### 1. /cicero-web-design

#### Current State
- Headline: "Affordable Web Design for Cicero & Chicago Small Businesses"
- Meta title: "Affordable Web Design in Cicero & Chicago | Cicero Web Studio"

#### Target Keywords
- **Primary**: `Cicero web design`
- **Secondary**: `affordable web design Cicero`, `Cicero small business websites`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 4-82)
   - Update headline to: "Cicero Web Design | Affordable Web Design for Small Businesses"
   - Update meta.title to: "Cicero Web Design | Affordable Web Design Cicero | Cicero Web Studio"
   - Update meta.description to emphasize "Cicero web design" and "affordable web design Cicero"
   - Add "Cicero small business websites" to content naturally

---

### 2. /chicago-digital-marketing

#### Current State
- Headline: "Chicago Digital Marketing Services | Expert Solutions for Local Businesses"
- Meta title: "Chicago Digital Marketing Services | SEO, PPC & Social Media | Cicero Web Studio"

#### Target Keywords
- **Primary**: `digital marketing Chicago`
- **Secondary**: `local SEO services Chicago`, `Google Business Profile optimization`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 83-163)
   - Update headline to: "Digital Marketing Chicago | Expert Digital Marketing Services"
   - Update meta.title to: "Digital Marketing Chicago | Local SEO & PPC Services | Cicero Web Studio"
   - Update meta.description to lead with "digital marketing Chicago"
   - Ensure "local SEO services Chicago" and "Google Business Profile optimization" appear prominently

---

### 3. /berwyn-ecommerce

#### Current State
- Headline: "E-commerce Websites for Berwyn & Suburban Chicago Businesses"
- Meta title: "E-commerce Website Development in Berwyn & Chicago | Cicero Web Studio"

#### Target Keywords
- **Primary**: `Berwyn ecommerce website`
- **Secondary**: `ecommerce website development`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 162-240)
   - Update headline to: "Berwyn Ecommerce Website | Professional Online Store Development"
   - Update meta.title to: "Berwyn Ecommerce Website | Ecommerce Website Development | Cicero Web Studio"
   - Update meta.description to lead with "Berwyn ecommerce website"
   - Include "ecommerce website development" in content

---

### 4. /oak-park-seo

#### Current State
- Headline: "Local SEO Services for Oak Park & Chicago Area Businesses"
- Meta title: "Local SEO Services in Oak Park & Chicago | Cicero Web Studio"

#### Target Keywords
- **Primary**: `Oak Park SEO services`
- **Secondary**: `on-page SEO services`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 241-319)
   - Update headline to: "Oak Park SEO Services | Local SEO for Oak Park Businesses"
   - Update meta.title to: "Oak Park SEO Services | On-Page SEO Services | Cicero Web Studio"
   - Update meta.description to lead with "Oak Park SEO services"
   - Include "on-page SEO services" in solution features

---

### 5. /elmwood-park-maintenance

#### Current State
- Headline: "Website Maintenance & Support for Elmwood Park Businesses"
- Meta title: "Website Maintenance Services in Elmwood Park | Cicero Web Studio"

#### Target Keywords
- **Primary**: `Elmwood Park website maintenance`
- **Secondary**: `website maintenance services`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 320-398)
   - Update headline to: "Elmwood Park Website Maintenance | Professional Website Support"
   - Update meta.title to: "Elmwood Park Website Maintenance | Website Maintenance Services | Cicero Web Studio"
   - Update meta.description to lead with "Elmwood Park website maintenance"
   - Ensure "website maintenance services" appears in content

---

### 6. /website-refresh-redesign

#### Current State
- Headline: "Give Your Website a Fresh Look That Brings in More Customers"
- Meta title: "Website Refresh & Redesign Services in Chicago | Cicero Web Studio"

#### Target Keywords
- **Primary**: `website refresh services`
- **Secondary**: `website redesign Chicago`

#### Actions Required
1. **File**: `src/data/landingPagesData.ts` (lines 399-477)
   - Update headline to: "Website Refresh Services | Professional Website Redesign Chicago"
   - Update meta.title to: "Website Refresh Services | Website Redesign Chicago | Cicero Web Studio"
   - Update meta.description to lead with "website refresh services"
   - Include "website redesign Chicago" prominently

---

## 🚫 Keywords to Remove/De-emphasize

These keywords should NOT be primary targets (use naturally in copy only):
- search engines
- SERP
- marketing efforts
- online presence
- target audience
- potential customers

**Action**: Review all pages and ensure these are not in H1, title tags, or meta descriptions as primary keywords. They can appear naturally in body content.

---

## 📋 Implementation Checklist

### Phase 1: Core Pages (Priority)
- [ ] Update Homepage H1, title, meta description
- [ ] Update About page H1 and content
- [ ] Update Services page H1, description
- [ ] Update Blog page H1, description
- [ ] Update Contact page H1 and content

### Phase 2: Landing Pages (High Intent)
- [ ] Update /cicero-web-design
- [ ] Update /chicago-digital-marketing
- [ ] Update /berwyn-ecommerce
- [ ] Update /oak-park-seo
- [ ] Update /elmwood-park-maintenance
- [ ] Update /website-refresh-redesign

### Phase 3: Blog Articles
- [ ] Update future-of-web-development-ai-tools
- [ ] Update mobile-first-website-design-why-it-matters
- [ ] Update seo-strategies-that-work-2024
- [ ] Update scalable-ecommerce-lessons
- [ ] Update choose-right-web-design-package
- [ ] Verify lead-capture-forms-high-performing-website-chicago

### Phase 2.5: Internal Linking Matrix (High Impact)
- [ ] Homepage → Link to all landing pages with keyword-rich anchors
- [ ] Services → Link to all landing pages with keyword-rich anchors
- [ ] Blog posts → Link to relevant service/landing pages
- [ ] Landing pages → Link to Contact page
- [ ] Use anchor text examples:
  - "custom web design Chicago"
  - "Cicero web design services"
  - "website refresh services"
  - "free web design consultation"
  - "talk to a Chicago web designer"

### Phase 4: Cleanup
- [ ] Remove de-emphasized keywords from H1/title tags
- [ ] Verify no keyword cannibalization (1 primary keyword per page)
- [ ] Test all pages load correctly
- [ ] Verify meta tags update correctly

---

## 🎯 Success Criteria

1. Each page has exactly 1 primary keyword in H1 and title tag
2. Primary keyword appears in first 100 words of content
3. Secondary keywords appear naturally throughout content
4. No keyword overlap between pages (no cannibalization)
5. All meta descriptions include primary keyword
6. Title tags are 50-60 characters
7. Meta descriptions are 150-160 characters

---

## 📊 Keyword Distribution Summary

| Page Type | Count | Primary Keywords |
|-----------|-------|------------------|
| Core Pages | 5 | custom web design Chicago, Cicero Web Studio, professional web design services, web design insights for small businesses, web design consultation |
| Landing Pages | 6 | Cicero web design, digital marketing Chicago, Berwyn ecommerce website, Oak Park SEO services, Elmwood Park website maintenance, website refresh services |
| Blog Articles | 6 | AI web development tools, mobile-first website design, SEO strategies for small businesses, ecommerce scalability, website redesign checklist, lead capture forms |
| **Total** | **17 pages** | **17 unique primary keywords** |

---

## 🔗 Internal Linking Strategy (Phase 2.5)

### Rules for Internal Linking
- **Homepage** → Link to all landing pages
- **Services** → Link to all landing pages
- **Blog posts** → Link to relevant service/landing pages
- **Landing pages** → Link to Contact page

### Anchor Text Examples
Use keyword-rich anchor text that matches target keywords:
- "custom web design Chicago" (links to homepage)
- "Cicero web design services" (links to /cicero-web-design)
- "website refresh services" (links to /website-refresh-redesign)
- "free web design consultation" (links to /contact)
- "talk to a Chicago web designer" (links to /contact)
- "digital marketing Chicago" (links to /chicago-digital-marketing)
- "Oak Park SEO services" (links to /oak-park-seo)

### Implementation Notes
- This compounds SEO gains without new content
- Distributes page authority effectively
- Helps Google understand site structure
- Improves user navigation and conversions

---

## 🔄 Next Steps After Implementation

1. **Monitor Rankings**: Track primary keyword rankings for each page
2. **Content Updates**: Add secondary keywords naturally as content grows
3. **Internal Linking**: Implement Phase 2.5 linking matrix
4. **Performance Tracking**: Monitor organic traffic for each primary keyword
5. **Iteration**: Adjust based on search performance data

---

## 💼 Business Value

This plan is not just good SEO — it's a **sellable asset**.

You can repackage this as:
- **"Keyword Strategy & Page Mapping"**
- **"Phase 1 SEO Foundation"**
- **"Technical SEO Alignment for Local Businesses"**

Most agencies don't go this deep. This gives you a competitive advantage and a repeatable framework for clients.

---

*This plan ensures clean keyword targeting, prevents cannibalization, and aligns with Google's 2025 ranking factors. With proper implementation, you'll be positioned to rank locally over 3–6 months.*

