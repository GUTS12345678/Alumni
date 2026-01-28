# Department Analytics Implementation Plan

**Date:** December 12, 2025  
**Feature:** Add Analytics to Department Management Page  
**Status:** Planning Phase

---

## 📊 OVERVIEW

Add comprehensive analytics for each department on the Department Management page to provide Super Admins with quick insights into department performance, alumni engagement, and trends.

---

## 🎯 OBJECTIVES

1. **Quick Analytics View**: Add expandable analytics section to each department card
2. **Key Metrics**: Display important department statistics at a glance
3. **Visual Data**: Include charts and graphs for better understanding
4. **Actionable Insights**: Help admins make data-driven decisions

---

## 📋 CURRENT STATE ANALYSIS

### Existing Department Card Structure
```tsx
Department Card:
├── Header (with background image/gradient)
│   ├── Logo
│   └── Status badge
├── Body
│   ├── Description
│   ├── Basic Stats (2 metrics)
│   │   ├── Courses Count
│   │   └── Alumni Count
│   └── Action Buttons (View, Settings, Edit, Delete)
```

### Available Data Points
- ✅ Courses count
- ✅ Alumni profiles count
- ✅ Department status
- ✅ Created/Updated dates
- ❌ Employment statistics
- ❌ Survey responses
- ❌ Graduation trends
- ❌ Alumni engagement metrics

---

## 🎨 PROPOSED DESIGN

### Option 1: Expandable Analytics Section (RECOMMENDED)
```
┌─────────────────────────────────────┐
│ Department Card                      │
│ ┌─────────────────────────────────┐ │
│ │ Header (with image)             │ │
│ └─────────────────────────────────┘ │
│ Description                          │
│ ┌──────────┬──────────┬──────────┐  │
│ │ Courses  │ Alumni   │ [NEW]    │  │
│ │    12    │   456    │ More...  │  │
│ └──────────┴──────────┴──────────┘  │
│ ┌─────────────────────────────────┐ │
│ │ 📊 View Analytics ▼             │ │ ← EXPANDABLE
│ └─────────────────────────────────┘ │
│ [Actions: View | Settings | Edit ]  │
└─────────────────────────────────────┘

When Expanded:
┌─────────────────────────────────────┐
│ 📊 Analytics (Expanded)              │
│ ┌──────────────────────────────────┐│
│ │ 📈 Employment Stats              ││
│ │ • Employed: 85%                  ││
│ │ • Job-matched: 75%               ││
│ │ • Avg Salary: ₱45,000           ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ 📋 Survey Engagement             ││
│ │ • Response Rate: 68%             ││
│ │ • Completed: 312/456             ││
│ └──────────────────────────────────┘│
│ ┌──────────────────────────────────┐│
│ │ 🎓 Graduation Trends             ││
│ │ [Mini Bar Chart]                 ││
│ └──────────────────────────────────┘│
│ [View Full Analytics Report →]      │
└─────────────────────────────────────┘
```

### Option 2: Analytics Modal (Alternative)
- Add "Analytics" button to action row
- Opens full-screen modal with comprehensive charts
- Better for detailed analysis but requires extra click

### Option 3: Quick Stats Badges (Lightweight)
- Add 2-3 more stat badges to existing grid
- No expansion needed
- Limited information display

---

## 📊 ANALYTICS METRICS TO DISPLAY

### Phase 1: Basic Analytics (Immediate)
1. **Employment Metrics**
   - Total employed alumni (%)
   - Job-matched employment (%)
   - Average salary range

2. **Survey Engagement**
   - Survey response rate (%)
   - Number of completed surveys
   - Last survey participation date

3. **Alumni Activity**
   - Active alumni (%)
   - Recent logins (last 30 days)
   - Profile completion rate

4. **Growth Trends**
   - New alumni (last 6 months)
   - Graduation year distribution
   - Alumni by batch

### Phase 2: Advanced Analytics (Future)
5. **Geographic Distribution**
   - Alumni locations (map)
   - Top cities/countries

6. **Career Progression**
   - Position levels
   - Industry distribution
   - Career changes

