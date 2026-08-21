-- ============================================================
-- FAST NUKE FUNCTION
-- Run this in Supabase SQL Editor first
-- ============================================================

CREATE OR REPLACE FUNCTION nuke_all_data()
RETURNS void AS $$
DECLARE
  table_name TEXT;
  tables_to_clear TEXT[] := ARRAY[
    'bug_reports', 'video_ads', 'discord_queue', 'discord_signals',
    'ad_variants', 'version_history', 'affiliate_clicks', 'analytics_events',
    'daily_stats', 'click_logs', 'request_logs', 'ip_whitelist',
    'worker_status', 'sticky_sessions', 'moderation_queue', 'audit_logs',
    'comment_reactions', 'comments', 'game_reviews', 'game_ratings',
    'mirrors', 'downloads', 'games', 'repackers', 'genres',
    'items', 'items_backup', 'download_pages', 'contact_messages',
    'delete_requests', 'page_modifiers', 'notifications',
    'user_favourites', 'user_watch_history', 'user_sessions', 'users',
    'proxy_servers'
  ];
BEGIN
  FOREACH table_name IN ARRAY tables_to_clear
  LOOP
    BEGIN
      EXECUTE format('DELETE FROM %I', table_name);
    EXCEPTION WHEN OTHERS THEN
      -- Skip tables that don't exist
      RAISE NOTICE 'Skipped %: %', table_name, SQLERRM;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
