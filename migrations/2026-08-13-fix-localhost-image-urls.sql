-- Backfill: strip baked-in absolute localhost URLs from image columns.
--
-- upload.controller.js and user.controller.js used to build image URLs from
-- req.protocol/req.get('host') at upload time. When a request reached the
-- app through a reverse proxy that didn't forward the public host, this
-- resolved to http://localhost:5001 and got stored permanently — those
-- images are unreachable from any real client. The upload controllers now
-- store relative paths (/uploads/...) instead; this migration fixes the
-- rows that already have the broken absolute form baked in.

UPDATE advertisements
SET images = REPLACE(images, 'http://localhost:5001', '')
WHERE images LIKE '%http://localhost:5001%';

UPDATE users
SET avatar = REPLACE(avatar, 'http://localhost:5001', '')
WHERE avatar LIKE '%http://localhost:5001%';
