# Media Center App

This is an in-development media center app written in python and js for desktop. It works on Windows and Linux (I've only tested it on kubuntu so far)

Features
- Uses vlc as the backend and eel for the gui
- Add movie, show, and music folders
- Auto scan and download movie and show metadata from themoviedb (can correct if wrong)
- With subtitle and multi audio track support
- A "radio" where you can add your own files as stations, and they will advance with time even if not actively playing
- A game browser/launcher
- Controller support (being worked on)

I designed it more for a system who's main function is media

It's a little janky with the gui as a separate window from the video window, but this is how I had to design it because I can't put the vlc video player in a browser. All music doesn't have the video window open though. I tried making it as seamless as possible, with the gui auto hiding/showing and poping in front of the video.

To launch just run the index.py file (executables coming later)

Dependencies:
- vlc
- python-vlc
- eel
- pywinctl
- moviepy
- win32api (on windows only)