7. **Engagement Score**
   - Overall department engagement rating
   - Trend over time

8. **Comparison Metrics**
   - vs Other departments
   - vs Institution average

---

## 🔧 TECHNICAL IMPLEMENTATION

### Backend Requirements

#### 1. New API Endpoint
```php
// Route
GET /api/v1/admin/super-admin/departments/{id}/analytics

// Response Structure
{
  "success": true,
  "data": {
    "department_id": 1,
    "employment": {
      "total_alumni": 456,
      "employed_count": 388,
      "employed_percentage": 85.09,
      "job_matched_count": 342,
      "job_matched_percentage": 75.00,
      "average_salary": 45000,
      "salary_range": {
        "min": 15000,
        "max": 120000
      }
    },
    "surveys": {
      "total_sent": 456,
      "total_completed": 312,
      "response_rate": 68.42,
      "last_participation": "2025-12-01"
    },
    "activity": {
      "active_alumni": 234,
      "active_percentage": 51.32,
      "recent_logins_30d": 156,
      "profile_completion_avg": 78.5
    },
    "growth": {
      "new_alumni_6m": 45,
      "graduation_years": [
        {"year": 2024, "count": 89},
        {"year": 2023, "count": 112},
        {"year": 2022, "count": 98}
      ],
      "total_batches": 15
    }
  }
}
```

#### 2. Controller Method
```php
// app/Http/Controllers/Admin/SuperAdminDepartmentController.php

public function getAnalytics($id)
{
    $department = Department::findOrFail($id);
    
    // Employment statistics
    $employment = $this->getEmploymentStats($department);
    
    // Survey statistics
    $surveys = $this->getSurveyStats($department);
    
    // Activity statistics
    $activity = $this->getActivityStats($department);
    
    // Growth statistics
    $growth = $this->getGrowthStats($department);
    
    return response()->json([
        'success' => true,
        'data' => [
            'department_id' => $department->id,
            'employment' => $employment,
            'surveys' => $surveys,
            'activity' => $activity,
            'growth' => $growth,
        ]
    ]);
}
```

#### 3. Database Queries
```php
private function getEmploymentStats($department)
{
    $alumni = $department->alumniProfiles()->get();
    $employed = $alumni->where('employment_status', 'employed');
    
    return [
        'total_alumni' => $alumni->count(),
        'employed_count' => $employed->count(),
        'employed_percentage' => $alumni->count() > 0 
            ? round(($employed->count() / $alumni->count()) * 100, 2) 
            : 0,
        // ... more calculations
    ];
}
```

### Frontend Implementation

#### 1. Add State Management
```tsx
const [expandedAnalytics, setExpandedAnalytics] = useState<number | null>(null);
const [analyticsData, setAnalyticsData] = useState<Record<number, any>>({});
const [loadingAnalytics, setLoadingAnalytics] = useState<Record<number, boolean>>({});
```

#### 2. Fetch Analytics Function
```tsx
const fetchDepartmentAnalytics = async (departmentId: number) => {
    if (analyticsData[departmentId]) return; // Already loaded
    
    setLoadingAnalytics(prev => ({ ...prev, [departmentId]: true }));
    
    try {
        const response = await fetch(`/api/v1/admin/super-admin/departments/${departmentId}/analytics`);
        const data = await response.json();
        
        if (data.success) {
            setAnalyticsData(prev => ({ ...prev, [departmentId]: data.data }));
        }
    } catch (error) {
        console.error('Error fetching analytics:', error);
    } finally {
        setLoadingAnalytics(prev => ({ ...prev, [departmentId]: false }));
    }
};
```

#### 3. Toggle Analytics
```tsx
const toggleAnalytics = (departmentId: number) => {
    if (expandedAnalytics === departmentId) {
        setExpandedAnalytics(null);
    } else {
        setExpandedAnalytics(departmentId);
        fetchDepartmentAnalytics(departmentId);
    }
};
```

