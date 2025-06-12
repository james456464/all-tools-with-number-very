#!/bin/bash
cd server && node index.js &
cd ../bot && node bot.js
