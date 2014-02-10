Karaoke App Story Workshop
==========================

Use Cases
---------
 - Given the functionality, can also be used as a shared audio player - anything the user can play from their session can ideally be fair game ... can we iframe to disallow access to JS variables?  If so, we should encode/unencode them so they never appear as plain text.  This way local JS Drive/YouTube/FB/etc SDKs can possibly safely be used?  To be secure, likely need to run through our Server API backend to get short lived tokens to render - don't want to render app key / secret into a page someone could HTML inspect!

Research
--------

 - Investigate current karaoke app/tool landscape (incl client app OS support)

Prototypes
----------

 - [x] Draw correct tiles from CDG with correct colors
 - [_] Find and read bytes from zip on Google Drive using JS client with authenticated OAuth2 access token
 - [_] Read MP3 and CDG out of zip bytes
 - [_] Drag and drop local directory of zip files from Chrome
 - [_] Full screen canvas and request animation frame polling for draw bytes (time loop tile w/ ref to docs)

Offline
-------

 - Library
   - File Browser
   - Play from
   - Import file

 - Play
   - Controls
   - CD+G Zip
   - Full screen CD+G
   - MP4
   - MP3
   - Read MP3 tags (MP3 & CD+G)
   - In separate window
   - Full screen in separate window
   - Render CD+G locally too - without audio
   - ? View MP4 locally too (paused frames if not full FPS?) - without audio / muted

 - Playlists
   - Create new
   - Add Songs
   - Play from
   - Pause between songs
   - Play MP3 during pause
   - Play random MP3 during pause

 - Users
   - Create New (anonymous guest)
   - Switch Users
   - Switch to new guest (N guests allowed)

 - ?
   - Star Ratings 
   - Notifications
   - Lock screen (keeping 2nd screen going)
   - Audio key control
   - Remember user's key control preference

Online Only
-----------

 - Login
   - with our account
   - with Facebook account
   - with Google
   
 - Library
   - DropBox Browsing
   - Google Drive Browsing
   - YouTube Browsing

 - Playlists
   - Browse YouTube Playlists
   - Play from YouTube Playlist
   - Share with user
   - Share to Spotify
   - Share to Facebook

 - Venues
   - Create
   - Venue Playlist view/editor
   - Venue Playlist has singer(s) associated with each item
   - Search by name
   - User can customize their name per venue (persisted)
   - Make visible online
   - Make searchable from exact IP Address
   - Make searchable from GPS
   - Invite Guest
   - Invite Admin
   - Remove User
   - Accept Invites
   - Set/unset Admin (can't unset last - must be 1)
   - Open Room to local IP
   - Open Room to nearby GPS
   - Open Room to all
   - Open room to those with static password
     - Change password with option to invalidate existing or not
   - Queue your own song to play
     - "Allow screen sharing" to all guests
     - "Allow screen sharing" to certain guests
     - Second guest gets logged in - login with one time token that allows limited access to the guest's account - ONLY media will play.  This doesn't play the other person's media.  It logs in as the other person to allow screen sharing 2nd monitor.  NO file browsing other people's libraries.
     - Actually, this doesn't need a second tab, it can be the video player in browser.  This also allows for users to karaoke with one another while in separate locations.  1 plays.  It plays on other people's screens.  Access locked down to one time to prevent sharing.  Also needs to prevent any way of possible cookie hijacking.  Use separate impersonation cookie with 1 time session, max length track time (+ buffer eg. 1 minute) ... or something simpler but still restrictive.  Similar model to turntable.fm.  People can upload their own tracks which can be played.  Note: the upload costs crippled them.  So don't run bytes through the server if they can be fetched via local Google Drive / DropBox JS client ... unless this shared API creds in clear text ... in which case we MUST use server to prevent these (or any other pieces of PII) from being persisted in any way on the host machine.  even pub/key could be used to handshake before sending cleartext bytes (over SSL) - meh ... one time token is likely totally enough.  Force SSL.

 ?
  - View Most Played
  - View Highest Rated
  - In-app Friends?
  - Browse queue and star/favorite other singer's performances or star/follow the singer
  - Maybe actually NO RATINGS ... that undermines Karaoke ... but maybe Like's.  No 1/5 stars --> harsh
  - Like.  Follow.

Desktop Chrome Only
-------------------

 - Library: Import Directory

Chrome Extension Only
---------------------

Packaged App Only
-----------------

 - Auto-Position Windows
 - Sync locally with Google Drive

Server API
----------

 - Credential references
 - Play data
 - Venues
 - Find Nearby Venues

Notes
-----

 - gzip streaming bytes
 - ECDSA asymmetric key available in pure Dart
 - Android streaming to Chromecast likely to come in Android >= 4.4.1
