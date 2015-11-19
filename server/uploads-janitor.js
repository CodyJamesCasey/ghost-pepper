'use strict';

const fs      = require('fs');
const path    = require('path');
const async   = require('async');
const rimraf  = require('rimraf');

const UPLOADS_DIR           = path.join(__dirname, '..', 'uploads');
// How old uploads are allowed to be before deleting them
const UPLOADS_AGE_LIMIT_MS  = 5 * 60 * 1000; // 5 minutes

/**
 * Deletes all files in UPLOADS_DIR (except .keep) older than
 * UPLOADS_AGE_LIMIT_MS.
 *
 * @return {Promise} the number of files deleted
 */
function deleteOldUploads() {
  return new Promise((resolve, reject) => {
    fs.readdir(UPLOADS_DIR, (err, files) => {
      if (err) {
        return reject(err);
      } else {
        // Calculate current time once
        let now = Date.now();
        // Files -> Filepaths
        let filePaths = files
          .filter(file => (file !== '.keep'))
          .map(file => path.join(UPLOADS_DIR, file));
        // Get stat on each file
        async.map(filePaths, fs.stat, (err, stats) => {
          if (err) {
            return reject(err);
          } else {
            // Get all the old filepaths
            let oldFilePaths = stats.map((stat, i) => {
              stat.path = filePaths[i];
              return stat;
            }).filter(stat => {
              let endTime = (new Date(stat.ctime)).getTime();
              return (now - endTime) >= UPLOADS_AGE_LIMIT_MS;
            }).map(stat => stat.path);
            // Remove each old file
            async.each(oldFilePaths, rimraf, err => {
              if (err) {
                return reject(err)
              } else {
                return resolve(oldFilePaths.length);
              }
            });
          }
        });
      }
    });
  });
}

/**
 * Invoked when its time for old uploads need to be deleted.
 */
function onCleanupTime() {
  console.log('Starting the uploads janitor...');
  deleteOldUploads()
    .then(filesDeleted => console.log(`...${filesDeleted} old uploads deleted.`))
    .catch(err => console.error('...uploads janitor failed:', err));
}

/**
 * Starts the uploads janitor.
 */
function start() {
  // Run once initially
  onCleanupTime();
  // Then schedule more
  setInterval(onCleanupTime, UPLOADS_AGE_LIMIT_MS);
}

module.exports = { start: start };
