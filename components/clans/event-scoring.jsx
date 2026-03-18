'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Award, Trophy } from 'lucide-react';
import { toast } from 'sonner';

const CLAN_NAMES = ['Maratha', 'Vijaya', 'Chola', 'Rajputana'];

export default function EventScoring({ event, isAdmin, onScoresSubmitted }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scores, setScores] = useState({});
    const [isLoading, setIsLoading] = useState(false);

    const handleScoreChange = (clanName, score) => {
        setScores(prev => ({
            ...prev,
            [clanName]: Number(score) || 0
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const response = await fetch(`/api/events/${event._id}/scores`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    clanScores: scores
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit scores');
            }

            const result = await response.json();
            
            toast.success('Event scores submitted successfully! Clan points updated.');
            setIsOpen(false);
            setScores({});
            
            if (onScoresSubmitted) {
                onScoresSubmitted(result);
            }
        } catch (error) {
            console.error('Error submitting scores:', error);
            toast.error('Failed to submit scores. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    // Don't show for incomplete events or if not admin
    if (!isAdmin || event.isCompleted) {
        return null;
    }

    const totalPoints = Object.values(scores).reduce((sum, score) => sum + (score || 0), 0);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Award className="h-4 w-4" />
                    Submit Scores
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Trophy className="h-5 w-5 text-yellow-500" />
                        Submit Event Scores
                    </DialogTitle>
                    <DialogDescription>
                        Enter points for each clan for: <strong>{event.title}</strong>
                    </DialogDescription>
                </DialogHeader>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Clan Scores */}
                    <div className="space-y-4">
                        {CLAN_NAMES.map((clanName) => (
                            <div key={clanName} className="flex items-center justify-between">
                                <Label htmlFor={`score-${clanName}`} className="font-medium">
                                    {clanName}
                                </Label>
                                <div className="w-24">
                                    <Input
                                        id={`score-${clanName}`}
                                        type="number"
                                        min="0"
                                        step="1"
                                        placeholder="0"
                                        value={scores[clanName] || ''}
                                        onChange={(e) => handleScoreChange(clanName, e.target.value)}
                                        className="text-center"
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Total Points Preview */}
                    {totalPoints > 0 && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
                            <p className="text-sm text-center">
                                <strong>Total Points to Award:</strong> {totalPoints}
                            </p>
                        </div>
                    )}

                    {/* Scores Breakdown */}
                    {Object.keys(scores).some(clan => scores[clan] > 0) && (
                        <div className="space-y-2">
                            <h4 className="text-sm font-medium">Score Breakdown:</h4>
                            <div className="space-y-1">
                                {Object.entries(scores)
                                    .filter(([_, score]) => score > 0)
                                    .sort(([_, a], [__, b]) => b - a)
                                    .map(([clanName, score], index) => (
                                        <div key={clanName} className="flex justify-between text-sm">
                                            <span className="flex items-center gap-2">
                                                <span className="w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/20 flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                {clanName}
                                            </span>
                                            <span className="font-medium">{score} pts</span>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={isLoading || totalPoints === 0}
                        >
                            {isLoading ? 'Submitting...' : 'Submit Scores'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
