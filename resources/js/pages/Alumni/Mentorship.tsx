import React, { useState } from 'react';
import { Head, router, usePage } from '@inertiajs/react';
import AlumniBaseLayout from '@/components/base/AlumniBaseLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Heart, Users, UserPlus, MessageCircle, Search, Filter, Star, Calendar, MapPin, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface Mentor {
    id: number;
    name: string;
    email: string;
    graduation_year?: number;
    current_position?: string;
    current_company?: string;
    expertise?: string[];
    mentoring_experience?: string;
    availability?: string;
    rating?: number;
    review_count?: number;
}

interface Props {
    mentors: {
        data: Mentor[];
        current_page: number;
        last_page: number;
    };
    filters: {
        search?: string;
        expertise?: string;
    };
}

export default function Mentorship({ mentors, filters }: Props) {
    const { flash } = usePage().props as any;
    const [search, setSearch] = useState(filters.search || '');
    const [expertise, setExpertise] = useState(filters.expertise || 'all');
    const [showMentorModal, setShowMentorModal] = useState(false);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
    const [requestMessage, setRequestMessage] = useState('');

    const handleSearch = () => {
        router.get('/alumni/mentorship', { search, expertise: expertise === 'all' ? '' : expertise }, { preserveState: true });
    };

    const requestMentorship = (mentor: Mentor) => {
        setSelectedMentor(mentor);
        setShowRequestModal(true);
    };

    const submitMentorshipRequest = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMentor) return;

        router.post('/alumni/mentorship/request', {
            mentor_id: selectedMentor.id,
            message: requestMessage,
        }, {
            onSuccess: () => {
                setShowRequestModal(false);
                setRequestMessage('');
            },
        });
    };

    const becomeMentor = () => {
        setShowMentorModal(true);
    };

    return (
        <AlumniBaseLayout title="Mentorship Program">
            <Head title="Mentorship Program" />

            <div className="max-w-6xl mx-auto space-y-6">
                <div className="flex items-center space-x-3">
                    <Heart className="h-8 w-8 text-maroon-600" />
                    <div>
                        <h1 className="text-3xl font-bold text-maroon-800">Mentorship Program</h1>
                        <p className="text-gray-600">Connect with mentors or become a mentor</p>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded">
                        {flash.success}
                    </div>
                )}

                <div className="grid md:grid-cols-2 gap-6">
                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <Users className="h-5 w-5 mr-2" />
                                Find a Mentor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="Search mentors..."
                                        className="border-beige-300"
                                        value={search}
                                        onChange={(e) => setSearch(e.target.value)}
                                        onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    />
                                    <Select value={expertise} onValueChange={setExpertise}>
                                        <SelectTrigger className="w-40 border-beige-300">
                                            <SelectValue placeholder="Expertise" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All Areas</SelectItem>
                                            <SelectItem value="technology">Technology</SelectItem>
                                            <SelectItem value="business">Business</SelectItem>
                                            <SelectItem value="engineering">Engineering</SelectItem>
                                            <SelectItem value="design">Design</SelectItem>
                                            <SelectItem value="marketing">Marketing</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handleSearch} className="bg-maroon-700 hover:bg-maroon-800">
                                        <Search className="h-4 w-4" />
                                    </Button>
                                </div>

                                {mentors.data.length === 0 ? (
                                    <div className="text-center py-8">
                                        <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                        <h3 className="text-md font-semibold text-gray-700 mb-2">
                                            No Mentors Found
                                        </h3>
                                        <p className="text-sm text-gray-500">
                                            Try adjusting your search criteria
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4 max-h-96 overflow-y-auto">
                                        {mentors.data.map((mentor) => (
                                            <Card key={mentor.id} className="border-beige-200">
                                                <CardContent className="pt-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <h4 className="font-semibold text-maroon-800">{mentor.name}</h4>
                                                            <p className="text-sm text-gray-600">{mentor.email}</p>

                                                            {mentor.current_position && mentor.current_company && (
                                                                <p className="text-sm text-gray-700 mt-1">
                                                                    <Briefcase className="h-3 w-3 inline mr-1" />
                                                                    {mentor.current_position} at {mentor.current_company}
                                                                </p>
                                                            )}

                                                            {mentor.graduation_year && (
                                                                <p className="text-sm text-gray-700">
                                                                    <Calendar className="h-3 w-3 inline mr-1" />
                                                                    Class of {mentor.graduation_year}
                                                                </p>
                                                            )}

                                                            {mentor.expertise && mentor.expertise.length > 0 && (
                                                                <div className="flex flex-wrap gap-1 mt-2">
                                                                    {mentor.expertise.slice(0, 2).map((skill, index) => (
                                                                        <Badge key={index} variant="outline" className="text-xs">
                                                                            {skill}
                                                                        </Badge>
                                                                    ))}
                                                                </div>
                                                            )}

                                                            {mentor.rating && (
                                                                <div className="flex items-center mt-2">
                                                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                                    <span className="text-sm text-gray-600 ml-1">
                                                                        {mentor.rating} ({mentor.review_count} reviews)
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                        <Button
                                                            onClick={() => requestMentorship(mentor)}
                                                            className="bg-maroon-700 hover:bg-maroon-800 text-white ml-4"
                                                        >
                                                            Request
                                                        </Button>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}

                                {mentors.last_page > 1 && (
                                    <div className="flex justify-center gap-2">
                                        {Array.from({ length: mentors.last_page }, (_, i) => i + 1).map((page) => (
                                            <Button
                                                key={page}
                                                variant={page === mentors.current_page ? 'default' : 'outline'}
                                                onClick={() => router.get('/alumni/mentorship', { ...filters, page })}
                                                className={page === mentors.current_page ? 'bg-maroon-700' : ''}
                                            >
                                                {page}
                                            </Button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-beige-200 shadow-lg">
                        <CardHeader>
                            <CardTitle className="text-xl text-maroon-800 flex items-center">
                                <Heart className="h-5 w-5 mr-2" />
                                Become a Mentor
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-center py-8">
                                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-md font-semibold text-gray-700 mb-2">
                                    Share Your Experience
                                </h3>
                                <p className="text-sm text-gray-500 mb-4">
                                    Help other alumni grow in their careers by becoming a mentor
                                </p>
                                <Button onClick={becomeMentor} className="bg-maroon-700 hover:bg-maroon-800 text-white">
                                    Sign Up as Mentor
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Mentorship Request Modal */}
                <Dialog open={showRequestModal} onOpenChange={setShowRequestModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-maroon-800">
                                Request Mentorship from {selectedMentor?.name}
                            </DialogTitle>
                            <DialogDescription>
                                Send a personalized message explaining why you'd like to connect with this mentor.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={submitMentorshipRequest} className="space-y-4">
                            <div>
                                <Label htmlFor="message">Message *</Label>
                                <Textarea
                                    id="message"
                                    value={requestMessage}
                                    onChange={(e) => setRequestMessage(e.target.value)}
                                    className="border-beige-300 min-h-32"
                                    placeholder="Introduce yourself and explain what you'd like to learn from this mentor..."
                                    required
                                />
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowRequestModal(false)}>
                                    Cancel
                                </Button>
                                <Button type="submit" className="bg-maroon-700 hover:bg-maroon-800">
                                    Send Request
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Become Mentor Modal */}
                <Dialog open={showMentorModal} onOpenChange={setShowMentorModal}>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle className="text-2xl text-maroon-800">Become a Mentor</DialogTitle>
                            <DialogDescription>
                                Help fellow alumni by sharing your experience and knowledge.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-4">
                            <p className="text-gray-700">
                                Thank you for your interest in becoming a mentor! Our team will review your profile and
                                contact you soon to discuss how you can contribute to the mentorship program.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                <h4 className="font-semibold text-blue-800 mb-2">What happens next?</h4>
                                <ul className="text-sm text-blue-700 space-y-1">
                                    <li>• We'll review your professional background</li>
                                    <li>• You'll receive training on effective mentoring</li>
                                    <li>• You'll be matched with mentees based on your expertise</li>
                                    <li>• You'll have access to mentoring resources and community</li>
                                </ul>
                            </div>

                            <div className="flex justify-end gap-2 pt-4">
                                <Button type="button" variant="outline" onClick={() => setShowMentorModal(false)}>
                                    Cancel
                                </Button>
                                <Button
                                    onClick={() => {
                                        router.post('/alumni/mentorship/become-mentor');
                                        setShowMentorModal(false);
                                    }}
                                    className="bg-maroon-700 hover:bg-maroon-800"
                                >
                                    Express Interest
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AlumniBaseLayout>
    );
}
