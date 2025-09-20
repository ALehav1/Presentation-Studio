# Flow Test Scenarios

## 🎯 User Journey Tests

### 1. Script-First Flow
**Desktop:**
1. ✅ Welcome screen → Choose "Start with Script"
2. ✅ Script options → Choose Paste/Upload/Write
3. ✅ Enter script → Shows success message
4. ✅ Redirects to slides upload
5. ✅ Upload slides → Goes to main setup
6. ✅ Shows preparation options (Quick/Manual/AI)

**Mobile:**
- [ ] All buttons 44px+ touch targets
- [ ] No horizontal scroll issues
- [ ] Clear visual hierarchy

**Toast Messages:**
- [ ] "Script loaded successfully"
- [ ] "Slides uploaded successfully"

---

### 2. Slides-First Flow
**Desktop:**
1. ✅ Welcome screen → Choose "Start with Slides"
2. ✅ Upload slides → Shows success
3. ✅ Redirects to script flow
4. ✅ Script options → Choose method
5. ✅ Enter script → Goes to main setup
6. ✅ Shows preparation options

**Mobile:**
- [ ] PDF upload works on mobile
- [ ] Script input responsive
- [ ] No overlapping UI

**Toast Messages:**
- [ ] "Slides uploaded successfully"
- [ ] "Script loaded successfully"

---

### 3. Quick Practice Path
**Setup:**
- ✅ Content uploaded
- ✅ Choose "Quick Start"
- ✅ Navigate to practice tab

**Practice Mode:**
- ✅ Shows full script (not distributed)
- ✅ No AI guides shown
- ✅ Badge shows "Basic Practice"

**Mobile Practice:**
- [ ] No overlapping sections
- [ ] Tab switcher for Script/Guide
- [ ] Horizontal scroll for slides

---

### 4. Manual Preparation Path
**Setup:**
1. ✅ Choose "Manual Setup"
2. ✅ Opens manual alignment tool
3. ✅ Can distribute scripts
4. ✅ Can write guides
5. ✅ Save changes

**Features:**
- [ ] Auto-split option
- [ ] Per-slide script editing
- [ ] Guide creation (key points, tips)
- [ ] Visual status grid

**Mobile:**
- [ ] Responsive slide selector
- [ ] Touch-friendly editors
- [ ] Clear save/cancel buttons

---

### 5. AI Enhancement Path
**Setup:**
1. ✅ Choose "AI Setup"
2. ✅ Opens AI processor
3. ✅ Detects manual scripts if present
4. ✅ Processes content
5. ✅ Shows completion

**AI Processing:**
- [ ] Uses manual scripts if available
- [ ] Generates guides always
- [ ] Shows progress steps
- [ ] Success/error handling

**Post-Processing:**
- [ ] Button changes to "Go to Practice"
- [ ] Auto-navigates after 2s
- [ ] Badge shows "Enhanced Practice"

---

## 🐛 Edge Cases to Test

### No Script Uploaded
- [ ] Practice tab disabled/shows warning
- [ ] Preparation options show requirement
- [ ] Clear messaging

### No Slides Uploaded
- [ ] Can't reach setup page
- [ ] Stuck in upload flow
- [ ] Clear error messages

### Manual + AI Combination
- [ ] AI respects manual distribution
- [ ] Guides generated for manual scripts
- [ ] Clear status indicators

### Mobile-Specific Issues
- [ ] Pull-to-refresh disabled
- [ ] No viewport zooming
- [ ] Touch targets 44px+
- [ ] No horizontal overflow

---

## ✅ Success Criteria

1. **Consistent Flows**: Both paths lead to same setup page
2. **Clear Options**: Three distinct preparation methods
3. **Mobile First**: Everything works on phones
4. **Smart Defaults**: Can practice immediately
5. **Progressive Enhancement**: AI is optional upgrade
6. **User Control**: Manual option for precision
7. **Clear Messaging**: Toast notifications guide user
8. **No Dead Ends**: Always have next action

---

## 🔧 Implementation Checklist

- [ ] Remove old Part 1/Part 2 terminology
- [ ] Integrate PreparationOptions component
- [ ] Update all toast messages
- [ ] Test all flows on mobile
- [ ] Ensure practice modes work correctly
- [ ] Clean up duplicate components
- [ ] Update status indicators
- [ ] Fix navigation between modes
