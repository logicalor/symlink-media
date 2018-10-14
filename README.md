# Symlink Media

A simple script to symlink media files in a source directory to a destination directory.  Its need arose due to a bug in Plex whereby it scans for media in a directory, and if it doesn't find any, it simply ignores that directory in future scans.  This bug causes issues if one is syncing large media files from a remote source straight to the Plex library directory.  Some ad hoc 'solutions' to this issue are to either sync files to a different directory and locally copy them to the Plex libary, or perform something called the "[Plex Dance](https://forums.plex.tv/t/the-plex-dance/197064)".  This script is a compromise between the two, as Plex happily works with symlinks.

The script globs a nominated directory for files matching a pattern, and then for each matching file it checks whether the parent directory exists and the file is already symlinked.  If the directory does not exist or the file is not already symlinked, it then performs a simple check of the file using `mediainfo`.  If the file is not truncated (normally meaning it is a complete media file), the parent directory is created at the destination if needed, then the symlink to the file is created in the destination directory.

## Installation

- From the cloned repo's root, run `npm i -s`. This will fetch required modules.
- Copy `sample.env` to `.env` and populate it with your desired configuration

## Usage

Simply run `node /your/path/symlinkmedia.js`.  Best option is to add it to a crontab so that it runs on a scheduled basis.
