# Profile changelog

## 2026-10-09

- The Handlefree tile now shows Apple's official "Download on the App Store" badge (docs/icons/appstore-badge.svg, unmodified, the same file as on handlefree.app) instead of the text chip. build-bento.mjs gained image badges (`{ image, alt }`) for official store artwork.
- Handlefree moved to the first row of the bento (owner request), with a red "New release" badge beside App Store and Web and the tagline "Skip the handle of your Tesla. A simpler way in." Alt text adds the non-affiliation note.
- Handlefree is on the App Store (released 7 October 2026). Its tile (tile-handlefree) drops the BETA label and shows App Store and Web chips, like LUMEL. Only that tile was re-rendered; alt text and the tile list no longer say beta.

## 2026-10-06

- Added an iOS chip beside Web on the WiFi 4 Breakfast tile (tile-w4b) now that the iPhone and iPad app is live on the App Store. Only that tile was re-rendered; its alt text now reads "(web · iOS)".

## 2026-09-23

- Renamed the Teslatch beta tile to Handlefree (tile-handlefree), with the tagline "Skip the handle. One press." and a link to https://handlefree.app/. Icon and door art are unchanged apart from file names.

## 2026-09-21

- Added a full-width Teslatch beta tile immediately below Clip 4 Breakfast.
- Added approved icon and door-art layers and reproducible tile-teslatch rendering.
- Tile links to the OneKapisch product page; top-right badges show Beta, Web and iOS.
