'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
    Lightbulb,
    Plus,
    Edit,
    Trash2,
    Target,
    Calendar,
    User,
    CheckCircle,
    Clock,
    AlertTriangle
} from 'lucide-react';

export default function ClanInitiatives({ clan, canEdit, isAdmin, isClanLeader }) {
    const [initiatives] = useState([
        // Mock data - replace with actual API call
        {
            _id: '1',
            title: 'Green Campus Initiative',
            description: 'Promoting sustainability and environmental awareness across campus',
            status: 'active',
            priority: 'high',
            startDate: '2024-01-15',
            targetDate: '2024-06-30',
            progress: 65,
            assignedTo: 'Environmental Committee',
            createdBy: 'John Doe',
            createdAt: '2024-01-10'
        },
        {
            _id: '2',
            title: 'Student Mentorship Program',
            description: 'Connecting senior students with freshers for academic and career guidance',
            status: 'planning',
            priority: 'medium',
            startDate: '2024-02-01',
            targetDate: '2024-05-31',
            progress: 25,
            assignedTo: 'Academic Committee',
            createdBy: 'Jane Smith',
            createdAt: '2024-01-20'
        },
        {
            _id: '3',
            title: 'Digital Literacy Workshop Series',
            description: 'Teaching digital skills to local community members',
            status: 'completed',
            priority: 'high',
            startDate: '2023-11-01',
            targetDate: '2024-01-31',
            progress: 100,
            assignedTo: 'Tech Committee',
            createdBy: 'Mike Johnson',
            createdAt: '2023-10-25'
        }
    ]);

    const getStatusIcon = (status) => {
        switch (status) {
            case 'completed':
                return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900/20' };
            case 'active':
                return { icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900/20' };
            case 'planning':
                return { icon: Target, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900/20' };
            default:
                return { icon: AlertTriangle, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-900/20' };
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'high':
                return 'border-l-red-500';
            case 'medium':
                return 'border-l-yellow-500';
            case 'low':
                return 'border-l-green-500';
            default:
                return 'border-l-gray-500';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Clan Initiatives</h2>
                    <p className="text-zinc-500">Track and manage {clan.name} initiatives and projects</p>
                </div>
                {canEdit && (
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Initiative
                    </Button>
                )}
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {initiatives.filter(i => i.status === 'active').length}
                            </p>
                            <p className="text-xs text-zinc-500">Active</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-yellow-600">
                                {initiatives.filter(i => i.status === 'planning').length}
                            </p>
                            <p className="text-xs text-zinc-500">Planning</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {initiatives.filter(i => i.status === 'completed').length}
                            </p>
                            <p className="text-xs text-zinc-500">Completed</p>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {Math.round(initiatives.reduce((acc, i) => acc + i.progress, 0) / initiatives.length)}%
                            </p>
                            <p className="text-xs text-zinc-500">Avg Progress</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Initiatives List */}
            {initiatives.length > 0 ? (
                <div className="space-y-4">
                    {initiatives.map((initiative) => {
                        const statusInfo = getStatusIcon(initiative.status);
                        const StatusIcon = statusInfo.icon;

                        return (
                            <Card key={initiative._id} className={`border-l-4 ${getPriorityColor(initiative.priority)}`}>
                                <CardContent className="p-6">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <h3 className="text-lg font-semibold">{initiative.title}</h3>
                                                    <p className="text-zinc-600 dark:text-zinc-400 mt-1">
                                                        {initiative.description}
                                                    </p>
                                                </div>
                                                <div className="flex items-center gap-2 ml-4">
                                                    <div className={`p-1.5 rounded-full ${statusInfo.bg}`}>
                                                        <StatusIcon className={`h-4 w-4 ${statusInfo.color}`} />
                                                    </div>
                                                    <Badge variant="outline" className="capitalize">
                                                        {initiative.status}
                                                    </Badge>
                                                    <Badge 
                                                        variant={
                                                            initiative.priority === 'high' ? 'destructive' :
                                                            initiative.priority === 'medium' ? 'default' : 'secondary'
                                                        }
                                                        className="capitalize"
                                                    >
                                                        {initiative.priority}
                                                    </Badge>
                                                </div>
                                            </div>

                                            {/* Progress Bar */}
                                            <div>
                                                <div className="flex justify-between text-sm mb-1">
                                                    <span>Progress</span>
                                                    <span className="font-medium">{initiative.progress}%</span>
                                                </div>
                                                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2">
                                                    <div 
                                                        className="bg-blue-600 h-2 rounded-full transition-all" 
                                                        style={{ width: `${initiative.progress}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Details */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="h-4 w-4 text-zinc-500" />
                                                    <div>
                                                        <p className="text-zinc-500">Start Date</p>
                                                        <p className="font-medium">
                                                            {new Date(initiative.startDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <Target className="h-4 w-4 text-zinc-500" />
                                                    <div>
                                                        <p className="text-zinc-500">Target Date</p>
                                                        <p className="font-medium">
                                                            {new Date(initiative.targetDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                    <div>
                                                        <p className="text-zinc-500">Assigned To</p>
                                                        <p className="font-medium">{initiative.assignedTo}</p>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center gap-2">
                                                    <User className="h-4 w-4 text-zinc-500" />
                                                    <div>
                                                        <p className="text-zinc-500">Created By</p>
                                                        <p className="font-medium">{initiative.createdBy}</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {canEdit && (
                                            <div className="flex items-center gap-2 ml-4">
                                                <Button variant="outline" size="sm">
                                                    <Edit className="h-4 w-4 mr-2" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-12 text-center">
                        <Lightbulb className="h-12 w-12 text-zinc-400 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No initiatives yet</h3>
                        <p className="text-zinc-500 mb-4">
                            Start creating initiatives to track {clan.name}&apos;s projects and goals.
                        </p>
                        {canEdit && (
                            <Button>
                                <Plus className="h-4 w-4 mr-2" />
                                Create First Initiative
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
