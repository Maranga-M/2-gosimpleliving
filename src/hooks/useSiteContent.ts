import { useState, useMemo } from 'react';
import { SiteContent } from '../../types';
import { INITIAL_SITE_CONTENT } from '../../constants';
import { dbService } from '../../services/database';

export const useSiteContent = (userRole?: string) => {
    const [liveSiteContent, setLiveSiteContent] = useState<SiteContent>(INITIAL_SITE_CONTENT);
    const [previewSiteContent, setPreviewSiteContent] = useState<SiteContent>(INITIAL_SITE_CONTENT);
    const [isPreviewing, setIsPreviewing] = useState(false);

    const siteContent = useMemo(() => {
        return isPreviewing && userRole === 'admin' ? previewSiteContent : liveSiteContent;
    }, [isPreviewing, userRole, previewSiteContent, liveSiteContent]);

    const handleUpdateSiteContent = (content: SiteContent) => {
        setLiveSiteContent(content);
        setPreviewSiteContent(content);
    };

    const handleStartPreview = (draftContent: SiteContent) => {
        if (userRole === 'admin') {
            setPreviewSiteContent(draftContent);
            setIsPreviewing(true);
        }
    };

    const handleSaveChanges = async (contentToSave?: SiteContent) => {
        // Use provided content, or fall back to liveSiteContent (which is always in sync)
        const content = contentToSave || liveSiteContent;
        try {
            await dbService.saveSiteContent(content);
            setLiveSiteContent(content);
            setPreviewSiteContent(content);
            setIsPreviewing(false);
        } catch (error: any) {
            throw error; // Re-throw to let caller handle the error
        }
    };

    const handleExitPreview = () => {
        setIsPreviewing(false);
        setPreviewSiteContent(liveSiteContent);
    };

    return {
        siteContent, // The computed logic for what to show
        siteLogoUrl: siteContent.logoUrl, // Convenience getter for logo URL
        liveSiteContent, // The real data
        setLiveSiteContent,
        previewSiteContent,
        isPreviewing,
        setIsPreviewing,
        updateSiteContent: handleUpdateSiteContent, // Local update
        startPreview: handleStartPreview,
        saveChanges: handleSaveChanges, // DB Sync
        exitPreview: handleExitPreview
    };
};