#### 4. Analytics Component
```tsx
<AnimatePresence>
    {expandedAnalytics === department.id && (
        <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="border-t border-gray-200 bg-gray-50"
        >
            {loadingAnalytics[department.id] ? (
                <div className="p-6 flex justify-center">
                    <RefreshCw className="h-6 w-6 animate-spin text-maroon-600" />
                </div>
            ) : (
                <DepartmentAnalyticsContent 
                    data={analyticsData[department.id]} 
                />
            )}
        </motion.div>
    )}
</AnimatePresence>
```

---

## 🎨 UI COMPONENTS NEEDED

### 1. Analytics Toggle Button
```tsx
<button
    onClick={() => toggleAnalytics(department.id)}
    className="w-full py-2 text-sm font-medium text-maroon-600 hover:bg-maroon-50 rounded-lg transition-colors flex items-center justify-center gap-2"
>
    <BarChart3 className="h-4 w-4" />
    <span>View Analytics</span>
    <ChevronDown className={`h-4 w-4 transition-transform ${
        expandedAnalytics === department.id ? 'rotate-180' : ''
    }`} />
</button>
```

### 2. Stat Card Component
```tsx
interface StatCardProps {
    icon: React.ComponentType<any>;
    label: string;
    value: string | number;
    subtitle?: string;
    color: 'blue' | 'green' | 'purple' | 'orange';
}

const StatCard = ({ icon: Icon, label, value, subtitle, color }: StatCardProps) => {
    const colors = {
        blue: 'bg-blue-100 text-blue-600',
        green: 'bg-green-100 text-green-600',
        purple: 'bg-purple-100 text-purple-600',
        orange: 'bg-orange-100 text-orange-600',
    };
    
    return (
        <div className="bg-white rounded-lg p-4 border border-gray-200">
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${colors[color]}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                    <p className="text-xs text-gray-500">{label}</p>
                    <p className="text-xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-600">{subtitle}</p>}
                </div>
            </div>
        </div>
    );
};
```

### 3. Mini Chart Component (Optional)
```tsx
import { Line, Bar } from 'react-chartjs-2';

const MiniTrendChart = ({ data }: { data: any[] }) => {
    return (
        <div className="h-20">
            <Line
                data={{
                    labels: data.map(d => d.label),
                    datasets: [{
                        data: data.map(d => d.value),
                        borderColor: '#7f1d1d',
                        tension: 0.4,
                    }]
                }}
                options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                }}
            />
        </div>
    );
};
```

---

## 📱 RESPONSIVE DESIGN

### Desktop (lg+)
- 3 cards per row
- Full analytics details visible
- Charts displayed inline

### Tablet (md)
- 2 cards per row
- Condensed analytics view
- Smaller charts

### Mobile (sm)
- 1 card per row
- Vertical stack of stats
- No charts (or very small)

---

## ⚡ PERFORMANCE CONSIDERATIONS

### 1. Lazy Loading
- Only fetch analytics when expanded
- Cache analytics data per session
- Don't fetch again if already loaded

### 2. Pagination
- If many departments, consider virtual scrolling
- Or implement "Load More" button

### 3. Debouncing
- Debounce analytics toggle to prevent rapid clicks
- Show loading state during fetch

### 4. Caching Strategy
```tsx
// Cache for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const analyticsCache = useRef<Map<number, { data: any, timestamp: number }>>(new Map());

const getCachedAnalytics = (deptId: number) => {
    const cached = analyticsCache.current.get(deptId);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
        return cached.data;
    }
    return null;
};
```

---

## 🚀 IMPLEMENTATION PHASES

### Phase 1: Backend Setup (Day 1)
- [ ] Create analytics endpoint
- [ ] Write helper methods for calculations
- [ ] Test with sample data
- [ ] Document API response

### Phase 2: Basic UI (Day 2)
- [ ] Add expandable section to cards
- [ ] Create basic stat cards
- [ ] Implement toggle animation
- [ ] Add loading states

### Phase 3: Data Integration (Day 3)
- [ ] Connect to API
- [ ] Display employment stats
- [ ] Display survey stats
- [ ] Add error handling

### Phase 4: Enhanced Features (Day 4)
- [ ] Add activity metrics
- [ ] Add growth trends
- [ ] Implement caching
- [ ] Add "View Full Report" link

