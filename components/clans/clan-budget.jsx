'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
    DollarSign, 
    TrendingUp, 
    AlertTriangle,
    PieChart,
    Receipt,
    Calendar
} from 'lucide-react';
import BudgetController from '@/components/admin/budget-controller';

export default function ClanBudget({ clan, events, canEdit, isAdmin }) {
    const budgetUtilization = clan.budgetAllocated > 0 
        ? (clan.budgetSpent / clan.budgetAllocated) * 100 
        : 0;

    const budgetRemaining = (clan.budgetAllocated || 0) - (clan.budgetSpent || 0);

    // Calculate event-wise budget usage
    const eventBudgetData = events
        .filter(event => event.budgetRequested > 0)
        .map(event => ({
            title: event.title,
            date: event.date,
            budgetRequested: event.budgetRequested,
            budgetApproved: event.budgetApproved || 0,
            budgetSpent: event.budgetSpent || 0,
            approvalStatus: event.approvalStatus
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));

    const totalEventBudget = eventBudgetData.reduce((sum, event) => sum + (event.budgetSpent || 0), 0);

    return (
        <div className="space-y-6">
            {/* Budget Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Allocated Budget</p>
                                <p className="text-2xl font-bold text-green-600">
                                    ₹{clan.budgetAllocated?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-2 bg-green-100 dark:bg-green-900/20 rounded-full">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Budget Spent</p>
                                <p className="text-2xl font-bold text-red-600">
                                    ₹{clan.budgetSpent?.toLocaleString() || 0}
                                </p>
                            </div>
                            <div className="p-2 bg-red-100 dark:bg-red-900/20 rounded-full">
                                <TrendingUp className="h-6 w-6 text-red-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-zinc-500">Remaining Budget</p>
                                <p className={`text-2xl font-bold ${
                                    budgetRemaining < 0 
                                        ? 'text-red-600' 
                                        : budgetRemaining < (clan.budgetAllocated * 0.1)
                                        ? 'text-yellow-600'
                                        : 'text-blue-600'
                                }`}>
                                    ₹{budgetRemaining.toLocaleString()}
                                </p>
                            </div>
                            <div className={`p-2 rounded-full ${
                                budgetRemaining < 0 
                                    ? 'bg-red-100 dark:bg-red-900/20' 
                                    : 'bg-blue-100 dark:bg-blue-900/20'
                            }`}>
                                <DollarSign className={`h-6 w-6 ${
                                    budgetRemaining < 0 ? 'text-red-600' : 'text-blue-600'
                                }`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Budget Utilization */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                        <span className="flex items-center gap-2">
                            <PieChart className="h-5 w-5" />
                            Budget Utilization
                        </span>
                        {budgetUtilization > 90 && (
                            <Badge variant="destructive" className="flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                High Usage
                            </Badge>
                        )}
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <div className="flex justify-between text-sm mb-2">
                            <span>Budget Used</span>
                            <span className={
                                budgetUtilization > 90 
                                    ? "text-red-600 font-medium" 
                                    : budgetUtilization > 75 
                                    ? "text-yellow-600 font-medium" 
                                    : "text-green-600 font-medium"
                            }>
                                {budgetUtilization.toFixed(1)}%
                            </span>
                        </div>
                        <Progress 
                            value={Math.min(budgetUtilization, 100)} 
                            className="h-3"
                        />
                    </div>

                    {isAdmin && (
                        <div className="pt-4 border-t">
                            <BudgetController
                                entityId={clan._id}
                                entityType="CLAN"
                                currentBudget={clan.budgetAllocated || 0}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Event-wise Budget Breakdown */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Receipt className="h-5 w-5" />
                        Event Budget Breakdown
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {eventBudgetData.length > 0 ? (
                        <div className="space-y-4">
                            {eventBudgetData.map((event, index) => (
                                <div key={index} className="p-4 border rounded-lg space-y-2">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h4 className="font-medium">{event.title}</h4>
                                            <p className="text-sm text-zinc-500 flex items-center gap-2">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(event.date).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-semibold">
                                                ₹{(event.budgetSpent || 0).toLocaleString()}
                                            </p>
                                            <Badge 
                                                variant={
                                                    event.approvalStatus === 'APPROVED' ? 'success' : 
                                                    event.approvalStatus === 'REJECTED' ? 'destructive' : 'outline'
                                                }
                                                className="text-xs"
                                            >
                                                {event.approvalStatus || 'PENDING'}
                                            </Badge>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-4 text-xs text-zinc-500">
                                        <div>
                                            <p>Requested</p>
                                            <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                                ₹{event.budgetRequested.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p>Approved</p>
                                            <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                                ₹{event.budgetApproved.toLocaleString()}
                                            </p>
                                        </div>
                                        <div>
                                            <p>Spent</p>
                                            <p className="font-medium text-zinc-700 dark:text-zinc-300">
                                                ₹{(event.budgetSpent || 0).toLocaleString()}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            <div className="pt-4 border-t">
                                <div className="flex justify-between items-center">
                                    <p className="font-medium">Total Event Spending</p>
                                    <p className="text-lg font-bold">₹{totalEventBudget.toLocaleString()}</p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <Receipt className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                            <p className="text-zinc-500">No events with budget allocation found</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
