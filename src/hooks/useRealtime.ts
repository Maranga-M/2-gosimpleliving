import { useEffect, useRef } from 'react';
import { supabase } from '../../supabase/config';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Product, BlogPost, SiteContent } from '../../types';

type RealtimeCallbacks = {
    onProductChange?: (product: Product, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onPostChange?: (post: BlogPost, eventType: 'INSERT' | 'UPDATE' | 'DELETE') => void;
    onSiteContentChange?: (content: SiteContent) => void;
    onAnalyticsInsert?: () => void;
};

/**
 * useRealtime - subscribes to live Supabase Realtime changes.
 *
 * Usage: call in AppContext with callbacks that update local state.
 * All subscriptions are cleaned up automatically on unmount.
 */
export const useRealtime = (callbacks: RealtimeCallbacks, enabled: boolean = true) => {
    const channelRef = useRef<RealtimeChannel | null>(null);
    const callbacksRef = useRef(callbacks);

    // Keep callbacks ref up to date without re-subscribing
    useEffect(() => {
        callbacksRef.current = callbacks;
    });

    useEffect(() => {
        if (!supabase || !enabled) return;

        const client = supabase; // narrowed to non-null

        // Clean up previous channel if re-subscribing
        if (channelRef.current) {
            client.removeChannel(channelRef.current);
        }

        const channel = client
            .channel('gsl-realtime')

            // --- Products ---
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'products' },
                (payload) => {
                    const cb = callbacksRef.current.onProductChange;
                    if (!cb) return;
                    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                    const record = (payload.new ?? payload.old) as Product;
                    if (record) cb(record, eventType);
                }
            )

            // --- Blog Posts ---
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'posts' },
                (payload) => {
                    const cb = callbacksRef.current.onPostChange;
                    if (!cb) return;
                    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
                    const record = (payload.new ?? payload.old) as BlogPost;
                    if (record) cb(record, eventType);
                }
            )

            // --- Site Content ---
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'site_content' },
                (payload) => {
                    const cb = callbacksRef.current.onSiteContentChange;
                    if (!cb) return;
                    if (payload.new?.content) {
                        cb(payload.new.content as SiteContent);
                    }
                }
            )

            // --- Analytics (just signal a refetch, don't expose raw rows to client) ---
            .on(
                'postgres_changes',
                { event: 'INSERT', schema: 'public', table: 'analytics' },
                () => {
                    callbacksRef.current.onAnalyticsInsert?.();
                }
            )

            .subscribe((status, err) => {
                if (status === 'SUBSCRIBED') {
                    console.log('[Realtime] Subscribed to live updates ✅');
                }
                if (err) {
                    console.warn('[Realtime] Subscription error:', err.message);
                }
            });

        channelRef.current = channel;

        return () => {
            if (channelRef.current) {
                client.removeChannel(channelRef.current);
                channelRef.current = null;
            }
        };
    }, [enabled]); // Only re-subscribe when `enabled` changes
};