### Phase 5: Polish & Testing (Day 5)
- [ ] Responsive design adjustments
- [ ] Animation refinements
- [ ] Performance optimization
- [ ] User testing

---

## 🎯 SUCCESS METRICS

1. **Usability**: Analytics loads in < 1 second
2. **Engagement**: Super admins use analytics 70%+ of the time
3. **Performance**: No impact on page load time
4. **Accuracy**: Data matches full analytics reports

---

## 🔄 FUTURE ENHANCEMENTS

1. **Export Functionality**
   - Download analytics as PDF/CSV
   - Share reports via email

2. **Comparison Tools**
   - Compare multiple departments
   - Benchmark against institution average

3. **Predictive Analytics**
   - Forecast alumni employment trends
   - Predict survey response rates

4. **Real-time Updates**
   - WebSocket integration
   - Live activity indicators

5. **Custom Metrics**
   - Allow admins to configure which metrics to show
   - Personalized dashboard

---

## 📝 NOTES

- Keep analytics lightweight initially
- Focus on actionable insights
- Ensure data privacy compliance
- Consider adding analytics caching at Redis level
- May need to optimize database queries for large datasets

---

## 🔗 RELATED FEATURES

- Department Dashboard (already exists)
- Full Analytics Report Page (create link to it)
- Export/Download functionality
- Notification system for significant changes

---

## ✅ IMPLEMENTATION COMPLETE

### Phase 1: Backend Setup ✅
- [x] Created `getAnalytics()` method in DepartmentController
- [x] Added helper methods for calculations:
  - `calculateSurveyStats()` - Survey engagement metrics
  - `calculateActivityStats()` - Alumni activity tracking
  - `calculateGrowthStats()` - Growth trend analysis
- [x] API endpoint available at `/api/v1/admin/departments/{id}/analytics`
- [x] Leveraged existing Department model analytics methods

### Phase 2: Frontend UI ✅
- [x] Added Framer Motion for smooth animations
- [x] Imported necessary icons (BarChart3, ChevronDown, RefreshCw, etc.)
- [x] Created state management:
  - `expandedAnalytics` - Track which card is expanded
  - `analyticsData` - Cache fetched analytics
  - `loadingAnalytics` - Loading states per department
- [x] Added `fetchDepartmentAnalytics()` function with caching
- [x] Added `toggleAnalytics()` function for expand/collapse

### Phase 3: UI Components ✅
- [x] Analytics toggle button with rotating chevron
- [x] Expandable analytics section with smooth animation
- [x] Four stat card sections:
  - **Employment Stats** (green) - Employment rate, time to employment
  - **Survey Engagement** (blue) - Response rate, completed surveys
  - **Alumni Activity** (purple) - Active alumni, recent logins, profile completion
  - **Growth Trends** (orange) - New alumni, total batches
- [x] Loading spinner during data fetch
- [x] Responsive design maintained

### What Works Now:
1. **Click "View Analytics"** button on any department card
2. **Smooth expansion** animation reveals analytics
3. **Color-coded sections** for easy scanning
4. **Session caching** - data only fetched once per session
5. **Click again to collapse** - saves space
6. **Only shows for active departments** - hidden for deleted ones

### Data Displayed:
- ✅ Employment rate percentage
- ✅ Average time to employment (days)
- ✅ Survey response rate
- ✅ Completed vs total surveys
- ✅ Active alumni percentage (90-day login)
- ✅ Recent logins (30 days)
- ✅ Profile completion average
- ✅ New alumni in last 6 months
- ✅ Total graduation batches

### Technical Details:
- **API Route:** `/api/v1/admin/departments/{id}/analytics`
- **Animation Library:** Framer Motion (already installed)
- **Caching Strategy:** In-memory per session (no re-fetch if already loaded)
- **Performance:** Lazy loading - only fetches when expanded
- **Build Status:** ✅ Successful (11.12s)

---

**Status:** ✅ IMPLEMENTED & READY FOR TESTING  
**Implementation Time:** ~2 hours  
**Build Time:** 11.12s  
**Priority:** High  
**Dependencies:** None - All complete!

