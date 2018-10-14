require('dotenv').config()
const glob = require('glob')
const deferred = require('deferred')
const fs = require('fs')
const { exec } = require('child_process')

// Get our config
const dirSrc = process.env.DIR_SRC
const dirDest = process.env.DIR_DEST
const pathPattern = process.env.PATH_PATTERN
const concurrency = process.env.CONCURRENCY

// Promisify some async functions
const pGlob = deferred.promisify(glob)
const pExec = deferred.promisify(exec)

// Find matching files
pGlob(`${dirSrc}${pathPattern}`)(

  (files) => {

    // Get our path information
    deferred.map(files, (file) => {
      const d = deferred()
      d.resolve(file.replace(dirSrc, '').split('/'))
      return d.promise()
    })(      

      (paths) => {

        // Process our found paths
        deferred.map(paths, deferred.gate((parts) => {

          const d = deferred()
          const dir = `${dirDest}${parts[0]}`
          const file = parts[1]
          const srcPath = `${dirSrc}${parts[0]}/${file}`
          const destPath = `${dir}/${file}`
          const escapedSrcPath = srcPath.replace(/([ \(\)])/g, "\\$1")

          // If the destination directory doesn't already exist
          if (!fs.existsSync(dir)) {

            // Ensure the path contains a working media file
            pExec(`mediainfo ${escapedSrcPath}`)(
              (stdout, stderr) => {

                // If the file is truncated, skip
                if (stdout.join('\n').match(/IsTruncated/)) {
                }

                // Otherwise create the directory and symlink the file
                else {
                  fs.mkdirSync(dir, {recursive: true})
                  fs.symlinkSync(srcPath, destPath)
                }
                d.resolve()
              },
              (err) => {
                d.reject(err)
              }
            )
          }

          // If the destination directory exists but the file doesn't
          else if (!fs.existsSync(destPath)) {

            // Ensure the path contains a working media file
            pExec(`mediainfo ${escapedSrcPath}`)(
              (stdout, stderr) => {

                // If the file is truncated, skip
                if (stdout.join('\n').match(/IsTruncated/)) {
                }

                // Otherwise symlink the file
                else {
                  fs.symlinkSync(destPath, srcPath)
                }
                d.resolve()
              },
              (err) => {
                d.reject(err)
              }
            )
          }
          else {
            d.resolve()
          }
          return d.promise()

        // Process ${concurrency} paths at a time
        }, concurrency))(

          // If all succeeded, exit normally
          (result) => {
            process.exit()
          },

          // Otherwise emit an error
          (err) => {
            process.stderr.write(json_encode(err))
            process.exit(1)
          }
        )
      },

      // Emit the error
      (err) => {
        process.stderr.write(json_encode(err))
        process.exit(1)
      }
    )
  },

  // Emit the error
  (err) => {
    process.stderr.write(json_encode(err))
    process.exit(1)
  }
)
