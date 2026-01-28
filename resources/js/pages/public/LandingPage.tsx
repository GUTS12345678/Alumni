import { Link } from '@inertiajs/react';
import {
    GraduationCap,
    Users,
    Briefcase,
    TrendingUp,
    Shield,
    Globe,
    ArrowRight,
    CheckCircle,
    Star,
    MessageCircle,
    BarChart3,
    Award
} from 'lucide-react';
import { useState, useEffect } from 'react';
import AppearanceToggleDropdown from '@/components/appearance-dropdown';

interface LandingPageProps {
    stats?: {
        totalAlumni: number;
        employmentRate: number;
        activeJobs: number;
        surveysCompleted: number;
    };
}

export default function LandingPage({ stats }: LandingPageProps) {
    const [scrollY, setScrollY] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const [appearanceSettings, setAppearanceSettings] = useState<{
        logoLight: string | null;
        logoDark: string | null;
    }>({ logoLight: null, logoDark: null });

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY);
        window.addEventListener('scroll', handleScroll);
        setIsVisible(true);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // Fetch appearance settings
    useEffect(() => {
        const fetchAppearanceSettings = async () => {
            try {
                const response = await fetch('/api/v1/public/appearance', {
                    headers: {
                        'Accept': 'application/json',
                        'X-Requested-With': 'XMLHttpRequest',
                    },
                });

                if (response.ok) {
                    const data = await response.json();
                    if (data.success && data.data) {
                        setAppearanceSettings({
                            logoLight: data.data.logo_light_path,
                            logoDark: data.data.logo_dark_path,
                        });
                    }
                }
            } catch (error) {
                console.error('Failed to fetch appearance settings:', error);
            }
        };

        fetchAppearanceSettings();
    }, []);

    const features = [
        {
            icon: Users,
            title: "Alumni Network",
            description: "Connect with thousands of graduates worldwide and build meaningful professional relationships.",
            color: "from-maroon-500 to-maroon-600"
        },
        {
            icon: Briefcase,
            title: "Career Opportunities",
            description: "Access exclusive job postings and career development resources tailored for alumni.",
            color: "from-maroon-600 to-maroon-700"
        },
        {
            icon: TrendingUp,
            title: "Track Progress",
            description: "Monitor your career journey and celebrate milestones with your alma mater community.",
            color: "from-maroon-500 to-beige-600"
        },
        {
            icon: BarChart3,
            title: "Analytics & Insights",
            description: "Gain valuable insights into employment trends and career trajectories of fellow alumni.",
            color: "from-maroon-600 to-maroon-800"
        },
        {
            icon: MessageCircle,
            title: "Mentorship Programs",
            description: "Connect with experienced mentors or become one to guide the next generation.",
            color: "from-maroon-500 to-maroon-700"
        },
        {
            icon: Award,
            title: "Recognition & Events",
            description: "Participate in exclusive alumni events and receive recognition for your achievements.",
            color: "from-maroon-700 to-maroon-800"
        }
    ];

    const benefits = [
        "Real-time job matching based on your profile",
        "Secure and verified alumni directory",
        "Advanced career analytics dashboard",
        "Mobile-friendly responsive design",
        "Regular employment surveys and feedback",
        "Direct communication with institution"
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-maroon-50 via-beige-50 to-maroon-100 text-maroon-900 overflow-hidden">
            {/* Animated Background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 -left-4 w-72 h-72 bg-maroon-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                <div className="absolute top-0 -right-4 w-72 h-72 bg-beige-200 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                <div className="absolute -bottom-8 left-20 w-72 h-72 bg-maroon-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
            </div>

            {/* Navigation */}
            <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-white/95 backdrop-blur-lg shadow-lg' : 'bg-transparent'}`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <div className="flex items-center space-x-3">
                            {appearanceSettings.logoLight || appearanceSettings.logoDark ? (
                                <img
                                    src={`/storage/${appearanceSettings.logoLight || appearanceSettings.logoDark}`}
                                    alt="Alumni Tracer Logo"
                                    className="w-12 h-12 object-contain rounded-xl transform hover:rotate-12 transition-transform"
                                />
                            ) : (
                                <div className="w-12 h-12 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-xl flex items-center justify-center transform hover:rotate-12 transition-transform">
                                    <GraduationCap className="w-7 h-7 text-white" />
                                </div>
                            )}
                            <div>
                                <h1 className="text-2xl font-bold text-maroon-900">
                                    Alumni Tracer
                                </h1>
                                <p className="text-xs text-maroon-600">Stay Connected, Track Your Career</p>
                            </div>
                        </div>
                        <div className="flex items-center space-x-4">
                            <AppearanceToggleDropdown />
                            <Link
                                href="/login"
                                className="px-6 py-2.5 text-maroon-600 hover:text-maroon-900 transition-colors"
                            >
                                Sign In
                            </Link>
                            <Link
                                href="/survey/register"
                                className="px-6 py-2.5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-lg font-semibold text-white transition-all transform hover:scale-105 shadow-lg"
                            >
                                Get Started
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 px-4 sm:px-6 lg:px-8">
                <div className={`max-w-7xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div className="space-y-8">
                            <div className="inline-flex items-center space-x-2 bg-maroon-100 border border-maroon-200 rounded-full px-4 py-2">
                                <Globe className="w-4 h-4 text-maroon-600" />
                                <span className="text-sm text-maroon-700">Connecting Alumni Worldwide</span>
                            </div>
                            <h1 className="text-5xl lg:text-7xl font-bold leading-tight text-maroon-900">
                                Your Career Journey
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Starts Here
                                </span>
                            </h1>
                            <p className="text-xl text-maroon-600 leading-relaxed">
                                Join thousands of successful alumni in our vibrant community. Track your career progress,
                                discover opportunities, and stay connected with your alma mater.
                            </p>
                            <div className="flex flex-wrap gap-4">
                                <Link
                                    href="/survey/register"
                                    className="group px-8 py-4 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-xl font-semibold text-white transition-all transform hover:scale-105 shadow-2xl flex items-center space-x-2"
                                >
                                    <span>Join Now</span>
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </Link>
                                <Link
                                    href="#features"
                                    className="px-8 py-4 bg-white/60 hover:bg-white/80 backdrop-blur-sm border border-maroon-200 rounded-xl font-semibold text-maroon-900 transition-all"
                                >
                                    Learn More
                                </Link>
                            </div>

                            {/* Stats */}
                            {stats && (
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-8">
                                    {[
                                        { label: 'Alumni', value: stats.totalAlumni.toLocaleString(), icon: Users },
                                        { label: 'Employment', value: `${stats.employmentRate}%`, icon: TrendingUp },
                                        { label: 'Active Jobs', value: stats.activeJobs.toLocaleString(), icon: Briefcase },
                                        { label: 'Surveys', value: stats.surveysCompleted.toLocaleString(), icon: BarChart3 }
                                    ].map((stat, index) => (
                                        <div key={index} className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl border border-maroon-100">
                                            <stat.icon className="w-6 h-6 mx-auto mb-2 text-maroon-600" />
                                            <div className="text-2xl font-bold text-maroon-900">{stat.value}</div>
                                            <div className="text-sm text-maroon-600">{stat.label}</div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* 3D Illustration */}
                        <div className="relative lg:h-[600px] flex items-center justify-center">
                            <div className="absolute inset-0 bg-gradient-to-r from-maroon-200/20 to-beige-200/20 rounded-3xl blur-3xl"></div>
                            <div className="relative w-full h-full flex items-center justify-center">
                                <div className="w-80 h-80 bg-gradient-to-br from-maroon-100/40 to-beige-100/40 rounded-full flex items-center justify-center backdrop-blur-sm border border-maroon-200 animate-pulse-slow">
                                    <GraduationCap className="w-40 h-40 text-maroon-600" />
                                </div>
                                {/* Floating Icons */}
                                <div className="absolute top-10 left-10 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float">
                                    <Users className="w-8 h-8 text-maroon-600" />
                                </div>
                                <div className="absolute top-20 right-10 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float animation-delay-2000">
                                    <Briefcase className="w-8 h-8 text-maroon-700" />
                                </div>
                                <div className="absolute bottom-20 left-20 p-4 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 animate-float animation-delay-4000">
                                    <TrendingUp className="w-8 h-8 text-maroon-600" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="text-center mb-16">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-4 text-maroon-900">
                            Powerful Features for
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Success
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-600 max-w-2xl mx-auto">
                            Everything you need to build and maintain a thriving professional network
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {features.map((feature, index) => (
                            <div
                                key={index}
                                className="group p-8 bg-white/60 backdrop-blur-sm rounded-2xl border border-maroon-100 hover:border-maroon-200 hover:bg-white/80 transition-all duration-300 hover:transform hover:scale-105 shadow-lg hover:shadow-xl"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <div className={`w-14 h-14 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center mb-6 group-hover:rotate-12 transition-transform`}>
                                    <feature.icon className="w-7 h-7 text-white" />
                                </div>
                                <h3 className="text-2xl font-bold mb-3 text-maroon-900">{feature.title}</h3>
                                <p className="text-maroon-600 leading-relaxed">{feature.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white/40">
                <div className="max-w-7xl mx-auto">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        <div>
                            <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-maroon-900">
                                Why Choose
                                <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                    Alumni Tracer?
                                </span>
                            </h2>
                            <p className="text-xl text-maroon-600 mb-8">
                                Our platform is designed with cutting-edge technology to provide the best experience for alumni and institutions.
                            </p>
                            <div className="space-y-4">
                                {benefits.map((benefit, index) => (
                                    <div key={index} className="flex items-start space-x-3 group">
                                        <div className="w-6 h-6 bg-gradient-to-br from-maroon-500 to-maroon-600 rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-maroon-700 group-hover:text-maroon-900 transition-colors font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="relative">
                            <div className="bg-gradient-to-br from-maroon-100/40 to-beige-100/40 rounded-3xl p-8 backdrop-blur-sm border border-maroon-200">
                                <div className="space-y-6">
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Shield className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Secure & Private</div>
                                            <div className="text-sm text-maroon-600">Your data is protected with enterprise-grade security</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Star className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Trusted by Thousands</div>
                                            <div className="text-sm text-maroon-600">Join a community of successful professionals</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-4 p-4 bg-white/60 rounded-xl border border-maroon-100">
                                        <Globe className="w-10 h-10 text-maroon-600" />
                                        <div>
                                            <div className="font-semibold text-maroon-900">Global Reach</div>
                                            <div className="text-sm text-maroon-600">Connect with alumni worldwide</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 px-4 sm:px-6 lg:px-8">
                <div className="max-w-4xl mx-auto text-center">
                    <div className="bg-gradient-to-br from-maroon-100/60 to-beige-100/60 rounded-3xl p-12 backdrop-blur-sm border border-maroon-200">
                        <h2 className="text-4xl lg:text-5xl font-bold mb-6 text-maroon-900">
                            Ready to Join Our
                            <span className="block bg-gradient-to-r from-maroon-600 to-maroon-800 bg-clip-text text-transparent">
                                Alumni Community?
                            </span>
                        </h2>
                        <p className="text-xl text-maroon-700 mb-8 max-w-2xl mx-auto">
                            Start your journey today and unlock exclusive opportunities, connections, and resources.
                        </p>
                        <div className="flex flex-wrap justify-center gap-4">
                            <Link
                                href="/survey/register"
                                className="group px-10 py-5 bg-gradient-to-r from-maroon-600 to-maroon-700 hover:from-maroon-700 hover:to-maroon-800 rounded-xl font-semibold text-lg text-white transition-all transform hover:scale-105 shadow-2xl hover:shadow-maroon-500/50 flex items-center space-x-2"
                            >
                                <span>Create Account</span>
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <Link
                                href="/login"
                                className="px-10 py-5 bg-white/80 hover:bg-white backdrop-blur-sm border border-maroon-200 rounded-xl font-semibold text-lg text-maroon-900 transition-all"
                            >
                                Sign In
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-maroon-200">
                <div className="max-w-7xl mx-auto text-center">
                    <div className="flex items-center justify-center space-x-3 mb-4">
                        <div className="w-10 h-10 bg-gradient-to-br from-maroon-600 to-maroon-700 rounded-lg flex items-center justify-center">
                            <GraduationCap className="w-6 h-6 text-white" />
                        </div>
                        <span className="text-xl font-bold text-maroon-900">Alumni Tracer System</span>
                    </div>
                    <p className="text-maroon-600 mb-4">
                        Stay connected, track your career journey, and contribute to the growth of our alumni community.
                    </p>
                    <p className="text-sm text-maroon-500">
                        © {new Date().getFullYear()} Alumni Tracer System. All rights reserved.
                    </p>
                </div>
            </footer>

            <style>{`
                @keyframes blob {
                    0%, 100% { transform: translate(0, 0) scale(1); }
                    33% { transform: translate(30px, -50px) scale(1.1); }
                    66% { transform: translate(-20px, 20px) scale(0.9); }
                }
                @keyframes float {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-20px); }
                }
                @keyframes pulse-slow {
                    0%, 100% { opacity: 0.3; }
                    50% { opacity: 0.5; }
                }
                .animate-blob { animation: blob 7s infinite; }
                .animate-float { animation: float 3s ease-in-out infinite; }
                .animate-pulse-slow { animation: pulse-slow 4s ease-in-out infinite; }
                .animation-delay-2000 { animation-delay: 2s; }
                .animation-delay-4000 { animation-delay: 4s; }
            `}</style>
        </div>
    );
}
