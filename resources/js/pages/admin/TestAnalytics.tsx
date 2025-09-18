import React from 'react';
import AdminBaseLayout from '@/components/base/AdminBaseLayout';

export default function TestAnalytics() {
    return (
        <AdminBaseLayout title="Test Analytics">
            <div className="p-6">
                <h1 className="text-2xl font-bold text-maroon-800">Analytics Test Page</h1>
                <p className="text-maroon-600 mt-2">If you can see this, the routing is working!</p>
            </div>
        </AdminBaseLayout>
    );
}