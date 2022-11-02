# Discord Queueing bot
### V1.0  
Version 1.0 is now legacy code. It was a mini project to be familiarized with Javascript. \
The idea was to create a Discord Queueing bot which users can use to queue up for a game. \
Users can use text commands to:
- View the lineup of a specific game (view the names of players who want to play)
- Invite the discord server to join a specific game
- Notify players in a specific game to they want to start playing. (Bot tags the players)
- Dynamically add/remove games from the list of games available to queue up.
- Add/remove other players from a game lineup (in case the player is afk)
- Reset the lineup of a game

Main problem with this version was all the code was cluttered and crammed into a single file, index.js 

### V2.0
The new and improved Version 2.0, code-wise and UX-wise. \
The whole code was refactored so that there is structure. Every function is now in its appropriate file and folder \
Changes:
- The code now uses Typescript
- Lineups are now stored in a database (MongoDB). Previously the lineups are erased once the heroku/gcloud instance decides to restart.
- Caching!
- Command Aliases

This refactor is possible thanks to [allendomingo](https://github.com/allendomingo)

## Screenshots

![request](/github/request.JPG)

![complete](/github/complete.JPG)

![leave](/github/leave.JPG)

![queue](/github/queue.JPG)
