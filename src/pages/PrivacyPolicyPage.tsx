import React from 'react';
import { Shield, Lock, Eye, FileText } from 'lucide-react';
import { useApp } from '../contexts/AppContext';

export const PrivacyPolicyPage: React.FC = () => {
    const { content } = useApp();
    const { siteContent } = content;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-900 pt-24 pb-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center justify-center p-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 rounded-full mb-4">
                        <Shield size={32} />
                    </div>
                    <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Privacy Policy</h1>
                    <p className="text-lg text-slate-600 dark:text-slate-400">
                        Last Updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                {/* Content */}
                <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 p-8 md:p-12 prose dark:prose-invert max-w-none">
                    <p className="lead text-xl text-slate-600 dark:text-slate-300 mb-8">
                        At {siteContent.logoText}, we verify that specific pricing for different regions is effectively clear and displayed. Your privacy is critically important to us.
                    </p>

                    <div className="grid gap-8">
                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Eye className="text-blue-500" size={24} />
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Information We Collect</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                We only collect information that helps us improve your shopping experience. This includes:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-4">
                                <li>Browsing behavior to show you relevant products.</li>
                                <li>Device information to optimize our site for your screen.</li>
                                <li>Cookies to remember your preferences (like Dark Mode).</li>
                            </ul>
                        </section>

                        <hr className="border-slate-100 dark:border-slate-700 my-4" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <Lock className="text-green-500" size={24} />
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">How We Use Your Data</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                Your data is used solely for:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-4">
                                <li>Improving site functionality and speed.</li>
                                <li>Analyzing traffic patterns to understand what products differ by region.</li>
                                <li>Displaying relevant Amazon Affiliate products.</li>
                            </ul>
                        </section>

                        <hr className="border-slate-100 dark:border-slate-700 my-4" />

                        <section>
                            <div className="flex items-center gap-3 mb-4">
                                <FileText className="text-purple-500" size={24} />
                                <h2 className="text-2xl font-bold text-slate-900 dark:text-white m-0">Third-Party Services</h2>
                            </div>
                            <p className="text-slate-600 dark:text-slate-400">
                                We use trusted third-party services that may also collect data:
                            </p>
                            <ul className="list-disc pl-6 space-y-2 text-slate-600 dark:text-slate-400 mt-4">
                                <li><strong>Google Analytics:</strong> To understand site traffic.</li>
                                <li><strong>Google AdSense:</strong> To display relevant advertisements.</li>
                                <li><strong>Amazon Associates:</strong> As an Amazon Associate, we earn from qualifying purchases.</li>
                            </ul>
                        </section>
                    </div>

                    <div className="mt-12 p-6 bg-slate-50 dark:bg-slate-700/50 rounded-xl border border-slate-100 dark:border-slate-600">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Contact Us</h3>
                        <p className="text-slate-600 dark:text-slate-400 m-0">
                            If you have any questions about this Privacy Policy, please contact us at <a href={`mailto:support@${siteContent.logoText.toLowerCase().replace(/\s/g, '')}.com`} className="text-amber-600 hover:text-amber-700 dark:text-amber-500 font-medium">support@gosimpleliving.com</a>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};
